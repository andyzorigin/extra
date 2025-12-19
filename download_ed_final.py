#!/usr/bin/env python3
"""
Ed Discussion Post Downloader using JWT token authentication
"""

import json
import os
import sys
import requests
from datetime import datetime

def download_ed_posts(course_id, token, output_dir="ed_posts"):
    """Download all posts from Ed course using JWT token"""
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Create session
    session = requests.Session()
    
    # Add headers with token
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://edstem.org',
        'Referer': f'https://edstem.org/us/courses/{course_id}/discussion',
        'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'x-token': token,
    })
    
    print(f"Fetching posts from course {course_id}...")
    print("Using US region API endpoint\n")
    
    base_url = "https://us.edstem.org/api"
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
                print("Your token may have expired. Please get a new token from Chrome DevTools.")
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
            if hasattr(e, 'response') and hasattr(e.response, 'text'):
                print(f"Response: {e.response.text[:200]}")
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
    print("\nDownloading detailed information for each post...")
    
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
    create_summaries(all_threads, output_dir, course_id)
    
    return True

def create_summaries(threads, output_dir, course_id):
    """Create text and markdown summaries"""
    
    # Text summary
    txt_file = os.path.join(output_dir, "posts_summary.txt")
    with open(txt_file, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write(f"ED DISCUSSION POSTS - Course {course_id}\n")
        f.write(f"Downloaded: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Total Posts: {len(threads)}\n")
        f.write("=" * 80 + "\n\n")
        
        for thread in threads:
            f.write(f"Post #{thread.get('number', 'N/A')}: {thread.get('title', 'No title')}\n")
            f.write(f"  ID: {thread.get('id')}\n")
            f.write(f"  Type: {thread.get('type', 'N/A')}\n")
            f.write(f"  Category: {thread.get('category', 'N/A')}\n")
            f.write(f"  Status: {thread.get('status', 'N/A')}\n")
            f.write(f"  Views: {thread.get('view_count', 0)} | Replies: {thread.get('comment_count', 0)}\n")
            f.write(f"  Author: {thread.get('user', {}).get('name', 'Unknown')}\n")
            f.write(f"  Created: {thread.get('created_at', 'N/A')}\n")
            
            # Add snippet if available
            snippet = thread.get('snippet', '')
            if snippet:
                f.write(f"  Preview: {snippet[:100]}...\n")
            
            f.write("-" * 80 + "\n\n")
    
    print(f"✓ Summary saved to: {txt_file}")
    
    # Markdown summary
    md_file = os.path.join(output_dir, "posts_summary.md")
    with open(md_file, 'w', encoding='utf-8') as f:
        f.write(f"# Ed Discussion Posts - Course {course_id}\n\n")
        f.write(f"**Downloaded:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n")
        f.write(f"**Total Posts:** {len(threads)}\n\n")
        f.write("---\n\n")
        
        for thread in threads:
            number = thread.get('number', 'N/A')
            title = thread.get('title', 'No title')
            thread_type = thread.get('type', 'N/A')
            category = thread.get('category', 'N/A')
            status = thread.get('status', 'N/A')
            
            f.write(f"## Post #{number}: {title}\n\n")
            f.write(f"- **Type:** {thread_type}\n")
            f.write(f"- **Category:** {category}\n")
            f.write(f"- **Status:** {status}\n")
            f.write(f"- **Author:** {thread.get('user', {}).get('name', 'Unknown')}\n")
            f.write(f"- **Views:** {thread.get('view_count', 0)}\n")
            f.write(f"- **Replies:** {thread.get('comment_count', 0)}\n")
            f.write(f"- **Created:** {thread.get('created_at', 'N/A')}\n")
            
            snippet = thread.get('snippet', '')
            if snippet:
                f.write(f"\n{snippet}\n")
            
            f.write("\n---\n\n")
    
    print(f"✓ Markdown summary saved to: {md_file}")

def get_token_from_network_log():
    """Extract token from Chrome DevTools network log"""
    print("\nTo get your authentication token:")
    print("1. Open Chrome DevTools (Cmd+Option+I)")
    print("2. Go to the 'Network' tab")
    print("3. Refresh the Ed page")
    print("4. Look for a request to 'api/user' or 'api/threads'")
    print("5. Click on it and find the 'x-token' header in Request Headers")
    print("6. Copy the token value\n")
    
    token = input("Paste your x-token here: ").strip()
    return token

if __name__ == "__main__":
    print("=" * 80)
    print("Ed Discussion Post Downloader")
    print("=" * 80)
    print()
    
    course_id = "84647"
    
    # Use the token from your network log
    # You can hardcode it here or get it interactively
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoidG9rZW4iLCJ1c2VyX2lkIjoxNjgzNjU3LCJzZXNzaW9uX2lkIjoxNTUwNzY1MDQsInJlZ2lvbiI6IiIsImlhdCI6MTc2NTIyNDMyNSwiZXhwIjoxNzY2NDMzOTI1fQ.Id-Nr4J8bU3k9afQ2h96KZplSsFKoeiuk-m34NuSRJA"
    
    if not token or token == "YOUR_TOKEN_HERE":
        token = get_token_from_network_log()
    
    if not token:
        print("❌ No token provided")
        sys.exit(1)
    
    print(f"Using token: {token[:50]}...")
    print()
    
    # Download posts
    try:
        success = download_ed_posts(course_id, token)
        
        if success:
            print("\n" + "=" * 80)
            print("✓ Download completed successfully!")
            print(f"  All posts saved to 'ed_posts' directory")
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
