#!/usr/bin/env python3
"""
Parse Special Participation A and B posts and extract structured data for the website.
"""

import json
import os
import re
from pathlib import Path
from typing import Dict, List, Any
from collections import defaultdict

def extract_llm_name(title: str, content: str) -> str:
    """Extract the LLM model name from title or content."""
    text = title + " " + content[:500]  # Check title and first 500 chars
    
    # Expanded LLM patterns - check for more specific patterns first
    llm_patterns = [
        # Specific version patterns
        (r'ChatGPT[- ]?o1[- ]?(pro|preview|mini)?', 'ChatGPT o1'),
        (r'GPT[- ]?o1[- ]?(pro|preview|mini)?', 'ChatGPT o1'),
        (r'o1[- ]?(pro|preview|mini)', 'ChatGPT o1'),
        (r'o3[- ]?(mini)?', 'ChatGPT o3'),
        (r'ChatGPT[- ]?5\.?1', 'ChatGPT 5.1'),
        (r'GPT[- ]?5\.?1', 'GPT 5.1'),
        (r'ChatGPT[- ]?5\.?0', 'ChatGPT 5.0'),
        (r'GPT[- ]?5\.?0', 'GPT 5.0'),
        (r'ChatGPT[- ]?5', 'ChatGPT 5'),
        (r'GPT[- ]?5', 'GPT 5'),
        (r'ChatGPT[- ]?4o[- ]?mini', 'ChatGPT 4o mini'),
        (r'GPT[- ]?4o[- ]?mini', 'GPT 4o mini'),
        (r'ChatGPT[- ]?4o', 'ChatGPT 4o'),
        (r'GPT[- ]?4o', 'GPT 4o'),
        (r'ChatGPT[- ]?4', 'ChatGPT 4'),
        (r'GPT[- ]?4', 'GPT 4'),
        (r'ChatGPT[- ]?3\.5', 'ChatGPT 3.5'),
        (r'GPT[- ]?3\.5', 'GPT 3.5'),
        (r'Claude[- ]?3\.5[- ]?(Sonnet|Opus|Haiku)?', 'Claude 3.5'),
        (r'Claude[- ]?3[- ]?(Sonnet|Opus|Haiku)?', 'Claude 3'),
        (r'Claude[- ]?(Sonnet|Opus)', 'Claude'),
        (r'Gemini[- ]?3[- ]?Pro', 'Gemini 3 Pro'),
        (r'Gemini[- ]?2\.5[- ]?Flash', 'Gemini 2.5 Flash'),
        (r'Gemini[- ]?2\.5[- ]?Pro', 'Gemini 2.5 Pro'),
        (r'Gemini[- ]?2\.5', 'Gemini 2.5'),
        (r'Gemini[- ]?2[- ]?Flash', 'Gemini 2 Flash'),
        (r'Gemini[- ]?2', 'Gemini 2'),
        (r'Gemini[- ]?1\.5[- ]?Pro', 'Gemini 1.5 Pro'),
        (r'Gemini[- ]?1\.5', 'Gemini 1.5'),
        (r'Gemini', 'Gemini'),
        (r'Deep[- ]?Seek', 'DeepSeek'),
        (r'Llama[- ]?4[- ]?Maverick', 'Llama 4 Maverick'),
        (r'Llama[- ]?4', 'Llama 4'),
        (r'Llama[- ]?3\.?3', 'Llama 3.3'),
        (r'Llama[- ]?3\.?2', 'Llama 3.2'),
        (r'Llama[- ]?3\.?1', 'Llama 3.1'),
        (r'Llama[- ]?3', 'Llama 3'),
        (r'Perplexity', 'Perplexity'),
        (r'Mistral', 'Mistral'),
        (r'Grok', 'Grok'),
    ]
    
    for pattern, name in llm_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return name
    
    return "Not specified"

def extract_homework(title: str, content: str) -> str:
    """Extract which homework assignment was used."""
    hw_pattern = r'HW\s*(\d+)'
    text = title + " " + content
    match = re.search(hw_pattern, text, re.IGNORECASE)
    if match:
        return f"HW{match.group(1)}"
    return "Not specified"

def extract_links(content: str) -> Dict[str, List[str]]:
    """Extract links from content."""
    links = {
        'chat_links': [],
        'drive_links': [],
        'github_links': [],
        'website_links': [],
        'other_links': []
    }
    
    # Find all URLs
    url_pattern = r'https?://[^\s<>"]+'
    urls = re.findall(url_pattern, content)
    
    for url in urls:
        if 'chat.openai.com' in url or 'chatgpt.com' in url or 'claude.ai' in url or 'chat.deepseek.com' in url:
            links['chat_links'].append(url)
        elif 'drive.google.com' in url or 'docs.google.com' in url:
            links['drive_links'].append(url)
        elif 'github.com' in url:
            links['github_links'].append(url)
        elif any(domain in url for domain in ['.com', '.org', '.io', '.ai']) and 'edstem.org' not in url:
            links['other_links'].append(url)
    
    return links

def categorize_insights(content: str) -> List[str]:
    """Categorize the type of insights shared."""
    categories = []
    
    content_lower = content.lower()
    
    # Check for different types of insights
    if any(word in content_lower for word in ['hallucination', 'hallucinated', 'made up', 'fabricated']):
        categories.append('hallucinations')
    
    if any(word in content_lower for word in ['error', 'mistake', 'wrong', 'incorrect', 'failed']):
        categories.append('errors')
    
    if any(word in content_lower for word in ['explained', 'explanation', 'reasoning', 'understand']):
        categories.append('explanations')
    
    if any(word in content_lower for word in ['one shot', 'single step', 'immediately']):
        categories.append('one-shot solving')
    
    if any(word in content_lower for word in ['iterate', 'back-and-forth', 'follow-up', 'questioned itself', 'doubt']):
        categories.append('iterative problem-solving')
    
    if any(word in content_lower for word in ['prompt', 'prompting', 'engineered']):
        categories.append('prompt engineering')
    
    if any(word in content_lower for word in ['correct', 'accurate', 'right answer', 'solved']):
        categories.append('correct solutions')
    
    if any(word in content_lower for word in ['helpful', 'useful', 'good']):
        categories.append('helpful')
    
    if any(word in content_lower for word in ['confus', 'unclear', 'ambiguous']):
        categories.append('confusion')
    
    return categories if categories else ['general']

def parse_post(post_file: Path) -> Dict[str, Any]:
    """Parse a single post JSON file."""
    with open(post_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    thread = data['thread']
    users = {user['id']: user for user in data.get('users', [])}
    
    # Get author info
    author = users.get(thread['user_id'], {})
    author_name = author.get('name', 'Unknown')
    
    # Extract participation type
    title = thread['title']
    participation_type = None
    if 'Special Participation A' in title:
        participation_type = 'A'
    elif 'Special Participation B' in title:
        participation_type = 'B'
    
    if not participation_type:
        return None
    
    content = thread['document']
    
    # Extract structured data
    llm_name = extract_llm_name(title, content)
    homework = extract_homework(title, content)
    links = extract_links(content)
    categories = categorize_insights(content)
    
    return {
        'id': thread['id'],
        'number': thread['number'],
        'title': title,
        'content': content,
        'participation_type': participation_type,
        'author_name': author_name,
        'author_id': thread['user_id'],
        'llm_name': llm_name,
        'homework': homework,
        'links': links,
        'categories': categories,
        'view_count': thread['view_count'],
        'vote_count': thread['vote_count'],
        'reply_count': thread['reply_count'],
        'created_at': thread['created_at'],
        'comments': [
            {
                'author': users.get(comment['user_id'], {}).get('name', 'Unknown'),
                'content': comment['document'],
                'is_endorsed': comment['is_endorsed']
            }
            for comment in thread.get('comments', [])
        ]
    }

def main():
    """Main function to parse all posts."""
    posts_dir = Path('/Users/anz/school/deep learning - cs282a/extra/ed_posts/detailed_posts')
    output_dir = Path('/Users/anz/school/deep learning - cs282a/extra/website_data')
    output_dir.mkdir(exist_ok=True)
    
    participation_a = []
    participation_b = []
    
    # Parse all JSON files
    json_files = list(posts_dir.glob('*.json'))
    print(f"Found {len(json_files)} post files")
    
    for post_file in json_files:
        try:
            post_data = parse_post(post_file)
            if post_data:
                if post_data['participation_type'] == 'A':
                    participation_a.append(post_data)
                elif post_data['participation_type'] == 'B':
                    participation_b.append(post_data)
        except Exception as e:
            print(f"Error parsing {post_file}: {e}")
    
    print(f"Parsed {len(participation_a)} Special Participation A posts")
    print(f"Parsed {len(participation_b)} Special Participation B posts")
    
    # Sort by post number
    participation_a.sort(key=lambda x: x['number'])
    participation_b.sort(key=lambda x: x['number'])
    
    # Save parsed data
    with open(output_dir / 'participation_a.json', 'w', encoding='utf-8') as f:
        json.dump(participation_a, f, indent=2, ensure_ascii=False)
    
    with open(output_dir / 'participation_b.json', 'w', encoding='utf-8') as f:
        json.dump(participation_b, f, indent=2, ensure_ascii=False)
    
    # Generate statistics
    stats = {
        'total_a': len(participation_a),
        'total_b': len(participation_b),
        'llm_counts_a': defaultdict(int),
        'llm_counts_b': defaultdict(int),
        'hw_counts_a': defaultdict(int),
        'hw_counts_b': defaultdict(int),
        'category_counts_a': defaultdict(int),
        'category_counts_b': defaultdict(int),
    }
    
    for post in participation_a:
        stats['llm_counts_a'][post['llm_name']] += 1
        stats['hw_counts_a'][post['homework']] += 1
        for cat in post['categories']:
            stats['category_counts_a'][cat] += 1
    
    for post in participation_b:
        stats['llm_counts_b'][post['llm_name']] += 1
        stats['hw_counts_b'][post['homework']] += 1
        for cat in post['categories']:
            stats['category_counts_b'][cat] += 1
    
    # Convert defaultdict to regular dict for JSON serialization
    stats['llm_counts_a'] = dict(stats['llm_counts_a'])
    stats['llm_counts_b'] = dict(stats['llm_counts_b'])
    stats['hw_counts_a'] = dict(stats['hw_counts_a'])
    stats['hw_counts_b'] = dict(stats['hw_counts_b'])
    stats['category_counts_a'] = dict(stats['category_counts_a'])
    stats['category_counts_b'] = dict(stats['category_counts_b'])
    
    with open(output_dir / 'statistics.json', 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2)
    
    print("\nStatistics:")
    print(f"Special Participation A - Top LLMs:")
    for llm, count in sorted(stats['llm_counts_a'].items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {llm}: {count}")
    
    print(f"\nSpecial Participation B - Top LLMs:")
    for llm, count in sorted(stats['llm_counts_b'].items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {llm}: {count}")
    
    print("\nData saved to:", output_dir)

if __name__ == '__main__':
    main()
