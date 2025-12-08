# Ed Discussion Posts - Course 84647

Complete archive of all discussion posts from the course.

## Download Information

- **Course ID:** 84647
- **Downloaded:** December 8, 2025
- **Total Posts:** 558
- **Status:** Complete ✓

## Files Structure

```
ed_posts/
├── README.md                           # This file
├── course_84647_all_posts.json        # All 558 posts in one JSON file (2.5MB)
├── posts_summary.txt                   # Human-readable text summary (162KB)
├── posts_summary.md                    # Markdown formatted summary (131KB)
└── detailed_posts/                     # Individual JSON files for each post (558 files)
    ├── post_0002_6886970.json
    ├── post_0003_6887086.json
    ├── ...
    └── post_0541_7419470.json
```

## File Descriptions

### `course_84647_all_posts.json`
- Contains all 558 posts with basic metadata
- Includes: title, type, category, status, views, replies, author, timestamps
- Use this for quick overview or programmatic access

### `detailed_posts/` directory
- Individual JSON files for each post
- Contains full post content including:
  - Complete post body (with markdown/HTML)
  - All comments and replies
  - Thread metadata
  - User information
  - Timestamps and edit history

### `posts_summary.txt` and `posts_summary.md`
- Human-readable summaries of all posts
- Sorted by post number
- Quick reference for browsing available posts

## Post Types

The posts include various types:
- **Questions** - Student questions
- **Announcements** - Course announcements
- **Posts** - General discussion posts
- **Answers** - Instructor responses

## Post Categories

Common categories found:
- Assignments (HW0, HW1, HW2, HW3, HW4, HW5)
- Lectures
- Logistics
- General
- Curiosity (Special Participation posts)

## Usage Examples

### Python - Load all posts

```python
import json

# Load all posts
with open('course_84647_all_posts.json', 'r') as f:
    posts = json.load(f)

print(f"Total posts: {len(posts)}")

# Get post titles
for post in posts[:5]:
    print(f"Post #{post['number']}: {post['title']}")
```

### Python - Load specific post details

```python
import json
import glob

# Find a specific post
post_files = glob.glob('detailed_posts/post_0100_*.json')
if post_files:
    with open(post_files[0], 'r') as f:
        post = json.load(f)
    
    print(f"Title: {post['thread']['title']}")
    print(f"Content: {post['thread']['document']}")
```

### Search posts by keyword

```bash
# Search in summaries
grep -i "homework" posts_summary.txt

# Search in detailed posts
grep -r "transformer" detailed_posts/
```

## Statistics

- **Total Posts:** 558
- **Post Number Range:** #2 - #541 (some numbers skipped)
- **Date Range:** Throughout the course semester
- **Total Size:** ~5.8 MB

## Notes

- Post numbers are not consecutive (some posts may have been deleted)
- All posts include metadata like view counts, reply counts, and timestamps
- Detailed post files preserve the complete Ed Discussion format
- Some posts may contain LaTeX math notation or code blocks

## Scripts Used

The following scripts were used to download this data:

1. `download_ed_final.py` - Main downloader using JWT token authentication
2. `retry_missing_posts.py` - Retry script for rate-limited posts

## Authentication

Downloaded using Ed's API with JWT token authentication via the `x-token` header.
The token is region-specific (US region: `us.edstem.org`).
