#!/usr/bin/env python3
"""
Script to download all posts from an Ed Discussion course.
Uses browser_cookie3 with proper Chrome cookie extraction (similar to yt-dlp --cookies-from-browser).
"""

import json
import os
import sys
import sqlite3
import subprocess
from pathlib import Path
import requests
from datetime import datetime

def get_chrome_cookies_from_browser():
    """
    Extract cookies from Chrome using the system keychain (like yt-dlp does).
    This properly handles Chrome's encrypted cookies on macOS.
    """
    import browser_cookie3
    
    try:
        # This should work similarly to yt-dlp's --cookies-from-browser chrome
        cj = browser_cookie3.chrome(domain_name='edstem.org')
        
        cookies_dict = {}
        for cookie in cj:
            cookies_dict[cookie.name] = cookie.value
        
        return cookies_dict
    except Exception as e:
        print(f"Error extracting Chrome cookies: {e}")
        print("\nTrying alternative method...")
        
        # Try using the chromium method as fallback
        try:
            cj = browser_cookie3.chromium(domain_name='edstem.org')
            cookies_dict = {}
            for cookie in cj:
                cookies_dict[cookie.name] = cookie.value
            return cookies_dict
        except Exception as e2:
            print(f"Alternative method also failed: {e2}")
            return None

def download_ed_posts(course_id, output_dir="ed_posts"):
    """Download all posts from an Ed course."""
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    print("Extracting cookies from Chrome browser...")
    cookies_dict = get_chrome_cookies_from_browser()
    
    if not cookies_dict:
        print("\n" + "="*80)
        print("❌ Unable to extract cookies from Chrome.")
        print("\nPossible solutions:")
        print("1. Make sure Chrome is completely closed")
        print("2. Make sure you're logged into Ed at https://edstem.org")
        print("3. Try running the script with sudo (may need keychain access)")
        print("4. Check Chrome profile location")
        print("="*80)
        return False
    
    print(f"✓ Extracted {len(cookies_dict)} cookies from Chrome")
    
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
                print("Your session may have expired. Please:")
                print("1. Open Chrome and visit https://edstem.org")
                print("2. Make sure you're logged in")
                print("3. Close Chrome completely")
                print("4. Run this script again")
                return False
            
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
            if hasattr(e, 'response') and hasattr(e.response, 'text'):
                print(f"Response: {e.response.text[:200]}")
            break
        except Exception as e:
            print(f"Unexpected error: {e}")
            break
    
    if not all_threads:
        print("\n⚠️  No posts downloaded. Please check your authentication.")
        return False
    
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
            thread_file = os.path.join(detailed_dir, f"post_{thread_number:04d}_{thread_id}.json")
            with open(thread_file, 'w', encoding='utf-8') as f:
                json.dump(thread_detail, f, indent=2, ensure_ascii=False)
            
            success_count += 1
            
            if i % 10 == 0:
                print(f"  ✓ Downloaded {i}/{len(all_threads)} detailed posts...")
            
        except Exception as e:
            print(f"  ⚠️  Error downloading thread {thread_id}: {e}")
            continue
    
    print(f"\n✓ Downloaded {success_count}/{len(all_threads)} detailed posts")
    print(f"✓ All posts saved to: {output_dir}/")
    
    # Create a readable summary
    create_summary(all_threads, output_dir)
    
    # Create markdown summary
    create_markdown_summary(all_threads, output_dir)
    
    return True

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

def create_markdown_summary(threads, output_dir):
    """Create a markdown summary of all posts."""
    md_file = os.path.join(output_dir, "posts_summary.md")
    
    with open(md_file, 'w', encoding='utf-8') as f:
        f.write("# Ed Discussion Posts Summary\n\n")
        f.write(f"**Downloaded:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n")
        f.write(f"**Total Posts:** {len(threads)}\n\n")
        f.write("---\n\n")
        
        for thread in threads:
            number = thread.get('number', 'N/A')
            title = thread.get('title', 'No title')
            thread_type = thread.get('type', 'N/A')
            category = thread.get('category', 'N/A')
            views = thread.get('view_count', 0)
            replies = thread.get('comment_count', 0)
            user = thread.get('user', {})
            author = user.get('name', 'Unknown')
            created = thread.get('created_at', '')
            
            f.write(f"## Post #{number}: {title}\n\n")
            f.write(f"- **Type:** {thread_type}\n")
            f.write(f"- **Category:** {category}\n")
            f.write(f"- **Author:** {author}\n")
            f.write(f"- **Views:** {views}\n")
            f.write(f"- **Replies:** {replies}\n")
            if created:
                f.write(f"- **Created:** {created}\n")
            f.write("\n---\n\n")
    
    print(f"✓ Markdown summary saved to: {md_file}")

if __name__ == "__main__":
    course_id = "84647"
    
    print("=" * 80)
    print("Ed Discussion Post Downloader")
    print("Using Chrome cookies (like yt-dlp --cookies-from-browser chrome)")
    print("=" * 80)
    print(f"\nCourse ID: {course_id}")
    print("")
    
    try:
        success = download_ed_posts(course_id)
        if success:
            print("\n" + "=" * 80)
            print("✓ Download completed successfully!")
            print("=" * 80)
            sys.exit(0)
        else:
            print("\n" + "=" * 80)
            print("❌ Download failed. See errors above.")
            print("=" * 80)
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Download interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
