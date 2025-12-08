# Ed Discussion Post Downloader

This script downloads all posts from an Ed Discussion course using your Chrome browser cookies for authentication.

## Setup

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

## Usage

1. Make sure you're logged into Ed (https://edstem.org) in your Chrome browser
2. Run the script:
```bash
python download_ed_posts.py
```

The script will:
- Extract cookies from your Chrome browser
- Download all posts from course 84647
- Save them to the `ed_posts` directory with:
  - `course_84647_all_posts.json` - All posts in a single file
  - `detailed_posts/` - Individual JSON files for each post with full details
  - `posts_summary.txt` - Human-readable summary of all posts

## Output Structure

```
ed_posts/
├── course_84647_all_posts.json    # All posts
├── posts_summary.txt              # Human-readable summary
└── detailed_posts/                # Individual post files
    ├── post_1_xxxx.json
    ├── post_2_xxxx.json
    └── ...
```

## Troubleshooting

If you get authentication errors:
1. Make sure you're logged into Ed on Chrome
2. Try visiting the course page in Chrome first: https://edstem.org/us/courses/84647
3. Make sure Chrome is fully closed and reopened before running the script

## Note

This script respects Ed's rate limits and downloads posts sequentially to avoid overloading their servers.
