#!/usr/bin/env python3
"""
Ed Discussion Post Downloader
Downloads all posts from an Ed course using Chrome cookies (automatically extracted)
"""

import json
import os
import sys
import subprocess
import sqlite3
import shutil
import tempfile
from pathlib import Path
import requests
from datetime import datetime
import base64
import hashlib

def get_chrome_key_mac():
    """Get Chrome's encryption key from macOS keychain"""
    try:
        # Chrome Safe Storage password
        command = ['security', 'find-generic-password', '-w', '-s', 'Chrome Safe Storage', '-a', 'Chrome']
        result = subprocess.run(command, capture_output=True, text=True)
        
        if result.returncode == 0:
            password = result.stdout.strip()
            # Derive key from password
            from Crypto.Protocol.KDF import PBKDF2
            from Crypto.Cipher import AES
            
            # Chrome uses PBKDF2 with these parameters
            salt = b'saltysalt'
            iterations = 1003
            key_length = 16
            
            key = PBKDF2(password, salt, dkLen=key_length, count=iterations)
            return key
        else:
            return None
    except Exception as e:
        print(f"Could not get Chrome key: {e}")
        return None

def decrypt_chrome_cookie(encrypted_value, key):
    """Decrypt Chrome cookie value"""
    try:
        from Crypto.Cipher import AES
        
        # Chrome v10+ cookies start with 'v10' or 'v11'
        if encrypted_value[:3] == b'v10' or encrypted_value[:3] == b'v11':
            # Remove version prefix
            encrypted_value = encrypted_value[3:]
            
            # Chrome uses AES CBC with:
            # - IV is 16 spaces (0x20)
            # - Padding is PKCS7
            iv = b' ' * 16
            cipher = AES.new(key, AES.MODE_CBC, IV=iv)
            
            decrypted = cipher.decrypt(encrypted_value)
            
            # Remove PKCS7 padding
            padding_length = decrypted[-1]
            decrypted = decrypted[:-padding_length]
            
            return decrypted.decode('utf-8')
        else:
            # Older encryption or unencrypted
            return encrypted_value.decode('utf-8')
    except Exception as e:
        return None

def extract_chrome_cookies():
    """Extract and decrypt Chrome cookies for edstem.org"""
    
    # Find Chrome's cookie database
    chrome_paths = [
        Path.home() / "Library/Application Support/Google/Chrome/Default/Cookies",
        Path.home() / "Library/Application Support/Google/Chrome/Profile 1/Cookies",
    ]
    
    cookie_path = None
    for path in chrome_paths:
        if path.exists():
            cookie_path = path
            break
    
    if not cookie_path:
        print("Chrome cookie database not found")
        return {}
    
    print(f"Found Chrome cookies at: {cookie_path}")
    
    # Get decryption key
    key = get_chrome_key_mac()
    if not key:
        print("Could not get Chrome encryption key from keychain")
        print("You may need to grant permission in System Settings > Privacy & Security")
        return {}
    
    print("✓ Got Chrome encryption key")
    
    # Copy cookie database to temp location
    temp_db = tempfile.NamedTemporaryFile(delete=False, suffix='.db')
    temp_db.close()
    
    try:
        shutil.copy2(cookie_path, temp_db.name)
        
        # Connect to database
        conn = sqlite3.connect(temp_db.name)
        cursor = conn.cursor()
        
        # Query for edstem.org cookies
        cursor.execute("""
            SELECT name, encrypted_value, host_key, path, expires_utc
            FROM cookies 
            WHERE host_key LIKE '%edstem.org%'
        """)
        
        cookies = {}
        for name, encrypted_value, host, path, expires in cursor.fetchall():
            # Try to decrypt
            value = decrypt_chrome_cookie(encrypted_value, key)
            if value:
                cookies[name] = value
                print(f"✓ Extracted cookie: {name}")
        
        conn.close()
        
        return cookies
        
    except Exception as e:
        print(f"Error reading cookies: {e}")
        return {}
    finally:
        # Clean up temp file
        try:
            os.unlink(temp_db.name)
        except:
            pass

def download_ed_posts(course_id, cookies_dict, output_dir="ed_posts"):
    """Download all posts from an Ed course"""
    
    os.makedirs(output_dir, exist_ok=True)
    
    if not cookies_dict:
        print("\n❌ No cookies available. Cannot proceed.")
        return False
    
    print(f"\nUsing {len(cookies_dict)} cookies for authentication")
    
    # Create session
    session = requests.Session()
    
    # Add cookies
    for name, value in cookies_dict.items():
        session.cookies.set(name, value, domain='.edstem.org')
    
    # Add headers
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': f'https://edstem.org/us/courses/{course_id}/discussion',
        'Origin': 'https://edstem.org',
    })
    
    print(f"\nFetching posts from course {course_id}...")
    
    base_url = "https://edstem.org/api"
    all_threads = []
    limit = 30
    offset = 0
    
    while True:
        threads_url = f"{base_url}/courses/{course_id}/threads"
        params = {'limit': limit, 'offset': offset}
        
        try:
            response = session.get(threads_url, params=params)
            
            if response.status_code == 401:
                print("\n❌ Authentication failed!")
                print("Please make sure you're logged into Ed on Chrome and try again.")
                return False
            
            response.raise_for_status()
            data = response.json()
            
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
    print("Ed Discussion Post Downloader")
    print("Using Chrome cookies (automatic extraction with decryption)")
    print("=" * 80)
    print()
    
    course_id = "84647"
    
    # Extract cookies
    print("Extracting cookies from Chrome...")
    cookies = extract_chrome_cookies()
    
    if not cookies:
        print("\n" + "=" * 80)
        print("Failed to extract cookies automatically.")
        print("\nPlease ensure:")
        print("1. Chrome is installed and you've logged into edstem.org")
        print("2. You grant permission when macOS asks for keychain access")
        print("3. Chrome is fully closed before running this script")
        print("=" * 80)
        sys.exit(1)
    
    # Download posts
    try:
        success = download_ed_posts(course_id, cookies)
        
        if success:
            print("\n" + "=" * 80)
            print("✓ Download completed successfully!")
            print("  Check the 'ed_posts' directory for all downloaded content")
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
