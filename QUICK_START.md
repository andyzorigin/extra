# Quick Start Guide - CS182 LLM Analysis Website

## 🚀 View the Website (30 seconds)

```bash
cd website
python3 -m http.server 8000
```

Then open: http://localhost:8000

Or use the launch script:
```bash
./launch_website.sh
```

## 📁 What's Where

```
website/               ← THE WEBSITE (ready to deploy!)
├── index.html        ← Main page
├── styles.css        ← Styles
├── app.js           ← JavaScript
├── data/            ← Data files
└── README.md        ← Deployment guide

website_data/         ← Parsed JSON data
├── participation_a.json
├── participation_b.json
├── insights_a.json
└── insights_b.json

ed_posts/            ← Raw Ed Discussion data
└── detailed_posts/  ← 558 JSON files
```

## 🔥 Deploy to eecs182.org

**Option 1: Copy directly**
```bash
scp -r website/ user@eecs182.org:/var/www/html/llm-participation/
```

**Option 2: Via git**
```bash
cp -r website /path/to/eecs182-repo/llm-participation
cd /path/to/eecs182-repo
git add llm-participation/
git commit -m "Add LLM participation website"
git push
```

Then link from main site to: `https://eecs182.org/llm-participation/`

## 📊 Key Statistics

- **200 total submissions** (110 Type A, 90 Type B)
- **13+ LLMs analyzed** (DeepSeek, Gemini, Grok, Mistral, ChatGPT, Claude, etc.)
- **Fully searchable** by student, LLM, homework, keywords
- **Complete attribution** with external links

## ✨ Website Features

1. **Overview Dashboard** - Stats and navigation
2. **Insights Summary** - LLM behavior analysis
3. **LLM Comparison** - Side-by-side comparison
4. **Searchable Submissions** - All 200 posts with filtering
5. **Student Credits** - Full attribution with links

## 🔄 Update with New Posts

```bash
# 1. Download new Ed posts
python download_ed_final.py

# 2. Parse and analyze
python parse_participation_posts.py
python analyze_insights.py

# 3. Copy to website
cp website_data/*.json website/data/

# 4. Done! Website auto-updates
```

## 📚 Documentation

- `website/README.md` - Detailed deployment guide
- `PROJECT_README.md` - Complete project documentation
- `SUBMISSION_SUMMARY.md` - Extra credit submission details

## 💡 Key Insights Found

### Common Strengths
- ✅ Correct solutions for straightforward problems
- ✅ Helpful explanations
- ✅ Can iterate and improve

### Common Weaknesses
- ⚠️ Hallucinations
- ⚠️ Errors on complex problems
- ⚠️ Overly verbose
- ⚠️ Requires prompt engineering

### Top LLMs by Posts
1. **DeepSeek** (24 posts) - Strong reasoning, poor explanation
2. **Gemini** (23 posts) - Good general-purpose, hallucinations
3. **Mistral** (17 posts) - Solid standard problems
4. **Grok** (16 posts) - Learns from feedback, very verbose
5. **ChatGPT/GPT** (19 posts) - Consistent, good iteration

## ❓ Need Help?

1. Check `website/README.md` for deployment details
2. See `PROJECT_README.md` for technical info
3. Review `SUBMISSION_SUMMARY.md` for project overview

## ✅ Ready to Submit

Everything is ready for:
- ✅ Immediate deployment to eecs182.org
- ✅ Extra credit submission
- ✅ Future maintenance and updates

**Total Time**: Website works in 30 seconds, deploy in 5 minutes!
