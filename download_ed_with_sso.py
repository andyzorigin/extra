#!/usr/bin/env python3
"""
Ed Discussion Post Downloader with Berkeley SSO support
"""

import json
import os
import sys
import sqlite3
import shutil
import tempfile
import subprocess
from pathlib import Path
import requests
from datetime import datetime

def get_chrome_key_mac():
    """Get Chrome's encryption key from macOS keychain"""
    try:
        command = ['security', 'find-generic-password', '-w', '-s', 'Chrome Safe Storage', '-a', 'Chrome']
        result = subprocess.run(command, capture_output=True, text=True)
        
        if result.returncode == 0:
            password = result.stdout.strip()
            from Crypto.Protocol.KDF import PBKDF2
            
            salt = b'saltysalt'
            iterations = 1003
            key_length = 16
            
            key = PBKDF2(password, salt, dkLen=key_length, count=iterations)
            return key
        return None
    except Exception as e:
        return None

def decrypt_chrome_cookie(encrypted_value, key):
    """Decrypt Chrome cookie value"""
    try:
        from Crypto.Cipher import AES
        
        if encrypted_value[:3] == b'v10' or encrypted_value[:3] == b'v11':
            encrypted_value = encrypted_value[3:]
            iv = b' ' * 16
            cipher = AES.new(key, AES.MODE_CBC, IV=iv)
            decrypted = cipher.decrypt(encrypted_value)
            padding_length = decrypted[-1]
            decrypted = decrypted[:-padding_length]
            return decrypted.decode('utf-8')
        else:
            return encrypted_value.decode('utf-8')
    except Exception as e:
        return None

def extract_all_relevant_cookies():
    """Extract cookies from all domains that might be needed (edstem.org, berkeley.edu, etc.)"""
    
    chrome_paths = [
        Path.home() / "Library/Application Support/Google/Chrome/Default/Cookies",
        Path.home() / "Library/Application Support/Google/Chrome/Profile 1/Cookies",
        Path.home() / "Library/Application Support/Google/Chrome/Profile 2/Cookies",
        Path.home() / "Library/Application Support/Google/Chrome/Profile 3/Cookies",
    ]
    
    key = get_chrome_key_mac()
    if not key:
        print("⚠️  Could not get Chrome encryption key")
        return {}
    
    print("✓ Got Chrome encryption key")
    
    all_cookies = {}
    
    for cookie_path in chrome_paths:
        if not cookie_path.exists():
            continue
        
        profile_name = cookie_path.parent.name
        print(f"\nChecking profile: {profile_name}")
        
        temp_db = tempfile.NamedTemporaryFile(delete=False, suffix='.db')
        temp_db.close()
        
        try:
            shutil.copy2(cookie_path, temp_db.name)
            conn = sqlite3.connect(temp_db.name)
            cursor = conn.cursor()
            
            # Get cookies from edstem.org, berkeley.edu, and related domains
            domains = ['%edstem%', '%berkeley.edu%']
            
            for domain_pattern in domains:
                cursor.execute("""
                    SELECT name, encrypted_value, host_key, path
                    FROM cookies 
                    WHERE host_key LIKE ?
                """, (domain_pattern,))
                
                for name, encrypted_value, host, path in cursor.fetchall():
                    value = decrypt_chrome_cookie(encrypted_value, key)
                    if value:
                        cookie_key = f"{name}:{host}"
                        all_cookies[cookie_key] = {
                            'name': name,
                            'value': value,
                            'domain': host,
                            'path': path
                        }
                        print(f"  ✓ {name} ({host})")
            
            conn.close()
            
        except Exception as e:
            print(f"  Error: {e}")
        finally:
            try:
                os.unlink(temp_db.name)
            except:
                pass
    
    return all_cookies

def download_ed_posts(course_id, cookies_dict, output_dir="ed_posts"):
    """Download all posts from Ed course"""
    
    os.makedirs(output_dir, exist_ok=True)
    
    if not cookies_dict:
        print("\n❌ No cookies available")
        return False
    
    print(f"\n{'='*80}")
    print(f"Using {len(cookies_dict)} cookies for authentication")
    print(f"{'='*80}\n")
    
    # Create session
    session = requests.Session()
    
    # Add all cookies (including Berkeley SSO)
    for cookie_info in cookies_dict.values():
        session.cookies.set(
            cookie_info['name'], 
            cookie_info['value'],
            domain=cookie_info['domain'],
            path=cookie_info['path']
        )
    
    # Add headers
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': f'https://edstem.org/us/courses/{course_id}/discussion',
        'Origin': 'https://edstem.org',
    })
    
    print(f"Fetching posts from course {course_id}...")
    
    base_url = "https://edstem.org/api"
    all_threads = []
    limit = 30
    offset = 0
    
    while True:
        threads_url = f"{base_url}/courses/{course_id}/threads"
        params = {'limit': limit, 'offset': offset}
        
        try:
            response = session.get(threads_url, params=params, allow_redirects=True)
            
            print(f"  Status: {response.status_code}, URL: {response.url}")
            
            if response.status_code == 401 or response.status_code == 403:
                print("\n❌ Authentication failed!")
                print("Response:", response.text[:500])
                return False
            
            if response.status_code == 302 or 'berkeley.edu' in response.url:
                print("\n⚠️  Got redirected to Berkeley SSO")
                print("You may need to complete SSO authentication in browser first")
                return False
            
            response.raise_for_status()
            
            # Check if response is JSON
            try:
                data = response.json()
            except:
                print("\n❌ Response is not JSON:", response.text[:200])
                return False
            
            threads = data.get('threads', [])
            if not threads:
                break
            
            print(f"✓ Downloaded {len(threads)} posts (offset: {offset})...")
            all_threads.extend(threads)
            
            if len(threads) < limit:
                break
            
            offset += limit
            
        except Exception as e:
            print(f"Error: {e}")
            break
    
    if not all_threads:
        print("\n⚠️  No posts downloaded")
        return False
    
    print(f"\n✓ Total posts downloaded: {len(all_threads)}")
    
    # Save all posts
    output_file = os.path.join(output_dir, f"course_{course_id}_all_posts.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_threads, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Saved all posts to: {output_file}")
    
    # Download detailed posts
    print("\nDownloading detailed information...")
    
    detailed_dir = os.path.join(output_dir, "detailed_posts")
    os.makedirs(detailed_dir, exist_ok=True)
    
    success_count = 0
    for i, thread in enumerate(all_threads, 1):
        thread_id = thread.get('id')
        thread_number = thread.get('number', 'unknown')
        
        try:
            thread_url = f"{base_url}/threads/{thread_id}"
            response = session.get(thread_url)
            response.raise_for_status()
            thread_detail = response.json()
            
            thread_file = os.path.join(detailed_dir, f"post_{thread_number:04d}_{thread_id}.json")
            with open(thread_file, 'w', encoding='utf-8') as f:
                json.dump(thread_detail, f, indent=2, ensure_ascii=False)
            
            success_count += 1
            
            if i % 10 == 0:
                print(f"  ✓ {i}/{len(all_threads)} detailed posts...")
            
        except Exception as e:
            print(f"  ⚠️  Error on thread {thread_id}: {e}")
            continue
    
    print(f"\n✓ Downloaded {success_count}/{len(all_threads)} detailed posts")
    
    # Create summaries
    create_summaries(all_threads, output_dir)
    
    return True

def create_summaries(threads, output_dir):
    """Create text and markdown summaries"""
    
    # Text summary
    txt_file = os.path.join(output_dir, "posts_summary.txt")
    with open(txt_file, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("ED DISCUSSION POSTS SUMMARY\n")
        f.write(f"Downloaded: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Total Posts: {len(threads)}\n")
        f.write("=" * 80 + "\n\n")
        
        for thread in threads:
            f.write(f"Post #{thread.get('number', 'N/A')}: {thread.get('title', 'No title')}\n")
            f.write(f"  Type: {thread.get('type', 'N/A')}\n")
            f.write(f"  Category: {thread.get('category', 'N/A')}\n")
            f.write(f"  Views: {thread.get('view_count', 0)} | Replies: {thread.get('comment_count', 0)}\n")
            f.write(f"  Author: {thread.get('user', {}).get('name', 'Unknown')}\n")
            f.write(f"  Created: {thread.get('created_at', 'N/A')}\n")
            f.write("-" * 80 + "\n\n")
    
    print(f"✓ Summary saved to: {txt_file}")
    
    # Markdown summary
    md_file = os.path.join(output_dir, "posts_summary.md")
    with open(md_file, 'w', encoding='utf-8') as f:
        f.write("# Ed Discussion Posts\n\n")
        f.write(f"**Downloaded:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n")
        f.write(f"**Total Posts:** {len(threads)}\n\n")
        f.write("---\n\n")
        
        for thread in threads:
            number = thread.get('number', 'N/A')
            title = thread.get('title', 'No title')
            f.write(f"## Post #{number}: {title}\n\n")
            f.write(f"- **Type:** {thread.get('type', 'N/A')}\n")
            f.write(f"- **Category:** {thread.get('category', 'N/A')}\n")
            f.write(f"- **Author:** {thread.get('user', {}).get('name', 'Unknown')}\n")
            f.write(f"- **Views:** {thread.get('view_count', 0)}\n")
            f.write(f"- **Replies:** {thread.get('comment_count', 0)}\n")
            f.write(f"- **Created:** {thread.get('created_at', 'N/A')}\n")
            f.write("\n---\n\n")
    
    print(f"✓ Markdown summary saved to: {md_file}")

if __name__ == "__main__":
    print("=" * 80)
    print("Ed Discussion Post Downloader (with Berkeley SSO support)")
    print("=" * 80)
    print()
    
    course_id = "84647"
    
    # Extract cookies including Berkeley SSO
    print("Extracting cookies from Chrome (including Berkeley SSO)...")
    cookies = extract_all_relevant_cookies()
    
    if not cookies:
        print("\n" + "=" * 80)
        print("Failed to extract cookies.")
        print("\nPlease ensure:")
        print("1. You're logged into Ed via Berkeley SSO in Chrome")
        print("2. Chrome is fully closed before running this script")
        print("3. You grant keychain access if macOS prompts you")
        print("=" * 80)
        sys.exit(1)
    
    # Download posts
    try:
        success = download_ed_posts(course_id, cookies)
        
        if success:
            print("\n" + "=" * 80)
            print("✓ Download completed successfully!")
            print("  Check the 'ed_posts' directory for all content")
            print("=" * 80)
            sys.exit(0)
        else:
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
