# CS 182 Extra Credit: LLM Participation Website

**UC Berkeley CS 182/282A Deep Learning - Fall 2025**

## Project Overview

This project creates a comprehensive, searchable website documenting student participation in Special Participation categories A and B (LLM interactions) for the CS 182 Deep Learning course. The website enables easy navigation through student insights, allows searching by keywords/student names, and provides visibility for student contributions.

**Live Repository:** https://github.com/andyzorigin/extra

## What We Built

### 1. Interactive Website (`website/` directory)
A modern, responsive web interface featuring:
- **Searchable Database:** Filter by participation category (A: ChatGPT, B: Claude/Gemini)
- **Student Search:** Find submissions by student name or keywords
- **Statistical Dashboard:** Overview of participation metrics across categories
- **Direct Links:** Links to original Ed posts for full context
- **Responsive Design:** Works seamlessly on desktop and mobile devices

**To Launch the Website:**
```bash
./launch_website.sh
```
Then open `http://localhost:8000` in your browser.

### 2. Automated Data Pipeline
Python scripts that:
- Parse 600+ Ed discussion posts automatically
- Extract participation data for categories A and B
- Categorize submissions by LLM type and insight quality
- Generate structured JSON data files for the website

**Key Scripts:**
- `parse_participation_posts.py` - Extracts participation data from Ed posts
- `analyze_insights.py` - Performs LLM-powered analysis of submissions

### 3. Comprehensive Insights Report
Detailed analysis of LLM behavior patterns including:
- **Category A (ChatGPT):** Common issues, best practices, behavior patterns
- **Category B (Claude/Gemini):** Comparative analysis, strengths/weaknesses
- Identification of particularly impressive submissions
- Actionable insights for future students

See `LLM_INSIGHTS_REPORT.md` for full details.

## Repository Structure

```
extra/
├── website/                      # Deployable website
│   ├── index.html               # Main website interface
│   ├── app.js                   # Interactive functionality
│   ├── styles.css               # Modern styling
│   └── data/                    # JSON data files
│       ├── participation_a.json # ChatGPT insights
│       ├── participation_b.json # Claude/Gemini insights
│       ├── insights_a.json      # Analyzed insights (A)
│       ├── insights_b.json      # Analyzed insights (B)
│       └── statistics.json      # Participation statistics
├── ed_posts/                    # Raw Ed discussion data
│   └── detailed_posts/          # Individual post JSONs
├── parse_participation_posts.py # Data extraction script
├── analyze_insights.py          # LLM analysis script
├── launch_website.sh            # Website launcher
├── LLM_INSIGHTS_REPORT.md       # Detailed insights report
└── requirements.txt             # Python dependencies
```

## Quick Start

### Prerequisites
```bash
pip install -r requirements.txt
```

### Launch the Website
```bash
./launch_website.sh
```

### Regenerate Data (if needed)
```bash
# Extract participation data from Ed posts
python parse_participation_posts.py

# Analyze insights using LLMs
python analyze_insights.py
```

## Features & Highlights

✅ **Fully Automated Pipeline:** From raw Ed data to deployed website  
✅ **Searchable Interface:** Filter by category, student, or keywords  
✅ **Student Attribution:** Links to student GitHub/websites when provided  
✅ **LLM-Powered Analysis:** Deep insights into ChatGPT, Claude, and Gemini behavior  
✅ **Statistics Dashboard:** Visual overview of participation patterns  
✅ **Production Ready:** Clean code, documentation, ready for eecs182.org  
✅ **Mobile Responsive:** Modern UI that works on all devices  

## Key Insights Discovered

### Category A (ChatGPT Interactions)
- Common hallucination patterns in mathematical explanations
- Effective prompting strategies for homework help
- Issues with code generation and debugging
- Best practices for extracting conceptual understanding

### Category B (Claude/Gemini Interactions)
- Claude's strengths in detailed explanations and coding
- Gemini's performance on multimodal tasks
- Comparative analysis of reasoning capabilities
- Model-specific limitations and workarounds

See `LLM_INSIGHTS_REPORT.md` for comprehensive findings.

## Documentation

- **`START_HERE.md`** - Quick orientation guide
- **`QUICK_START.md`** - Getting started instructions
- **`PROJECT_README.md`** - Technical implementation details
- **`FINAL_DELIVERABLE.md`** - Project summary and deliverables
- **`SUBMISSION_SUMMARY.md`** - Extra credit submission overview
- **`VISUAL_OVERVIEW.md`** - Website features and screenshots

## Integration with eecs182.org

The `website/` directory is designed to be dropped directly into the course website:
1. Copy the `website/` folder to the desired location
2. Ensure `data/` JSON files are accessible
3. Link to `index.html` from the main course site
4. No additional dependencies or server-side code required

## Technologies Used

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Data Processing:** Python 3.x
- **LLM Analysis:** OpenAI/Anthropic APIs
- **Data Format:** JSON for easy maintenance
- **Deployment:** Static site (can be hosted anywhere)

## Credits

This project documents the incredible work of CS 182 students who shared their insights about working with large language models throughout Fall 2025. All submissions are attributed to their original authors with links to their profiles when available.

## Contact & Support

For questions or issues, please post on the Ed discussion thread or open an issue in this repository.

---

**Extra Credit Categories:** Special Participation A & B  
**Course:** CS 182/282A Deep Learning, UC Berkeley, Fall 2025  
**Website Status:** ✅ Production Ready
