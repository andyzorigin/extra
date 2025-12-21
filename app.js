// Global data storage
let participationA = [];
let participationB = [];
let insightsA = {};
let insightsB = {};
let allSubmissions = [];
let filteredSubmissions = [];
let charts = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    initializeUI();
    renderOverview();
    renderVisualizations();
    // renderInsights(); // Commented out - insights section is commented out in HTML
    // renderLLMComparison('a'); // Commented out - now using radar charts instead
    renderLeaderboard('posts');
    renderSubmissions();
    setupEventListeners();
    setupScrollTop();
    setupDarkMode();
    setupChatbot();
    animateStats();
    observeSections();
});

// Load data from JSON files
async function loadData() {
    try {
        showLoadingIndicator();
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
        
        hideLoadingIndicator();
        showToast('Data loaded successfully!', 'success');
    } catch (error) {
        console.error('Error loading data:', error);
        hideLoadingIndicator();
        showToast('Error loading data. Please refresh the page.', 'error');
    }
}

// Initialize UI components
function initializeUI() {
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
    
    Array.from(homeworks).sort((a, b) => {
        const aNum = parseInt(a.replace(/\D/g, ''));
        const bNum = parseInt(b.replace(/\D/g, ''));
        return aNum - bNum;
    }).forEach(hw => {
        const option = document.createElement('option');
        option.value = hw;
        option.textContent = hw;
        hwSelect.appendChild(option);
    });
}

// Render overview statistics with animation
function renderOverview() {
    const uniqueStudents = new Set([
        ...participationA.map(p => p.author_name),
        ...participationB.map(p => p.author_name)
    ]);
    
    const uniqueLLMs = new Set([
        ...Object.keys(insightsA.llm_behaviors || {}),
        ...Object.keys(insightsB.llm_behaviors || {})
    ]);
    
    document.getElementById('total-a-posts').setAttribute('data-count', participationA.length);
    document.getElementById('total-b-posts').setAttribute('data-count', participationB.length);
    document.getElementById('total-students').setAttribute('data-count', uniqueStudents.size);
    document.getElementById('total-llms').setAttribute('data-count', uniqueLLMs.size);
}

// Animate counting numbers
function animateStats() {
    const stats = document.querySelectorAll('.stat-number[data-count]');
    stats.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-count'));
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                stat.textContent = target;
                clearInterval(timer);
            } else {
                stat.textContent = Math.floor(current);
            }
        }, 30);
    });
}

// Render data visualizations with Chart.js
function renderVisualizations() {
    // LLM Usage Chart
    const llmCounts = {};
    allSubmissions.forEach(sub => {
        if (sub.llm_name !== 'Not specified') {
            llmCounts[sub.llm_name] = (llmCounts[sub.llm_name] || 0) + 1;
        }
    });
    
    const sortedLLMs = Object.entries(llmCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    charts.llmUsage = new Chart(document.getElementById('llm-usage-chart'), {
        type: 'bar',
        data: {
            labels: sortedLLMs.map(([name]) => name),
            datasets: [{
                label: 'Number of Posts',
                data: sortedLLMs.map(([, count]) => count),
                backgroundColor: 'rgba(59, 126, 161, 0.7)',
                borderColor: 'rgba(59, 126, 161, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
    
    // Homework Coverage Chart
    const hwCounts = {};
    allSubmissions.forEach(sub => {
        if (sub.homework !== 'Not specified') {
            hwCounts[sub.homework] = (hwCounts[sub.homework] || 0) + 1;
        }
    });
    
    const sortedHW = Object.entries(hwCounts)
        .sort((a, b) => {
            const aNum = parseInt(a[0].replace(/\D/g, ''));
            const bNum = parseInt(b[0].replace(/\D/g, ''));
            return aNum - bNum;
        });
    
    charts.homework = new Chart(document.getElementById('homework-chart'), {
        type: 'line',
        data: {
            labels: sortedHW.map(([name]) => name),
            datasets: [{
                label: 'Posts per Homework',
                data: sortedHW.map(([, count]) => count),
                borderColor: 'rgba(253, 181, 21, 1)',
                backgroundColor: 'rgba(253, 181, 21, 0.2)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
    
    // Performance Metrics Chart
    const llmMetrics = Object.entries(insightsA.llm_behaviors || {})
        .concat(Object.entries(insightsB.llm_behaviors || {}))
        .reduce((acc, [name, data]) => {
            if (!acc[name]) {
                acc[name] = {
                    posts: 0,
                    views: []
                };
            }
            acc[name].posts += data.total_posts;
            acc[name].views.push(data.avg_view_count);
            return acc;
        }, {});
    
    const topLLMs = Object.entries(llmMetrics)
        .sort((a, b) => b[1].posts - a[1].posts)
        .slice(0, 8);
    
    charts.performance = new Chart(document.getElementById('performance-chart'), {
        type: 'bar',
        data: {
            labels: topLLMs.map(([name]) => name),
            datasets: [
                {
                    label: 'Total Posts',
                    data: topLLMs.map(([, data]) => data.posts),
                    backgroundColor: 'rgba(0, 50, 98, 0.7)',
                    yAxisID: 'y'
                },
                {
                    label: 'Avg Views',
                    data: topLLMs.map(([, data]) => 
                        data.views.reduce((a, b) => a + b, 0) / data.views.length
                    ),
                    backgroundColor: 'rgba(59, 126, 161, 0.7)',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Total Posts' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Average Views' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
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
                    `<span class="theme-tag">${escapeHtml(theme)}</span>`
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
                <h4>${escapeHtml(llmName)}</h4>
                <p class="post-count">
                    <i class="fas fa-file-alt"></i> ${data.total_posts} posts · 
                    <i class="fas fa-eye"></i> ${Math.round(data.avg_view_count)} avg views
                </p>
                
                ${data.strengths && data.strengths.length > 0 ? `
                    <div class="llm-features strengths">
                        <h5><i class="fas fa-check-circle"></i> Strengths</h5>
                        <ul>
                            ${data.strengths.slice(0, 4).map(s => `<li>${escapeHtml(s)}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${data.weaknesses && data.weaknesses.length > 0 ? `
                    <div class="llm-features weaknesses">
                        <h5><i class="fas fa-exclamation-circle"></i> Weaknesses</h5>
                        <ul>
                            ${data.weaknesses.slice(0, 4).map(w => `<li>${escapeHtml(w)}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${data.patterns && data.patterns.length > 0 ? `
                    <div class="llm-features patterns" style="margin-top: 1rem;">
                        <h5><i class="fas fa-project-diagram"></i> Behavior Patterns</h5>
                        <ul>
                            ${data.patterns.slice(0, 3).map(p => `<li>${escapeHtml(p)}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Render leaderboard
function renderLeaderboard(metric) {
    const container = document.getElementById('leaderboard-content');
    
    let rankings = [];
    
    if (metric === 'posts') {
        const studentPosts = {};
        allSubmissions.forEach(sub => {
            studentPosts[sub.author_name] = (studentPosts[sub.author_name] || 0) + 1;
        });
        rankings = Object.entries(studentPosts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);
    } else if (metric === 'views') {
        const studentViews = {};
        allSubmissions.forEach(sub => {
            studentViews[sub.author_name] = (studentViews[sub.author_name] || 0) + sub.view_count;
        });
        rankings = Object.entries(studentViews)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);
    } else if (metric === 'engagement') {
        const studentEngagement = {};
        allSubmissions.forEach(sub => {
            const engagement = sub.view_count + (sub.reply_count * 5);
            studentEngagement[sub.author_name] = (studentEngagement[sub.author_name] || 0) + engagement;
        });
        rankings = Object.entries(studentEngagement)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);
    }
    
    let html = '';
    rankings.forEach(([name, value], index) => {
        const rank = index + 1;
        let rankClass = '';
        if (rank === 1) rankClass = 'gold';
        else if (rank === 2) rankClass = 'silver';
        else if (rank === 3) rankClass = 'bronze';
        
        const icon = rank <= 3 ? '<i class="fas fa-trophy"></i>' : rank;
        
        html += `
            <div class="leaderboard-entry">
                <div class="leaderboard-rank ${rankClass}">${icon}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-name">${escapeHtml(name)}</div>
                    <div class="leaderboard-stats">
                        ${metric === 'posts' ? `${value} posts` : 
                          metric === 'views' ? `${value} total views` : 
                          `${value} engagement score`}
                    </div>
                </div>
                <div class="leaderboard-value">${value}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Render submissions list
function renderSubmissions() {
    const container = document.getElementById('submissions-list');
    const resultsCount = document.getElementById('results-count');
    
    resultsCount.innerHTML = `<i class="fas fa-list"></i> Showing <strong>${filteredSubmissions.length}</strong> of <strong>${allSubmissions.length}</strong> submissions`;
    
    if (filteredSubmissions.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 3rem; color: var(--text-color); opacity: 0.7;">No submissions match your search criteria.</p>';
        return;
    }
    
    let html = '';
    
    filteredSubmissions.forEach(submission => {
        const hasLinks = Object.values(submission.links).some(arr => arr.length > 0);
        const hasAttachments = submission.attachments && submission.attachments.length > 0;
        
        html += `
            <div class="submission-card" data-id="${submission.id}">
                <div class="submission-header">
                    <div class="submission-title">
                        <h3>${escapeHtml(submission.title)}</h3>
                        <div class="submission-meta">
                            <span class="meta-badge"><i class="fas fa-user"></i> ${escapeHtml(submission.author_name)}</span>
                            <span class="meta-badge llm clickable" data-filter-type="llm" data-filter-value="${escapeHtml(submission.llm_name)}"><i class="fas fa-robot"></i> ${escapeHtml(submission.llm_name)}</span>
                            <span class="meta-badge homework clickable" data-filter-type="homework" data-filter-value="${escapeHtml(submission.homework)}"><i class="fas fa-book"></i> ${escapeHtml(submission.homework)}</span>
                            <span class="meta-badge clickable" data-filter-type="type" data-filter-value="${submission.participation_type}"><i class="fas fa-tag"></i> Type ${submission.participation_type}</span>
                        </div>
                    </div>
                    <div class="submission-stats">
                        <span><i class="fas fa-eye"></i> ${submission.view_count}</span>
                        <span><i class="fas fa-comment"></i> ${submission.reply_count}</span>
                    </div>
                </div>
                
                <div class="submission-content collapsed" id="content-${submission.id}">
                    ${formatContent(submission.content)}
                </div>
                <button class="expand-button" onclick="toggleContent(${submission.id})">
                    <i class="fas fa-chevron-down"></i> Read more
                </button>
                
                ${submission.categories && submission.categories.length > 0 ? `
                    <div class="category-tags">
                        ${submission.categories.map(cat => 
                            `<span class="category-tag ${highlightCategory(cat)}">${escapeHtml(cat)}</span>`
                        ).join('')}
                    </div>
                ` : ''}
                
                ${(hasLinks || hasAttachments) ? `
                    <div class="submission-links">
                        ${hasAttachments ? renderAttachments(submission.attachments) : ''}
                        ${hasLinks ? renderLinks(submission.links) : ''}
                    </div>
                ` : ''}
                
                ${submission.comments && submission.comments.length > 0 ? `
                    <div class="comments-section">
                        <strong><i class="fas fa-comments"></i> Comments:</strong>
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

// Helper function to render attachments
function renderAttachments(attachments) {
    if (!attachments) return '';
    return attachments.map(file => `
        <a href="${file.url}" target="_blank" class="link-button attachment-link" download>
            <i class="fas fa-paperclip"></i> ${escapeHtml(file.filename)}
        </a>
    `).join('');
}

// Helper function to render links
function renderLinks(links) {
    let html = '';
    
    links.chat_links.forEach(link => {
        html += `<a href="${link}" target="_blank" class="link-button chat-link">
            <i class="fas fa-comment-dots"></i> View Chat
        </a>`;
    });
    
    links.drive_links.forEach(link => {
        html += `<a href="${link}" target="_blank" class="link-button drive-link">
            <i class="fas fa-file"></i> View Document
        </a>`;
    });
    
    links.github_links.forEach(link => {
        html += `<a href="${link}" target="_blank" class="link-button github-link">
            <i class="fab fa-github"></i> View on GitHub
        </a>`;
    });
    
    links.other_links.forEach(link => {
        html += `<a href="${link}" target="_blank" class="link-button">
            <i class="fas fa-link"></i> External Link
        </a>`;
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
    const button = event.target.closest('.expand-button');
    
    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        button.innerHTML = '<i class="fas fa-chevron-up"></i> Read less';
    } else {
        content.classList.add('collapsed');
        button.innerHTML = '<i class="fas fa-chevron-down"></i> Read more';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', debounce(filterSubmissions, 300));
    
    // Clear search button
    document.getElementById('clear-search').addEventListener('click', () => {
        searchInput.value = '';
        filterSubmissions();
    });
    
    // Filter dropdowns
    document.getElementById('filter-type').addEventListener('change', filterSubmissions);
    document.getElementById('filter-llm').addEventListener('change', filterSubmissions);
    document.getElementById('filter-homework').addEventListener('change', filterSubmissions);
    document.getElementById('sort-by').addEventListener('change', filterSubmissions);
    
    // Reset button
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
    
    // Tab buttons for LLM comparison - COMMENTED OUT (using radar charts now)
    /*
    document.querySelectorAll('.tabs .tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.tabs .tab-button').forEach(b => b.classList.remove('active'));
            e.target.closest('.tab-button').classList.add('active');
            renderLLMComparison(e.target.closest('.tab-button').dataset.type);
        });
    });
    */
    
    // View control buttons - COMMENTED OUT (using radar charts now)
    /*
    document.querySelectorAll('.view-button').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.view-button').forEach(b => b.classList.remove('active'));
            e.target.closest('.view-button').classList.add('active');
            const view = e.target.closest('.view-button').dataset.view;
            const container = document.getElementById('llm-comparison-content');
            container.className = view === 'list' ? 'list-view' : 'grid-view';
        });
    });
    */
    
    // View toggle buttons for submissions
    document.querySelectorAll('.view-toggle-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
            const btn = e.target.closest('.view-toggle-btn');
            btn.classList.add('active');
            const view = btn.dataset.view;
            const submissionsList = document.getElementById('submissions-list');
            submissionsList.className = view === 'compact' ? 'compact-view' : '';

            // If switching back to cards view, remove all expanded classes
            if (view === 'cards') {
                submissionsList.querySelectorAll('.submission-card.expanded').forEach(card => {
                    card.classList.remove('expanded');
                });
            }
        });
    });

    // Click listener for expanding compact cards
    document.getElementById('submissions-list').addEventListener('click', (e) => {
        const card = e.target.closest('.submission-card');
        const title = e.target.closest('.submission-title');
        const isCompactView = document.getElementById('submissions-list').classList.contains('compact-view');

        if (isCompactView && card) {
            // If the card is already expanded, only collapse it if the title is clicked
            if (card.classList.contains('expanded')) {
                if (title) {
                    card.classList.remove('expanded');
                }
            } else {
                // If the card is not expanded, expand it on any click
                card.classList.add('expanded');
            }
        }
    });
    
    // Leaderboard tabs
    document.querySelectorAll('.leaderboard-tab').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.leaderboard-tab').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderLeaderboard(e.target.dataset.metric);
        });
    });
    
    // Export button
    document.getElementById('export-button').addEventListener('click', exportData);
    
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

    // Click listener for meta badges
    document.getElementById('submissions-list').addEventListener('click', (e) => {
        const badge = e.target.closest('.meta-badge.clickable');
        if (badge) {
            e.stopPropagation(); // Prevent card from expanding
            const filterType = badge.dataset.filterType;
            const filterValue = badge.dataset.filterValue;

            if (filterValue && filterValue !== 'Not specified') {
                const filterId = `filter-${filterType}`;
                const select = document.getElementById(filterId);
                if (select) {
                    select.value = filterValue;
                    filterSubmissions();
                    document.getElementById('submissions').scrollIntoView({ behavior: 'smooth' });
                    document.querySelector('.submissions-scroll-container').scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        }
    });
}

// Filter submissions based on search and filters
function filterSubmissions() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filterType = document.getElementById('filter-type').value;
    const filterLLM = document.getElementById('filter-llm').value;
    const filterHW = document.getElementById('filter-homework').value;
    const sortBy = document.getElementById('sort-by').value;
    
    filteredSubmissions = allSubmissions.filter(sub => {
        const matchesSearch = !searchTerm || 
            sub.title.toLowerCase().includes(searchTerm) ||
            sub.author_name.toLowerCase().includes(searchTerm) ||
            sub.content.toLowerCase().includes(searchTerm) ||
            sub.llm_name.toLowerCase().includes(searchTerm) ||
            sub.homework.toLowerCase().includes(searchTerm);
        
        const matchesType = filterType === 'all' || sub.participation_type === filterType;
        const matchesLLM = filterLLM === 'all' || sub.llm_name === filterLLM;
        const matchesHW = filterHW === 'all' || sub.homework === filterHW;
        
        return matchesSearch && matchesType && matchesLLM && matchesHW;
    });
    
    // Apply sorting
    switch(sortBy) {
        case 'newest':
            filteredSubmissions.sort((a, b) => b.number - a.number);
            break;
        case 'oldest':
            filteredSubmissions.sort((a, b) => a.number - b.number);
            break;
        case 'most-viewed':
            filteredSubmissions.sort((a, b) => b.view_count - a.view_count);
            break;
        case 'most-replies':
            filteredSubmissions.sort((a, b) => b.reply_count - a.reply_count);
            break;
    }
    
    renderSubmissions();
    document.querySelector('.submissions-scroll-container').scrollTo({ top: 0, behavior: 'smooth' });
}

// Reset all filters
function resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-type').value = 'all';
    document.getElementById('filter-llm').value = 'all';
    document.getElementById('filter-homework').value = 'all';
    document.getElementById('sort-by').value = 'newest';
    filterSubmissions();
    showToast('Filters reset', 'info');
}

// Export data functionality
function exportData() {
    const dataStr = JSON.stringify(filteredSubmissions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cs182_submissions_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully!', 'success');
}

// Setup dark mode
function setupDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    if (currentTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    darkModeToggle.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('theme', 'dark');
        }
        
        // Update charts
        Object.values(charts).forEach(chart => chart.update());
    });
}

// Setup chatbot
function setupChatbot() {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotSend = document.getElementById('chatbot-send');
    const chatbotInput = document.getElementById('chatbot-input');
    
    chatbotToggle.addEventListener('click', () => {
        chatbotWindow.style.display = chatbotWindow.style.display === 'none' ? 'flex' : 'none';
    });
    
    chatbotClose.addEventListener('click', () => {
        chatbotWindow.style.display = 'none';
    });
    
    chatbotSend.addEventListener('click', () => sendChatMessage());
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
}

// Send chat message
async function sendChatMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    const messagesContainer = document.getElementById('chatbot-messages');
    
    // Add user message
    const userMessageHTML = `
        <div class="chatbot-message user-message">
            <div class="message-avatar"><i class="fas fa-user"></i></div>
            <div class="message-content">${escapeHtml(message)}</div>
        </div>
    `;
    messagesContainer.insertAdjacentHTML('beforeend', userMessageHTML);
    input.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Process the query
    const response = await processChatQuery(message);
    
    // Add bot response
    const botMessageHTML = `
        <div class="chatbot-message bot-message">
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content">${response}</div>
        </div>
    `;
    messagesContainer.insertAdjacentHTML('beforeend', botMessageHTML);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Process chat query
async function processChatQuery(query) {
    query = query.toLowerCase();
    
    // Simple pattern matching for common queries
    if (query.includes('best') || query.includes('top')) {
        if (query.includes('llm')) {
            const topLLM = Object.entries(insightsA.llm_behaviors)
                .sort((a, b) => b[1].total_posts - a[1].total_posts)[0];
            return `The most frequently used LLM is <strong>${topLLM[0]}</strong> with ${topLLM[1].total_posts} posts.`;
        }
    }
    
    if (query.includes('weakness') || query.includes('problem')) {
        const llmMatch = query.match(/\b(deepseek|gemini|grok|chatgpt|claude|mistral|gpt)\b/i);
        if (llmMatch) {
            const llmName = Object.keys(insightsA.llm_behaviors).find(name => 
                name.toLowerCase().includes(llmMatch[1].toLowerCase())
            );
            if (llmName) {
                const weaknesses = insightsA.llm_behaviors[llmName].weaknesses || [];
                return `Common weaknesses of ${llmName}:<ul>${weaknesses.slice(0, 3).map(w => `<li>${w}</li>`).join('')}</ul>`;
            }
        }
    }
    
    if (query.includes('strength') || query.includes('good')) {
        const llmMatch = query.match(/\b(deepseek|gemini|grok|chatgpt|claude|mistral|gpt)\b/i);
        if (llmMatch) {
            const llmName = Object.keys(insightsA.llm_behaviors).find(name => 
                name.toLowerCase().includes(llmMatch[1].toLowerCase())
            );
            if (llmName) {
                const strengths = insightsA.llm_behaviors[llmName].strengths || [];
                return `Strengths of ${llmName}:<ul>${strengths.slice(0, 3).map(s => `<li>${s}</li>`).join('')}</ul>`;
            }
        }
    }
    
    if (query.includes('hallucination')) {
        const count = allSubmissions.filter(s => 
            s.categories && s.categories.some(c => c.toLowerCase().includes('hallucination'))
        ).length;
        return `There are <strong>${count}</strong> submissions that mention hallucinations as an issue.`;
    }
    
    if (query.includes('compare')) {
        return `To compare LLMs, check out the <a href="#llm-comparison" onclick="document.getElementById('llm-comparison').scrollIntoView({behavior: 'smooth'}); document.getElementById('chatbot-window').style.display='none';">LLM Comparison section</a> where you can see detailed strengths and weaknesses of each model.`;
    }
    
    if (query.includes('hw') || query.includes('homework')) {
        const hwMatch = query.match(/hw\s*(\d+)/i);
        if (hwMatch) {
            const hwNum = hwMatch[1];
            const count = allSubmissions.filter(s => s.homework.includes(hwNum)).length;
            return `There are <strong>${count}</strong> submissions for HW${hwNum}.`;
        }
    }
    
    // Default response
    return `I found your question interesting! You can explore the data using the search and filter tools above. Try asking about specific LLMs (DeepSeek, Gemini, Grok, etc.), their strengths/weaknesses, or homework assignments.`;
}

// Toast notification system
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type]}"></i></div>
        <div>${message}</div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Loading indicator
function showLoadingIndicator() {
    document.getElementById('loading-indicator').style.display = 'block';
}

function hideLoadingIndicator() {
    document.getElementById('loading-indicator').style.display = 'none';
}

// Intersection Observer for fade-in animations
function observeSections() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.section').forEach(section => {
        observer.observe(section);
    });
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
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Setup scroll to top button
function setupScrollTop() {
    const scrollBtn = document.createElement('div');
    scrollBtn.className = 'scroll-top';
    scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
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
