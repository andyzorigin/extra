// Global data storage
let participationA = [];
let participationB = [];
let insightsA = {};
let insightsB = {};
let allSubmissions = [];
let filteredSubmissions = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    initializeUI();
    renderOverview();
    renderInsights();
    renderLLMComparison('a');
    renderSubmissions();
    setupEventListeners();
    setupScrollTop();
});

// Load data from JSON files
async function loadData() {
    try {
        const [resA, resB, insA, insB] = await Promise.all([
            fetch('data/participation_a.json'),
            fetch('data/participation_b.json'),
            fetch('data/insights_a.json'),
            fetch('data/insights_b.json')
        ]);
        
        participationA = await resA.json();
        participationB = await resB.json();
        insightsA = await insA.json();
        insightsB = await insB.json();
        
        allSubmissions = [...participationA, ...participationB].sort((a, b) => b.number - a.number);
        filteredSubmissions = [...allSubmissions];
        
        console.log('Data loaded successfully');
    } catch (error) {
        console.error('Error loading data:', error);
        document.querySelector('main').innerHTML = '<div class="loading">Error loading data. Please refresh the page.</div>';
    }
}

// Initialize UI components
function initializeUI() {
    // Populate filter dropdowns
    const llms = new Set();
    const homeworks = new Set();
    
    allSubmissions.forEach(sub => {
        if (sub.llm_name !== 'Not specified') llms.add(sub.llm_name);
        if (sub.homework !== 'Not specified') homeworks.add(sub.homework);
    });
    
    const llmSelect = document.getElementById('filter-llm');
    const hwSelect = document.getElementById('filter-homework');
    
    Array.from(llms).sort().forEach(llm => {
        const option = document.createElement('option');
        option.value = llm;
        option.textContent = llm;
        llmSelect.appendChild(option);
    });
    
    Array.from(homeworks).sort().forEach(hw => {
        const option = document.createElement('option');
        option.value = hw;
        option.textContent = hw;
        hwSelect.appendChild(option);
    });
}

// Render overview statistics
function renderOverview() {
    const uniqueStudents = new Set([
        ...participationA.map(p => p.author_name),
        ...participationB.map(p => p.author_name)
    ]);
    
    const uniqueLLMs = new Set([
        ...Object.keys(insightsA.llm_behaviors || {}),
        ...Object.keys(insightsB.llm_behaviors || {})
    ]);
    
    document.getElementById('total-a-posts').textContent = participationA.length;
    document.getElementById('total-b-posts').textContent = participationB.length;
    document.getElementById('total-students').textContent = uniqueStudents.size;
    document.getElementById('total-llms').textContent = uniqueLLMs.size;
}

// Render insights section
function renderInsights() {
    renderInsightType('insights-a-content', insightsA);
    renderInsightType('insights-b-content', insightsB);
}

function renderInsightType(containerId, insights) {
    const container = document.getElementById(containerId);
    
    let html = `
        <div class="common-themes">
            <h4>Common Themes</h4>
            <div class="theme-tags">
                ${insights.common_themes.map(theme => 
                    `<span class="theme-tag">${theme}</span>`
                ).join('')}
            </div>
        </div>
        
        <div style="margin-top: 1.5rem;">
            <p><strong>${insights.total_posts}</strong> submissions from <strong>${insights.total_students}</strong> students</p>
            <p>Average views per post: <strong>${Math.round(insights.avg_views)}</strong></p>
        </div>
    `;
    
    container.innerHTML = html;
}

// Render LLM comparison
function renderLLMComparison(type) {
    const insights = type === 'a' ? insightsA : insightsB;
    const container = document.getElementById('llm-comparison-content');
    
    const llmBehaviors = Object.entries(insights.llm_behaviors || {})
        .sort((a, b) => b[1].total_posts - a[1].total_posts);
    
    let html = '<div class="llm-grid">';
    
    llmBehaviors.forEach(([llmName, data]) => {
        html += `
            <div class="llm-card">
                <h4>${llmName}</h4>
                <p class="post-count">${data.total_posts} posts · ${Math.round(data.avg_view_count)} avg views</p>
                
                ${data.strengths && data.strengths.length > 0 ? `
                    <div class="llm-features strengths">
                        <h5>Strengths</h5>
                        <ul>
                            ${data.strengths.slice(0, 4).map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${data.weaknesses && data.weaknesses.length > 0 ? `
                    <div class="llm-features weaknesses">
                        <h5>Weaknesses</h5>
                        <ul>
                            ${data.weaknesses.slice(0, 4).map(w => `<li>${w}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${data.patterns && data.patterns.length > 0 ? `
                    <div class="llm-features patterns" style="margin-top: 1rem;">
                        <h5>Behavior Patterns</h5>
                        <ul>
                            ${data.patterns.slice(0, 3).map(p => `<li>${p}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Render submissions list
function renderSubmissions() {
    const container = document.getElementById('submissions-list');
    const resultsCount = document.getElementById('results-count');
    
    resultsCount.textContent = `Showing ${filteredSubmissions.length} of ${allSubmissions.length} submissions`;
    
    if (filteredSubmissions.length === 0) {
        container.innerHTML = '<p>No submissions match your search criteria.</p>';
        return;
    }
    
    let html = '';
    
    filteredSubmissions.forEach(submission => {
        const hasLinks = Object.values(submission.links).some(arr => arr.length > 0);
        
        html += `
            <div class="submission-card" data-id="${submission.id}">
                <div class="submission-header">
                    <div class="submission-title">
                        <h3>${escapeHtml(submission.title)}</h3>
                        <div class="submission-meta">
                            <span class="meta-badge">👤 ${escapeHtml(submission.author_name)}</span>
                            <span class="meta-badge llm">🤖 ${escapeHtml(submission.llm_name)}</span>
                            <span class="meta-badge homework">📝 ${escapeHtml(submission.homework)}</span>
                            <span class="meta-badge">📊 Type ${submission.participation_type}</span>
                        </div>
                    </div>
                    <div class="submission-stats">
                        <span>👁️ ${submission.view_count} views</span>
                        <span>💬 ${submission.reply_count} replies</span>
                    </div>
                </div>
                
                <div class="submission-content collapsed" id="content-${submission.id}">
                    ${formatContent(submission.content)}
                </div>
                <button class="expand-button" onclick="toggleContent(${submission.id})">
                    Read more
                </button>
                
                ${submission.categories && submission.categories.length > 0 ? `
                    <div class="category-tags">
                        ${submission.categories.map(cat => 
                            `<span class="category-tag ${highlightCategory(cat)}">${cat}</span>`
                        ).join('')}
                    </div>
                ` : ''}
                
                ${hasLinks ? `
                    <div class="submission-links">
                        ${renderLinks(submission.links)}
                    </div>
                ` : ''}
                
                ${submission.comments && submission.comments.length > 0 ? `
                    <div class="comments-section">
                        <strong>Comments:</strong>
                        ${submission.comments.map(comment => `
                            <div class="comment ${comment.is_endorsed ? 'endorsed' : ''}">
                                <div class="comment-author">${escapeHtml(comment.author)}</div>
                                <div>${escapeHtml(comment.content)}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Helper function to render links
function renderLinks(links) {
    let html = '';
    
    links.chat_links.forEach(link => {
        html += `<a href="${link}" target="_blank" class="link-button chat-link">💬 View Chat Transcript</a>`;
    });
    
    links.drive_links.forEach(link => {
        html += `<a href="${link}" target="_blank" class="link-button drive-link">📄 View Document</a>`;
    });
    
    links.github_links.forEach(link => {
        html += `<a href="${link}" target="_blank" class="link-button github-link">💻 View on GitHub</a>`;
    });
    
    links.other_links.forEach(link => {
        html += `<a href="${link}" target="_blank" class="link-button">🔗 External Link</a>`;
    });
    
    return html;
}

// Format content with line breaks
function formatContent(content) {
    return escapeHtml(content)
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
}

// Highlight certain categories
function highlightCategory(category) {
    const highlights = ['hallucinations', 'errors', 'confusion'];
    return highlights.includes(category.toLowerCase()) ? 'highlight' : '';
}

// Toggle content expansion
function toggleContent(id) {
    const content = document.getElementById(`content-${id}`);
    const button = event.target;
    
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        button.textContent = 'Read less';
    } else {
        content.classList.add('collapsed');
        button.textContent = 'Read more';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', debounce(filterSubmissions, 300));
    
    // Filter dropdowns
    document.getElementById('filter-type').addEventListener('change', filterSubmissions);
    document.getElementById('filter-llm').addEventListener('change', filterSubmissions);
    document.getElementById('filter-homework').addEventListener('change', filterSubmissions);
    
    // Reset button
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
    
    // Tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderLLMComparison(e.target.dataset.type);
        });
    });
    
    // Smooth scroll for navigation
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Filter submissions based on search and filters
function filterSubmissions() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filterType = document.getElementById('filter-type').value;
    const filterLLM = document.getElementById('filter-llm').value;
    const filterHW = document.getElementById('filter-homework').value;
    
    filteredSubmissions = allSubmissions.filter(sub => {
        // Search filter
        const matchesSearch = !searchTerm || 
            sub.title.toLowerCase().includes(searchTerm) ||
            sub.author_name.toLowerCase().includes(searchTerm) ||
            sub.content.toLowerCase().includes(searchTerm) ||
            sub.llm_name.toLowerCase().includes(searchTerm) ||
            sub.homework.toLowerCase().includes(searchTerm);
        
        // Type filter
        const matchesType = filterType === 'all' || sub.participation_type === filterType;
        
        // LLM filter
        const matchesLLM = filterLLM === 'all' || sub.llm_name === filterLLM;
        
        // Homework filter
        const matchesHW = filterHW === 'all' || sub.homework === filterHW;
        
        return matchesSearch && matchesType && matchesLLM && matchesHW;
    });
    
    renderSubmissions();
}

// Reset all filters
function resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-type').value = 'all';
    document.getElementById('filter-llm').value = 'all';
    document.getElementById('filter-homework').value = 'all';
    filterSubmissions();
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Setup scroll to top button
function setupScrollTop() {
    const scrollBtn = document.createElement('div');
    scrollBtn.className = 'scroll-top';
    scrollBtn.innerHTML = '↑';
    scrollBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.appendChild(scrollBtn);
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });
}

// Make toggleContent available globally
window.toggleContent = toggleContent;
