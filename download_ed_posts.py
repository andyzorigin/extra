#!/usr/bin/env python3
"""
Script to download all posts from an Ed Discussion course using Chrome cookies.
"""

import json
import os
import sqlite3
import sys
from pathlib import Path
import requests
from datetime import datetime
import browser_cookie3

def get_chrome_cookies():
    """Extract cookies from Chrome browser."""
    try:
        # browser_cookie3 automatically finds Chrome cookies
        return browser_cookie3.chrome(domain_name='edstem.org')
    except Exception as e:
        print(f"Error getting Chrome cookies: {e}")
        print("\nTrying alternative method...")
        return None

def download_ed_posts(course_id, output_dir="ed_posts"):
    """Download all posts from an Ed course."""
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Get cookies
    print("Extracting Chrome cookies...")
    cookies = get_chrome_cookies()
    
    if not cookies:
        print("Failed to get cookies. Make sure you're logged into Ed on Chrome.")
        return
    
    # Create session
    session = requests.Session()
    session.cookies = cookies
    
    # Add headers to mimic browser
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': f'https://edstem.org/us/courses/{course_id}/discussion',
    })
    
    print(f"Fetching posts from course {course_id}...")
    
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
            response.raise_for_status()
            data = response.json()
            
            threads = data.get('threads', [])
            if not threads:
                break
            
            print(f"Downloaded {len(threads)} posts (offset: {offset})...")
            all_threads.extend(threads)
            
            # Check if there are more posts
            if len(threads) < limit:
                break
            
            offset += limit
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                print("Authentication failed. Please make sure you're logged into Ed on Chrome.")
            else:
                print(f"HTTP Error: {e}")
            break
        except Exception as e:
            print(f"Error fetching threads: {e}")
            break
    
    print(f"\nTotal posts downloaded: {len(all_threads)}")
    
    # Save all threads to JSON
    output_file = os.path.join(output_dir, f"course_{course_id}_all_posts.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_threads, f, indent=2, ensure_ascii=False)
    
    print(f"Saved all posts to: {output_file}")
    
    # Also download detailed information for each thread
    print("\nDownloading detailed information for each post...")
    
    detailed_dir = os.path.join(output_dir, "detailed_posts")
    os.makedirs(detailed_dir, exist_ok=True)
    
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
            
            if i % 10 == 0:
                print(f"  Downloaded {i}/{len(all_threads)} detailed posts...")
            
        except Exception as e:
            print(f"  Error downloading thread {thread_id}: {e}")
            continue
    
    print(f"\nDownload complete! All posts saved to: {output_dir}")
    
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
    
    print(f"Summary saved to: {summary_file}")

if __name__ == "__main__":
    course_id = "84647"
    
    print("=" * 80)
    print("Ed Discussion Post Downloader")
    print("=" * 80)
    print(f"\nCourse ID: {course_id}")
    print("Using Chrome cookies for authentication...\n")
    
    try:
        download_ed_posts(course_id)
    except KeyboardInterrupt:
        print("\n\nDownload interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
