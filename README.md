# CS182 Special Participation: LLM Analysis Website

This website documents student experiences using various Large Language Models (LLMs) to solve homework problems for CS182: Deep Learning.

## 📊 Overview

- **110 Special Participation A posts** - Students used LLMs for non-coding homework problems
- **90 Special Participation B posts** - Students used LLMs for coding homework problems
- **13+ LLMs analyzed** including DeepSeek, Gemini, Grok, Mistral, ChatGPT, Claude, and more
- **Searchable and filterable** by student name, LLM model, homework assignment, and keywords

## 🎯 Purpose

This website serves to:
1. Document student insights on LLM behaviors and capabilities
2. Provide a searchable resource for understanding different LLMs' strengths and weaknesses
3. Credit students for their contributions with links to their profiles/work
4. Create a knowledge base for future students and research

## ✨ Features

### Search & Filter
- Full-text search across all submissions
- Filter by participation type (A or B)
- Filter by LLM model
- Filter by homework assignment
- Filter by student name

### LLM Analysis
- Comparative analysis of different LLMs
- Common strengths and weaknesses for each model
- Behavior patterns observed by students
- Statistics on usage and performance

### Submissions
- Complete student submissions with attribution
- Links to chat transcripts, Google Docs, and GitHub repos
- View counts and engagement metrics
- Staff comments and endorsements
- Expandable content for easy browsing

## 🚀 Deployment

### Option 1: Simple HTTP Server (Local Testing)

```bash
cd website
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

### Option 2: Static Hosting (Production)

The website is a static site with no backend dependencies. You can deploy it to any static hosting service:

#### GitHub Pages
```bash
# Push the website folder to a GitHub repository
git add website/
git commit -m "Add LLM analysis website"
git push

# Enable GitHub Pages in repository settings
# Point to the website folder
```

#### Netlify
```bash
# Drag and drop the website folder to Netlify
# Or use Netlify CLI:
netlify deploy --prod --dir=website
```

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd website
vercel --prod
```

#### eecs182.org Integration

To integrate with the main eecs182.org website:

1. Copy the entire `website` directory to the eecs182.org server
2. Rename it if needed (e.g., `llm-participation`)
3. Link to it from the main site: `https://eecs182.org/llm-participation/`

The website is self-contained with:
- All data in JSON format in the `data/` folder
- No external dependencies
- No build process required
- Works with or without a domain name

## 📁 File Structure

```
website/
├── index.html          # Main HTML page
├── styles.css          # All CSS styles
├── app.js              # JavaScript application
├── data/               # JSON data files
│   ├── participation_a.json
│   ├── participation_b.json
│   ├── insights_a.json
│   ├── insights_b.json
│   └── statistics.json
└── README.md           # This file
```

## 🔧 Technical Details

### Technologies Used
- **Pure HTML/CSS/JavaScript** - No frameworks required
- **Responsive Design** - Works on desktop and mobile
- **Client-side Search** - Fast filtering without backend
- **JSON Data** - Easy to update and maintain

### Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

### Performance
- Static files only - fast load times
- Client-side rendering - no server load
- Optimized for 200+ submissions
- Lazy loading for content expansion

## 📝 Data Sources

All data is sourced from Ed Discussion posts (https://edstem.org/us/courses/84647):
- Downloaded on December 8, 2025
- 558 total posts analyzed
- 200 Special Participation posts extracted
- Automated parsing with manual verification

## 🎓 Student Credits

All submissions are attributed to students with:
- Full name displayed
- Links to external resources (chat logs, documents, repos)
- View counts and engagement metrics
- Staff endorsements highlighted

Students who included personal websites or GitHub profiles have them linked directly in their submissions.

## 📈 Statistics

### Special Participation A (Non-coding problems)
- Top LLMs: DeepSeek (16), Mistral (10), Gemini (9)
- Most tested: HW3, HW4, HW2
- Common themes: Accuracy, Hallucinations, Explanation Quality

### Special Participation B (Coding problems)
- Top LLMs: Gemini (14), DeepSeek (8), Grok (8)
- Most tested: HW4, HW3, HW2
- Common themes: Error patterns, Iterative problem-solving

## 🔄 Updating Data

To update the website with new posts:

1. Download new Ed posts:
```bash
python download_ed_posts.py
```

2. Parse and analyze:
```bash
python parse_participation_posts.py
python analyze_insights.py
```

3. Copy new data:
```bash
cp website_data/*.json website/data/
```

4. Deploy updated website

## 🐛 Troubleshooting

### Issue: Data not loading
- Check browser console for errors
- Ensure JSON files are in `data/` folder
- Verify JSON files are valid (use a JSON validator)
- Check CORS settings if hosting locally

### Issue: Search not working
- Clear browser cache
- Check JavaScript console for errors
- Ensure app.js is loaded correctly

### Issue: Links broken
- Verify external links are still valid
- Check for URL encoding issues
- Ensure HTTPS/HTTP protocol is correct

## 📧 Contact

For questions about this website or the CS182 course, visit:
- Course website: https://eecs182.org
- Ed Discussion: https://edstem.org/us/courses/84647

## 📄 License

This website and data are for educational purposes as part of CS182: Deep Learning at UC Berkeley.
Student contributions remain the intellectual property of the respective authors.

---

Built with ❤️ for CS182 students and future deep learning researchers.
