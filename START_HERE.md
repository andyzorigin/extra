# 🎓 CS182 Special Participation A & B Website

## 👋 Welcome! Start Here

This project creates a comprehensive website analyzing student experiences with Large Language Models for CS182 homework.

---

## 🚀 Quick Start (30 seconds)

### View the Website
```bash
cd website
python3 -m http.server 8000
```
Open: http://localhost:8000

Or use: `./launch_website.sh`

---

## 📚 Documentation Guide

### For Quick Overview
👉 **Read**: `QUICK_START.md` (2 min read)  
What: Quick guide to view and deploy the website

### For Extra Credit Submission
👉 **Read**: `FINAL_DELIVERABLE.md` (10 min read)  
What: Complete deliverable summary with justification

### For Deployment
👉 **Read**: `website/README.md` (5 min read)  
What: Step-by-step deployment instructions

### For Technical Details
👉 **Read**: `PROJECT_README.md` (15 min read)  
What: Full technical documentation and architecture

### For Insights & Analysis
👉 **Read**: `LLM_INSIGHTS_REPORT.md` (20 min read)  
What: Detailed analysis of all LLM behaviors

---

## 📊 What's Inside

### The Website (Main Deliverable)
📁 `website/` - **Deploy this folder**
- Complete, production-ready website
- 200 student submissions analyzed
- 13+ LLMs compared
- Fully searchable and filterable

### Data
📁 `website_data/` - Parsed JSON data
📁 `ed_posts/` - Raw Ed Discussion posts (558 total)

### Scripts
📄 `parse_participation_posts.py` - Parse Ed posts
📄 `analyze_insights.py` - Extract insights
📄 `launch_website.sh` - Launch website locally

### Documentation
📄 `FINAL_DELIVERABLE.md` - Complete deliverable summary ⭐
📄 `SUBMISSION_SUMMARY.md` - Extra credit justification
📄 `LLM_INSIGHTS_REPORT.md` - Detailed analysis report
📄 `PROJECT_README.md` - Technical documentation
📄 `QUICK_START.md` - Quick reference guide

---

## ✅ What This Provides

### For Students
✅ See how 200+ peers used different LLMs  
✅ Learn which models work best for what  
✅ Discover effective prompting strategies  
✅ Avoid common pitfalls  

### For Instructors
✅ Track LLM performance across assignments  
✅ Understand student learning patterns  
✅ Identify common issues with different models  
✅ Build better AI-assisted learning tools  

### For the Course
✅ Permanent documentation of student work  
✅ Credit to all contributors with links  
✅ Searchable knowledge base  
✅ Ready for eecs182.org deployment  

---

## 🎯 Key Features

### 1. Comprehensive Coverage
- **200 submissions** from 200 students
- **13+ different LLMs** analyzed
- **All homework assignments** covered
- **Complete attribution** with links

### 2. Deep Analysis
- Strengths & weaknesses for each LLM
- Common behavior patterns identified
- Best practices documented
- Statistical insights provided

### 3. Advanced Search
- Search by student name
- Filter by LLM model
- Filter by homework
- Keyword search across all content

### 4. Production Ready
- No setup required
- Works everywhere
- Fast and responsive
- Easy to maintain

---

## 📈 Statistics

- **558 Ed posts** downloaded
- **200 relevant submissions** extracted
- **110 Type A** (non-coding problems)
- **90 Type B** (coding problems)
- **13+ LLMs** documented
- **~95-103 views** per post average

---

## 🚀 Next Steps

### To View Locally
```bash
./launch_website.sh
```

### To Deploy to eecs182.org
```bash
# Copy website folder to server
scp -r website/ user@eecs182.org:/var/www/html/llm-participation/
```

### To Update with New Data
```bash
python parse_participation_posts.py
python analyze_insights.py
cp website_data/*.json website/data/
```

---

## 📞 Questions?

### Technical Issues
→ Check `PROJECT_README.md` for troubleshooting

### Deployment Help
→ Check `website/README.md` for deployment options

### Understanding the Analysis
→ Check `LLM_INSIGHTS_REPORT.md` for detailed insights

### Extra Credit Questions
→ Check `FINAL_DELIVERABLE.md` for complete justification

---

## 🎉 Ready to Go!

Everything is complete and ready to use:

✅ Website is fully functional  
✅ All data is processed  
✅ Documentation is comprehensive  
✅ Scripts are tested  
✅ Ready for deployment  

**Just view the website and you'll see everything in action!**

```bash
cd website
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

---

## 📁 Quick File Reference

| File | Purpose | Read Time |
|------|---------|-----------|
| `QUICK_START.md` | Quick overview | 2 min |
| `FINAL_DELIVERABLE.md` | Complete summary | 10 min |
| `SUBMISSION_SUMMARY.md` | Extra credit justification | 8 min |
| `LLM_INSIGHTS_REPORT.md` | Detailed analysis | 20 min |
| `PROJECT_README.md` | Technical docs | 15 min |
| `website/README.md` | Deployment guide | 5 min |

---

**Built with ❤️ for CS182: Deep Learning**

Documenting student experiences with LLMs for posterity and future learning.
