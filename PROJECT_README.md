# CS182 Special Participation A & B - LLM Analysis Website

## 📋 Project Overview

This project creates a comprehensive, searchable website documenting student experiences using Large Language Models (LLMs) to solve CS182 homework problems. The website analyzes **Special Participation A** (non-coding problems) and **Special Participation B** (coding problems) submissions from Ed Discussion.

### Key Features

✅ **200+ Student Submissions** - Complete documentation of LLM interactions  
✅ **13+ LLMs Analyzed** - DeepSeek, Gemini, Grok, Mistral, ChatGPT, Claude, and more  
✅ **Advanced Search & Filtering** - By student, LLM, homework, keywords  
✅ **Insights Dashboard** - Strengths, weaknesses, and behavior patterns for each LLM  
✅ **Student Attribution** - Full credit with links to chat logs, docs, and repos  
✅ **Modern UI** - Responsive design with UC Berkeley branding  

## 🎯 What This Fulfills

This project addresses the extra credit requirements for **Special Participation A & B**:

> *For each of these two cases, we would like to have a summary of insights on how each of the different LLMs behave and common issues. What insights were gained from...*

### Deliverables

1. ✅ **Comprehensive Website** - Static site ready to drop into eecs182.org
2. ✅ **LLM Behavior Analysis** - Automated extraction of strengths/weaknesses/patterns
3. ✅ **Searchable Database** - Filter by keyword, student name, LLM model
4. ✅ **Student Credits** - All submissions attributed with external links
5. ✅ **Insights Summary** - Common themes and comparative analysis

## 📊 Data Summary

### Special Participation A (Non-coding Homework)
- **110 submissions** from unique students
- **Top LLMs**: DeepSeek (16 posts), Mistral (10), Gemini (9), Grok (8)
- **Most Tested**: HW3, HW4, HW2, HW0
- **Key Insights**:
  - Most LLMs can "one-shot" straightforward problems
  - Explanations vary significantly in quality
  - Hallucinations observed across multiple models
  - Prompt engineering significantly impacts results

### Special Participation B (Coding Homework)
- **90 submissions** from unique students  
- **Top LLMs**: Gemini (14 posts), DeepSeek (8), Grok (8), Mistral (7)
- **Most Tested**: HW4, HW3, HW2
- **Key Insights**:
  - Better at providing step-by-step coding solutions
  - Often questions its own solutions (especially Claude)
  - Struggles with complex multi-part problems
  - Iteration improves accuracy

## 🏗️ Project Structure

```
.
├── parse_participation_posts.py    # Parse Ed JSON files
├── analyze_insights.py             # Extract LLM behavior patterns
├── website_data/                   # Parsed JSON data
│   ├── participation_a.json
│   ├── participation_b.json
│   ├── insights_a.json
│   ├── insights_b.json
│   └── statistics.json
├── website/                        # Complete website (READY TO DEPLOY)
│   ├── index.html                  # Main page
│   ├── styles.css                  # UC Berkeley themed styles
│   ├── app.js                      # Interactive JavaScript
│   ├── data/                       # Data files (copied from website_data)
│   └── README.md                   # Deployment instructions
├── ed_posts/                       # Raw Ed Discussion data
│   └── detailed_posts/             # 558 JSON files
└── PROJECT_README.md               # This file
```

## 🚀 Quick Start

### View the Website Locally

```bash
cd website
python3 -m http.server 8000
```

Open http://localhost:8000 in your browser.

### Update with New Data

If new Ed posts are added:

```bash
# 1. Download new posts (if needed)
python download_ed_final.py

# 2. Re-parse and analyze
python parse_participation_posts.py
python analyze_insights.py

# 3. Copy updated data
cp website_data/*.json website/data/

# 4. Website automatically reflects new data
```

## 📈 Key Insights Generated

### Common LLM Strengths
- ✅ Correct solutions for straightforward problems
- ✅ Helpful for understanding concepts
- ✅ Detailed step-by-step explanations
- ✅ Fast iteration and refinement
- ✅ Can handle multiple problem types

### Common LLM Weaknesses
- ⚠️ Hallucinations (making up facts/formulas)
- ⚠️ Errors on complex, multi-part problems
- ⚠️ Overly verbose responses
- ⚠️ Confusion on ambiguous questions
- ⚠️ Requires careful prompt engineering
- ⚠️ May skip crucial reasoning steps

### Notable Patterns

#### DeepSeek
- **Strengths**: Internal reasoning, correct answers, handles math well
- **Weaknesses**: Doesn't explain reasoning well, one-shot approach, skips steps
- **Pattern**: Captures details in internal reasoning but fails to communicate them

#### Gemini (2.5/3)
- **Strengths**: Good explanations, helpful, accurate
- **Weaknesses**: Hallucinations, errors on complex problems
- **Pattern**: Strong general-purpose assistant, struggles with edge cases

#### Grok
- **Strengths**: Correct answers (70-80%), learns from feedback
- **Weaknesses**: Very verbose, loses focus, acts preemptively
- **Pattern**: Eager to help but sometimes overextends

#### Claude
- **Strengths**: Questions itself, detailed explanations, helpful
- **Weaknesses**: Can be verbose, occasional confusion
- **Pattern**: Most self-reflective model, helps users catch mistakes

#### Mistral
- **Strengths**: Provides explanations, correct solutions
- **Weaknesses**: Hallucinations, errors on complex problems
- **Pattern**: Solid for standard problems, less reliable on edge cases

## 🎨 Website Features

### 1. Overview Dashboard
- Total submissions for A and B
- Number of contributing students
- Number of LLMs analyzed
- Quick navigation to all sections

### 2. Insights Summary
- Common themes across all submissions
- LLM behavior analysis
- Comparative strengths/weaknesses
- Statistical overview

### 3. LLM Comparison
- Side-by-side comparison of different models
- Tabbed interface for A vs B
- Post count and average views
- Strengths, weaknesses, and patterns listed

### 4. Searchable Submissions
- **Search**: Full-text search across all content
- **Filter by Type**: Participation A or B
- **Filter by LLM**: Any model tested
- **Filter by Homework**: Specific assignments
- **Student Names**: Find specific student work
- **Keywords**: Find specific topics/issues

### 5. Individual Submissions
- Complete post content (expandable)
- Student attribution with links
- LLM used and homework tested
- Links to chat transcripts, Google Docs, GitHub
- View counts and engagement
- Staff comments and endorsements
- Categorized by insight type

## 🎓 Student Credits

All 200 submissions are fully attributed to students with:
- Student names prominently displayed
- Links to their external resources:
  - Chat transcripts (ChatGPT, Claude, DeepSeek links)
  - Google Drive annotated documents
  - GitHub repositories
  - Personal websites (if provided)
- View counts showing popularity
- Staff endorsements highlighted

Students can edit their original Ed posts to add personal links, and the website can be regenerated to include them.

## 🔧 Technical Implementation

### Data Processing Pipeline

1. **Ed Discussion Download** (`download_ed_final.py`)
   - Downloads all 558 posts from Ed Discussion
   - Stores as individual JSON files with complete metadata

2. **Post Parsing** (`parse_participation_posts.py`)
   - Extracts Special Participation A and B posts (200 total)
   - Detects LLM models from content
   - Identifies homework assignments
   - Extracts all external links
   - Categorizes insights (hallucinations, errors, explanations, etc.)

3. **Insight Analysis** (`analyze_insights.py`)
   - Analyzes each LLM's behavior across all posts
   - Extracts common strengths and weaknesses
   - Identifies patterns in problem-solving approaches
   - Generates statistical summaries
   - Creates comparative analysis

4. **Website Generation**
   - Static HTML/CSS/JavaScript
   - No build process required
   - Pure client-side rendering
   - Fast, searchable, responsive

### Why This Approach?

- ✅ **Automated**: LLM detection and insight extraction via NLP patterns
- ✅ **Scalable**: Can handle thousands of posts
- ✅ **Maintainable**: Simple update process for new posts
- ✅ **Fast**: Static site loads instantly
- ✅ **Searchable**: Client-side search is extremely fast
- ✅ **Deployable**: Works anywhere (no server needed)

## 📦 Deployment Options

### For eecs182.org

```bash
# Copy the website folder to the server
scp -r website/ user@eecs182.org:/var/www/html/llm-participation/

# Or via git
git add website/
git commit -m "Add LLM participation website"
git push
```

Access at: `https://eecs182.org/llm-participation/`

### Other Options

- **GitHub Pages**: Free, automatic deployment
- **Netlify**: Drag-and-drop deployment
- **Vercel**: One-command deployment
- **Any static host**: Works everywhere

See `website/README.md` for detailed deployment instructions.

## 🔍 Analysis Methodology

### LLM Detection
Uses regex patterns to identify LLM models from titles and content:
- ChatGPT (4, 4o, 5, 5.1, o1, o3)
- Claude (3, 3.5, Sonnet, Opus)
- Gemini (1.5, 2, 2.5, 3)
- DeepSeek
- Grok
- Mistral
- Llama variants
- And more...

### Insight Categorization
Automatically categorizes based on keyword analysis:
- **Hallucinations**: "hallucination", "made up", "fabricated"
- **Errors**: "error", "mistake", "wrong", "incorrect"
- **Explanations**: "explained", "reasoning", "understand"
- **Problem-solving**: "one-shot", "iterative", "step-by-step"
- **Prompt Engineering**: "prompt", "rephrased", "engineered"
- And more...

### Strength/Weakness Extraction
Analyzes aggregate content across all posts for each LLM:
- Positive patterns → Strengths
- Negative patterns → Weaknesses
- Behavioral patterns → Common behaviors

## 📊 Impact & Use Cases

### For Students
- Learn from peers' experiences with different LLMs
- Understand which models work best for different problem types
- Discover effective prompting strategies
- Find detailed examples of LLM interactions

### For Instructors
- Track common issues across different LLMs
- Identify which models are most/least effective
- Understand student learning patterns
- Build better AI-assisted learning tools

### For Researchers
- Dataset of 200 student-LLM interactions
- Comparative analysis across multiple models
- Real-world homework problem-solving scenarios
- Longitudinal data across semester

## 🎯 Future Enhancements

Possible additions (not implemented):
- [ ] Sentiment analysis of student experiences
- [ ] Time-series analysis (model improvements over semester)
- [ ] Topic modeling for common themes
- [ ] Citation graph (which posts reference others)
- [ ] Export to CSV/PDF for offline analysis
- [ ] Integration with course gradebook
- [ ] Anonymous submission viewing option

## 📞 Contact & Support

- **Course**: CS182: Deep Learning
- **Website**: https://eecs182.org
- **Ed Discussion**: https://edstem.org/us/courses/84647

## 📄 License & Attribution

- **Data Source**: Ed Discussion course 84647
- **Student Work**: Remains property of respective authors
- **Website Code**: Available for educational use
- **Purpose**: CS182 extra credit documentation

---

## 🎉 Summary

This project provides a complete, production-ready website for documenting and analyzing student experiences with LLMs in CS182. It includes:

✅ **200 student submissions** fully documented  
✅ **Automated LLM behavior analysis** with insights  
✅ **Searchable, filterable interface** for easy exploration  
✅ **Complete student attribution** with external links  
✅ **Ready for deployment** to eecs182.org  
✅ **Maintainable and updateable** for future semesters  

The website can be dropped directly into eecs182.org and will provide lasting value for students, instructors, and researchers interested in understanding how different LLMs perform on real educational tasks.

**Built with deep learning techniques and modern web development practices.**
