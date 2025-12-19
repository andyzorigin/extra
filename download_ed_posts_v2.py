#!/usr/bin/env python3
"""
Script to download all posts from an Ed Discussion course using exported cookies.
"""

import json
import os
import sys
import sqlite3
import tempfile
import shutil
from pathlib import Path
import requests
from datetime import datetime

def get_chrome_cookies_manual():
    """
    Extract cookies from Chrome's cookie database manually.
    Chrome's cookie database is usually at:
    ~/Library/Application Support/Google/Chrome/Default/Cookies
    """
    
    # Possible Chrome cookie locations on macOS
    chrome_cookie_paths = [
        Path.home() / "Library/Application Support/Google/Chrome/Default/Cookies",
        Path.home() / "Library/Application Support/Google/Chrome/Profile 1/Cookies",
        Path.home() / "Library/Application Support/Google/Chrome/Default/Network/Cookies",
    ]
    
    cookies_dict = {}
    
    for cookie_path in chrome_cookie_paths:
        if not cookie_path.exists():
            continue
        
        print(f"Found Chrome cookies at: {cookie_path}")
        
        # Copy the cookie file to a temp location (Chrome might have it locked)
        temp_cookie_file = tempfile.NamedTemporaryFile(delete=False, suffix='.db')
        temp_cookie_file.close()
        
        try:
            shutil.copy2(cookie_path, temp_cookie_file.name)
            
            # Connect to the cookie database
            conn = sqlite3.connect(temp_cookie_file.name)
            cursor = conn.cursor()
            
            # Query for edstem.org cookies
            try:
                cursor.execute("""
                    SELECT name, value, host_key, path 
                    FROM cookies 
                    WHERE host_key LIKE '%edstem.org%'
                """)
                
                for name, value, host, path in cursor.fetchall():
                    print(f"Found cookie: {name}")
                    cookies_dict[name] = value
                    
            except sqlite3.OperationalError:
                # Try alternative column names (Chrome changes these sometimes)
                try:
                    cursor.execute("""
                        SELECT name, encrypted_value, host_key, path 
                        FROM cookies 
                        WHERE host_key LIKE '%edstem.org%'
                    """)
                    
                    for name, encrypted_value, host, path in cursor.fetchall():
                        if encrypted_value:
                            # On macOS, Chrome encrypts cookies but we might be able to get unencrypted ones
                            print(f"Found encrypted cookie: {name} (skipping decryption)")
                        
                except Exception as e:
                    print(f"Error reading cookies: {e}")
            
            conn.close()
            
        except Exception as e:
            print(f"Error accessing cookie file: {e}")
        finally:
            # Clean up temp file
            try:
                os.unlink(temp_cookie_file.name)
            except:
                pass
        
        if cookies_dict:
            break
    
    return cookies_dict

def load_cookies_from_json(json_file):
    """Load cookies from a JSON file exported from browser."""
    try:
        with open(json_file, 'r') as f:
            cookies_data = json.load(f)
        
        cookies_dict = {}
        
        # Handle different JSON formats
        if isinstance(cookies_data, list):
            # Netscape/EditThisCookie format
            for cookie in cookies_data:
                if 'name' in cookie and 'value' in cookie:
                    cookies_dict[cookie['name']] = cookie['value']
        elif isinstance(cookies_data, dict):
            # Simple key-value format
            cookies_dict = cookies_data
        
        return cookies_dict
    except Exception as e:
        print(f"Error loading cookies from JSON: {e}")
        return {}

def download_ed_posts(course_id, cookies_dict=None, output_dir="ed_posts"):
    """Download all posts from an Ed course."""
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    if not cookies_dict:
        print("No cookies provided. Trying to extract from Chrome...")
        cookies_dict = get_chrome_cookies_manual()
        
        if not cookies_dict:
            print("\n" + "="*80)
            print("Unable to automatically extract cookies from Chrome.")
            print("\nPlease manually export your cookies using one of these methods:")
            print("\n1. Chrome Extension Method (Recommended):")
            print("   - Install 'EditThisCookie' or 'Cookie-Editor' extension")
            print("   - Visit https://edstem.org")
            print("   - Click the extension icon")
            print("   - Export cookies as JSON")
            print("   - Save as 'cookies.json' in this directory")
            print("\n2. Manual Entry Method:")
            print("   - Visit https://edstem.org")
            print("   - Open Developer Tools (F12)")
            print("   - Go to Application/Storage -> Cookies")
            print("   - Find important cookies (especially 'session' or auth tokens)")
            print("   - Create a cookies.json file with format:")
            print('   {"cookie_name": "cookie_value", ...}')
            print("="*80)
            return
    
    # Create session
    session = requests.Session()
    
    # Add cookies to session
    for name, value in cookies_dict.items():
        session.cookies.set(name, value, domain='.edstem.org')
    
    # Add headers to mimic browser
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': f'https://edstem.org/us/courses/{course_id}/discussion',
        'Origin': 'https://edstem.org',
    })
    
    print(f"\nFetching posts from course {course_id}...")
    
    # Ed API endpoint for threads
    base_url = "https://edstem.org/api"
    
    all_threads = []
    limit = 30
    offset = 0
    
    while True:
        # Get threads (posts)
        threads_url = f"{base_url}/courses/{course_id}/threads"
        params = {
            'limit': limit,
            'offset': offset,
        }
        
        try:
            response = session.get(threads_url, params=params)
            
            if response.status_code == 401:
                print("\n❌ Authentication failed!")
                print("Your cookies may have expired or are invalid.")
                print("Please export fresh cookies from your browser.")
                return
            
            response.raise_for_status()
            data = response.json()
            
            threads = data.get('threads', [])
            if not threads:
                break
            
            print(f"✓ Downloaded {len(threads)} posts (offset: {offset})...")
            all_threads.extend(threads)
            
            # Check if there are more posts
            if len(threads) < limit:
                break
            
            offset += limit
            
        except requests.exceptions.RequestException as e:
            print(f"Error fetching threads: {e}")
            if hasattr(e.response, 'text'):
                print(f"Response: {e.response.text[:200]}")
            break
        except Exception as e:
            print(f"Unexpected error: {e}")
            break
    
    if not all_threads:
        print("\n⚠️  No posts downloaded. Please check your authentication.")
        return
    
    print(f"\n✓ Total posts downloaded: {len(all_threads)}")
    
    # Save all threads to JSON
    output_file = os.path.join(output_dir, f"course_{course_id}_all_posts.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_threads, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Saved all posts to: {output_file}")
    
    # Also download detailed information for each thread
    print("\nDownloading detailed information for each post...")
    
    detailed_dir = os.path.join(output_dir, "detailed_posts")
    os.makedirs(detailed_dir, exist_ok=True)
    
    success_count = 0
    for i, thread in enumerate(all_threads, 1):
        thread_id = thread.get('id')
        thread_number = thread.get('number', 'unknown')
        
        try:
            # Get full thread details
            thread_url = f"{base_url}/threads/{thread_id}"
            response = session.get(thread_url)
            response.raise_for_status()
            thread_detail = response.json()
            
            # Save individual thread
            thread_file = os.path.join(detailed_dir, f"post_{thread_number}_{thread_id}.json")
            with open(thread_file, 'w', encoding='utf-8') as f:
                json.dump(thread_detail, f, indent=2, ensure_ascii=False)
            
            success_count += 1
            
            if i % 10 == 0:
                print(f"  ✓ Downloaded {i}/{len(all_threads)} detailed posts...")
            
        except Exception as e:
            print(f"  ⚠️  Error downloading thread {thread_id}: {e}")
            continue
    
    print(f"\n✓ Downloaded {success_count}/{len(all_threads)} detailed posts")
    print(f"✓ All posts saved to: {output_dir}")
    
    # Create a readable summary
    create_summary(all_threads, output_dir)

def create_summary(threads, output_dir):
    """Create a human-readable summary of all posts."""
    summary_file = os.path.join(output_dir, "posts_summary.txt")
    
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("ED DISCUSSION POSTS SUMMARY\n")
        f.write(f"Downloaded: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Total Posts: {len(threads)}\n")
        f.write("=" * 80 + "\n\n")
        
        for thread in threads:
            f.write(f"Post #{thread.get('number', 'N/A')}: {thread.get('title', 'No title')}\n")
            f.write(f"ID: {thread.get('id')}\n")
            f.write(f"Type: {thread.get('type', 'N/A')}\n")
            f.write(f"Category: {thread.get('category', 'N/A')}\n")
            f.write(f"Status: {thread.get('status', 'N/A')}\n")
            f.write(f"Views: {thread.get('view_count', 0)}\n")
            f.write(f"Replies: {thread.get('comment_count', 0)}\n")
            
            # User info
            user = thread.get('user', {})
            f.write(f"Author: {user.get('name', 'Unknown')}\n")
            
            # Timestamps
            created = thread.get('created_at', '')
            if created:
                f.write(f"Created: {created}\n")
            
            f.write("-" * 80 + "\n\n")
    
    print(f"✓ Summary saved to: {summary_file}")

if __name__ == "__main__":
    course_id = "84647"
    
    print("=" * 80)
    print("Ed Discussion Post Downloader v2")
    print("=" * 80)
    print(f"\nCourse ID: {course_id}")
    
    # Check if cookies.json exists
    cookies_file = "cookies.json"
    cookies_dict = None
    
    if os.path.exists(cookies_file):
        print(f"Loading cookies from {cookies_file}...")
        cookies_dict = load_cookies_from_json(cookies_file)
        if cookies_dict:
            print(f"✓ Loaded {len(cookies_dict)} cookies")
    
    try:
        download_ed_posts(course_id, cookies_dict)
    except KeyboardInterrupt:
        print("\n\nDownload interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
