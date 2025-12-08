#!/usr/bin/env python3
"""
Analyze LLM behaviors and extract key insights from participation posts.
"""

import json
import re
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Any

def extract_key_quotes(content: str, max_length: int = 300) -> List[str]:
    """Extract key insights/quotes from content."""
    quotes = []
    
    # Look for summary sections
    summary_patterns = [
        r'(?:Executive Summary|Summary|Key Findings?|Reflection|Overall|Insights?):\s*(.{50,500}?)(?:\n\n|\Z)',
        r'(?:I found that|I noticed|I observed|One key insight|Interestingly|Notably)(.{50,300}?)(?:\.|!)',
    ]
    
    for pattern in summary_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE | re.DOTALL)
        for match in matches:
            cleaned = match.strip()
            if len(cleaned) > 50:
                quotes.append(cleaned[:max_length])
    
    return quotes[:3]  # Return top 3 quotes

def analyze_llm_behavior(posts: List[Dict], llm_name: str) -> Dict[str, Any]:
    """Analyze behavior patterns for a specific LLM."""
    llm_posts = [p for p in posts if p['llm_name'] == llm_name]
    
    if not llm_posts:
        return None
    
    behavior = {
        'llm_name': llm_name,
        'total_posts': len(llm_posts),
        'strengths': [],
        'weaknesses': [],
        'patterns': [],
        'key_quotes': [],
        'homework_distribution': defaultdict(int),
        'avg_view_count': sum(p['view_count'] for p in llm_posts) / len(llm_posts),
    }
    
    # Analyze content for patterns
    all_content = ' '.join([p['content'].lower() for p in llm_posts])
    
    # Strengths
    if 'correct' in all_content or 'accurate' in all_content:
        behavior['strengths'].append('Often provides correct answers')
    if 'helpful' in all_content or 'useful' in all_content:
        behavior['strengths'].append('Generally helpful for problem-solving')
    if 'explanation' in all_content or 'explained' in all_content:
        behavior['strengths'].append('Provides explanations for solutions')
    if 'one shot' in all_content or 'one-shot' in all_content:
        behavior['strengths'].append('Can solve problems in one shot')
    
    # Weaknesses
    if 'hallucination' in all_content or 'hallucinated' in all_content:
        behavior['weaknesses'].append('Prone to hallucinations')
    if 'error' in all_content or 'mistake' in all_content or 'wrong' in all_content:
        behavior['weaknesses'].append('Makes errors on complex problems')
    if 'verbose' in all_content or 'lengthy' in all_content or 'long' in all_content:
        behavior['weaknesses'].append('Can be overly verbose')
    if 'confus' in all_content:
        behavior['weaknesses'].append('Can get confused on ambiguous questions')
    if 'prompt' in all_content and 'engineer' in all_content:
        behavior['weaknesses'].append('Requires careful prompt engineering')
    
    # Patterns
    if 'iterate' in all_content or 'back-and-forth' in all_content:
        behavior['patterns'].append('Engages in iterative problem-solving')
    if 'question' in all_content and 'itself' in all_content:
        behavior['patterns'].append('Questions its own solutions')
    if 'step' in all_content:
        behavior['patterns'].append('Provides step-by-step solutions')
    
    # Extract key quotes
    for post in llm_posts[:5]:  # Top 5 most viewed posts
        quotes = extract_key_quotes(post['content'])
        behavior['key_quotes'].extend(quotes)
    
    # Homework distribution
    for post in llm_posts:
        behavior['homework_distribution'][post['homework']] += 1
    
    behavior['homework_distribution'] = dict(behavior['homework_distribution'])
    
    return behavior

def generate_summary_insights(participation_type: str, posts: List[Dict]) -> Dict[str, Any]:
    """Generate overall summary insights for a participation type."""
    
    # Get unique LLMs
    llms = set(p['llm_name'] for p in posts)
    llm_behaviors = {}
    
    for llm in llms:
        if llm != 'Not specified':
            behavior = analyze_llm_behavior(posts, llm)
            if behavior and behavior['total_posts'] >= 2:  # Only include LLMs with 2+ posts
                llm_behaviors[llm] = behavior
    
    # Overall statistics
    category_counts = defaultdict(int)
    for post in posts:
        for cat in post['categories']:
            category_counts[cat] += 1
    
    homework_counts = defaultdict(int)
    for post in posts:
        homework_counts[post['homework']] += 1
    
    # Extract common themes
    all_content = ' '.join([p['content'].lower() for p in posts])
    
    themes = []
    theme_keywords = {
        'Accuracy & Correctness': ['correct', 'accurate', 'right answer', 'solved correctly'],
        'Hallucinations': ['hallucination', 'made up', 'fabricated', 'incorrect information'],
        'Explanation Quality': ['explanation', 'reasoning', 'understand', 'clarify'],
        'Problem-Solving Approach': ['one shot', 'iterative', 'step-by-step', 'approach'],
        'Prompt Engineering': ['prompt', 'prompting', 'engineered', 'rephrased'],
        'Error Patterns': ['error', 'mistake', 'wrong', 'failed', 'struggled'],
    }
    
    for theme, keywords in theme_keywords.items():
        if any(keyword in all_content for keyword in keywords):
            themes.append(theme)
    
    return {
        'participation_type': participation_type,
        'total_posts': len(posts),
        'total_students': len(set(p['author_name'] for p in posts)),
        'llm_behaviors': llm_behaviors,
        'common_themes': themes,
        'category_distribution': dict(category_counts),
        'homework_distribution': dict(homework_counts),
        'avg_views': sum(p['view_count'] for p in posts) / len(posts) if posts else 0,
    }

def main():
    """Main function to analyze insights."""
    data_dir = Path('/Users/anz/school/deep learning - cs282a/extra/website_data')
    
    # Load parsed data
    with open(data_dir / 'participation_a.json', 'r', encoding='utf-8') as f:
        participation_a = json.load(f)
    
    with open(data_dir / 'participation_b.json', 'r', encoding='utf-8') as f:
        participation_b = json.load(f)
    
    # Generate insights
    insights_a = generate_summary_insights('A', participation_a)
    insights_b = generate_summary_insights('B', participation_b)
    
    # Save insights
    with open(data_dir / 'insights_a.json', 'w', encoding='utf-8') as f:
        json.dump(insights_a, f, indent=2, ensure_ascii=False)
    
    with open(data_dir / 'insights_b.json', 'w', encoding='utf-8') as f:
        json.dump(insights_b, f, indent=2, ensure_ascii=False)
    
    print(f"Generated insights for Special Participation A:")
    print(f"  - {len(insights_a['llm_behaviors'])} LLMs analyzed")
    print(f"  - Common themes: {', '.join(insights_a['common_themes'])}")
    
    print(f"\nGenerated insights for Special Participation B:")
    print(f"  - {len(insights_b['llm_behaviors'])} LLMs analyzed")
    print(f"  - Common themes: {', '.join(insights_b['common_themes'])}")
    
    # Print top LLMs by post count
    print(f"\nTop LLMs in Special Participation A:")
    for llm, data in sorted(insights_a['llm_behaviors'].items(), 
                           key=lambda x: x[1]['total_posts'], reverse=True)[:5]:
        print(f"  {llm}: {data['total_posts']} posts")
        if data['strengths']:
            print(f"    Strengths: {', '.join(data['strengths'][:2])}")
        if data['weaknesses']:
            print(f"    Weaknesses: {', '.join(data['weaknesses'][:2])}")
    
    print(f"\nTop LLMs in Special Participation B:")
    for llm, data in sorted(insights_b['llm_behaviors'].items(), 
                           key=lambda x: x[1]['total_posts'], reverse=True)[:5]:
        print(f"  {llm}: {data['total_posts']} posts")
        if data['strengths']:
            print(f"    Strengths: {', '.join(data['strengths'][:2])}")
        if data['weaknesses']:
            print(f"    Weaknesses: {', '.join(data['weaknesses'][:2])}")

if __name__ == '__main__':
    main()
