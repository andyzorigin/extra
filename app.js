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
    renderLLMAnalysis();
    renderAdvancedInsights();
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
    document.getElementById('total-llms').setAttribute('data-count', 6); // Fixed to 6 LLMs
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
    
    // Posts Over Time Chart - Grouped by week
    const postsTimelineA = {};
    const postsTimelineB = {};
    
    // Helper function to get week start date (Monday)
    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
        const monday = new Date(d.setDate(diff));
        return monday.toISOString().split('T')[0];
    }
    
    participationA.forEach(post => {
        const weekStart = getWeekStart(post.created_at);
        postsTimelineA[weekStart] = (postsTimelineA[weekStart] || 0) + 1;
    });
    
    participationB.forEach(post => {
        const weekStart = getWeekStart(post.created_at);
        postsTimelineB[weekStart] = (postsTimelineB[weekStart] || 0) + 1;
    });
    
    // Get all unique weeks and sort them
    const allWeeks = [...new Set([...Object.keys(postsTimelineA), ...Object.keys(postsTimelineB)])].sort();
    
    // Fill in the data arrays
    const dataA = allWeeks.map(week => postsTimelineA[week] || 0);
    const dataB = allWeeks.map(week => postsTimelineB[week] || 0);
    
    charts.timeline = new Chart(document.getElementById('posts-timeline-chart'), {
        type: 'line',
        data: {
            labels: allWeeks.map(week => {
                // Format date as MM/DD
                const d = new Date(week);
                return `${d.getMonth() + 1}/${d.getDate()}`;
            }),
            datasets: [
                {
                    label: 'Participation A',
                    data: dataA,
                    borderColor: 'rgba(0, 50, 98, 1)',
                    backgroundColor: 'rgba(0, 50, 98, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Participation B',
                    data: dataB,
                    borderColor: 'rgba(253, 181, 21, 1)',
                    backgroundColor: 'rgba(253, 181, 21, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const weekIndex = context[0].dataIndex;
                            return 'Week of ' + allWeeks[weekIndex];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Posts'
                    },
                    ticks: {
                        stepSize: 5
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Week'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
    
    // Performance Metrics Chart - COMMENTED OUT
    /*
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
    */
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

// Render LLM Analysis Section
function renderLLMAnalysis() {
    const container = document.getElementById('llm-analysis-content');
    if (!container) return;
    
    // Analyze all submissions to extract LLM insights
    const llmData = analyzeLLMData();
    
    // Sort LLMs by total submissions
    const sortedLLMs = Object.keys(llmData).sort((a, b) => 
        llmData[b].totalSubmissions - llmData[a].totalSubmissions
    );
    
    let html = '<div class="llm-analysis-grid">';
    
    sortedLLMs.forEach(llmName => {
        const data = llmData[llmName];
        const llmClass = llmName.toLowerCase().replace(/\s+/g, '-');
        
        html += `
            <div class="llm-analysis-card ${llmClass}">
                <div class="llm-analysis-header">
                    <h3>${llmName}</h3>
                    <div class="llm-stats-badge">
                        <span><i class="fas fa-file-alt"></i> ${data.participationA} A</span>
                        <span><i class="fas fa-code"></i> ${data.participationB} B</span>
                    </div>
                </div>
                
                <div class="llm-analysis-body">
                    <div class="analysis-section">
                        <h4><i class="fas fa-check-circle"></i> Key Strengths</h4>
                        <ul class="strengths-list">
                            ${data.strengths.slice(0, 5).map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="analysis-section">
                        <h4><i class="fas fa-exclamation-triangle"></i> Notable Weaknesses</h4>
                        <ul class="weaknesses-list">
                            ${data.weaknesses.slice(0, 5).map(w => `<li>${w}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="analysis-section best-practices">
                        <h4><i class="fas fa-lightbulb"></i> Best Practices</h4>
                        <ul class="practices-list">
                            ${data.bestPractices.slice(0, 4).map(p => `<li>${p}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="analysis-footer">
                        <div class="performance-metrics">
                            <div class="metric">
                                <i class="fas fa-bolt"></i>
                                <span>One-shot Success: ${data.oneShotRate}%</span>
                            </div>
                            <div class="metric">
                                <i class="fas fa-brain"></i>
                                <span>Avg Explanation Quality: ${data.explanationQuality}/5</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Analyze LLM data from all submissions
function analyzeLLMData() {
    const llmData = {};
    
    // Initialize data structure for each LLM
    const initializeLLM = (name) => {
        if (!llmData[name]) {
            llmData[name] = {
                totalSubmissions: 0,
                participationA: 0,
                participationB: 0,
                strengths: [],
                weaknesses: [],
                bestPractices: [],
                categories: {},
                oneShotRate: 0,
                explanationQuality: 0
            };
        }
    };
    
    // Process all submissions
    allSubmissions.forEach(sub => {
        const llmName = normalizeLLMName(sub.llm_name);
        if (!llmName || llmName === 'Not specified') return;
        
        initializeLLM(llmName);
        const llm = llmData[llmName];
        
        llm.totalSubmissions++;
        if (sub.participation_type === 'A') llm.participationA++;
        else if (sub.participation_type === 'B') llm.participationB++;
        
        // Track categories
        if (sub.categories) {
            sub.categories.forEach(cat => {
                llm.categories[cat] = (llm.categories[cat] || 0) + 1;
            });
        }
        
        // Extract insights from content
        if (sub.content) {
            extractInsights(sub.content, llm, sub.participation_type);
        }
    });
    
    // Finalize analysis for each LLM
    Object.keys(llmData).forEach(llmName => {
        const llm = llmData[llmName];
        
        // Calculate metrics
        const correctCount = (llm.categories['correct solutions'] || 0);
        const oneShotCount = (llm.categories['one-shot solving'] || 0);
        llm.oneShotRate = Math.round((oneShotCount / llm.totalSubmissions) * 100) || 0;
        
        const explainCount = (llm.categories['explanations'] || 0);
        llm.explanationQuality = Math.min(5, Math.round((explainCount / llm.totalSubmissions) * 5)) || 3;
        
        // Deduplicate and sort insights
        llm.strengths = [...new Set(llm.strengths)].slice(0, 7);
        llm.weaknesses = [...new Set(llm.weaknesses)].slice(0, 7);
        llm.bestPractices = [...new Set(llm.bestPractices)].slice(0, 6);
        
        // Add generic insights if not enough specific ones
        fillGenericInsights(llm, llmName);
    });
    
    return llmData;
}

// Normalize LLM names to handle variations
function normalizeLLMName(name) {
    if (!name || name === 'Not specified') return null;
    
    const normalized = name.toLowerCase();
    if (normalized.includes('chatgpt') || normalized.includes('gpt')) return 'ChatGPT';
    if (normalized.includes('gemini')) return 'Gemini';
    if (normalized.includes('claude')) return 'Claude';
    if (normalized.includes('deepseek')) return 'DeepSeek';
    if (normalized.includes('grok')) return 'Grok';
    if (normalized.includes('mistral')) return 'Mistral';
    if (normalized.includes('llama')) return 'Llama';
    
    return name;
}

// Extract insights from student descriptions
function extractInsights(content, llm, participationType) {
    const lowerContent = content.toLowerCase();
    
    // Strengths patterns
    if (lowerContent.includes('one-shot') || lowerContent.includes('one shot') || lowerContent.includes('first try')) {
        llm.strengths.push('High success rate on one-shot problem solving');
    }
    if (lowerContent.includes('clear') && lowerContent.includes('explanation')) {
        llm.strengths.push('Provides clear and detailed explanations');
    }
    if (lowerContent.includes('accurate') || lowerContent.includes('correct')) {
        llm.strengths.push('Produces accurate solutions for most problems');
    }
    if (lowerContent.includes('helpful') || lowerContent.includes('useful')) {
        llm.strengths.push('Helpful for learning and understanding concepts');
    }
    if (lowerContent.includes('reasoning') && !lowerContent.includes('weak reasoning')) {
        llm.strengths.push('Strong analytical and reasoning capabilities');
    }
    if (lowerContent.includes('adaptable') || lowerContent.includes('flexible')) {
        llm.strengths.push('Adapts well to different prompting styles');
    }
    if (lowerContent.includes('intuition') || lowerContent.includes('conceptual')) {
        llm.strengths.push('Good conceptual intuition for deep learning topics');
    }
    if (participationType === 'B' && (lowerContent.includes('code') && lowerContent.includes('correct'))) {
        llm.strengths.push('Generates functionally correct code implementations');
    }
    
    // Weaknesses patterns
    if (lowerContent.includes('hallucination') || lowerContent.includes('hallucinate')) {
        llm.weaknesses.push('Occasional hallucinations or fabricated information');
    }
    if (lowerContent.includes('verbose') || lowerContent.includes('too long') || lowerContent.includes('wordy')) {
        llm.weaknesses.push('Tendency to be overly verbose in explanations');
    }
    if (lowerContent.includes('skip') && lowerContent.includes('step')) {
        llm.weaknesses.push('Sometimes skips important intermediate steps');
    }
    if (lowerContent.includes('context') && (lowerContent.includes('lose') || lowerContent.includes('lost'))) {
        llm.weaknesses.push('Can lose context in longer conversations');
    }
    if (lowerContent.includes('calculation') && lowerContent.includes('error')) {
        llm.weaknesses.push('Prone to computational or calculation errors');
    }
    if (lowerContent.includes('numerical') && (lowerContent.includes('mistake') || lowerContent.includes('wrong'))) {
        llm.weaknesses.push('Struggles with precise numerical computations');
    }
    if (lowerContent.includes('confused') || lowerContent.includes('confusion')) {
        llm.weaknesses.push('May get confused with ambiguous problem statements');
    }
    if (lowerContent.includes('visual') || lowerContent.includes('image')) {
        if (lowerContent.includes('cannot') || lowerContent.includes('does not support')) {
            llm.weaknesses.push('Limited or no support for visual/image inputs');
        }
    }
    if (participationType === 'B' && lowerContent.includes('code') && lowerContent.includes('bug')) {
        llm.weaknesses.push('Generated code may contain subtle bugs');
    }
    
    // Best practices patterns
    if (lowerContent.includes('clear prompt') || lowerContent.includes('specific prompt')) {
        llm.bestPractices.push('Use clear and specific prompts for best results');
    }
    if (lowerContent.includes('hint') || lowerContent.includes('nudge')) {
        llm.bestPractices.push('Provide hints or nudges for complex multi-step problems');
    }
    if (lowerContent.includes('step by step') || lowerContent.includes('step-by-step')) {
        llm.bestPractices.push('Ask for step-by-step breakdowns when needed');
    }
    if (lowerContent.includes('latex') || lowerContent.includes('formatted')) {
        llm.bestPractices.push('Format mathematical expressions properly (LaTeX)');
    }
    if (lowerContent.includes('verify') || lowerContent.includes('check')) {
        llm.bestPractices.push('Ask the model to verify its own work');
    }
    if (lowerContent.includes('follow-up') || lowerContent.includes('iterate')) {
        llm.bestPractices.push('Use iterative prompting for refining answers');
    }
    if (lowerContent.includes('context') && lowerContent.includes('provide')) {
        llm.bestPractices.push('Provide sufficient context for complex problems');
    }
    if (participationType === 'B' && lowerContent.includes('test')) {
        llm.bestPractices.push('Request test cases for generated code');
    }
}

// Fill in generic insights based on LLM name
function fillGenericInsights(llm, llmName) {
    // Generic strengths
    const genericStrengths = {
        'ChatGPT': [
            'Widely trained on diverse problem types',
            'Consistent performance across different domains',
            'Good balance between speed and accuracy'
        ],
        'Claude': [
            'Thoughtful and methodical approach to problems',
            'Strong ethical reasoning and safety considerations',
            'Excellent at following complex instructions'
        ],
        'Gemini': [
            'Strong integration with Google ecosystem',
            'Multimodal capabilities for handling images',
            'Fast response times'
        ],
        'DeepSeek': [
            'Advanced reasoning with deep thinking mode',
            'Strong performance on analytical problems',
            'Good at mathematical derivations'
        ],
        'Grok': [
            'Creative and engaging responses',
            'Good at exploring multiple solution approaches',
            'Strong conceptual understanding'
        ],
        'Mistral': [
            'Efficient and focused responses',
            'Good at technical problem solving',
            'Strong European AI perspective'
        ]
    };
    
    // Generic weaknesses
    const genericWeaknesses = {
        'ChatGPT': [
            'May require prompt engineering for optimal results',
            'Can be inconsistent across different versions'
        ],
        'Claude': [
            'Sometimes overly cautious in responses',
            'May decline tasks that are actually appropriate'
        ],
        'Gemini': [
            'Still maturing in some advanced capabilities',
            'May vary in quality across different modalities'
        ],
        'DeepSeek': [
            'Thinking time can be lengthy for complex problems',
            'May over-explain simple concepts'
        ],
        'Grok': [
            'Can be verbose and overly enthusiastic',
            'May spend too long on preliminary thinking'
        ],
        'Mistral': [
            'Smaller context window than some competitors',
            'May struggle with very long documents'
        ]
    };
    
    // Generic best practices
    const genericPractices = {
        'ChatGPT': [
            'Experiment with different prompt formats',
            'Use system messages for consistent behavior',
            'Break complex problems into smaller parts'
        ],
        'Claude': [
            'Be explicit about your learning objectives',
            'Use XML tags for structured input when helpful',
            'Engage in dialogue rather than one-off queries'
        ],
        'Gemini': [
            'Leverage multimodal inputs when relevant',
            'Use iterative refinement for best results',
            'Combine text and visual information strategically'
        ],
        'DeepSeek': [
            'Enable deep thinking mode for complex problems',
            'Be patient with reasoning time',
            'Request structured output formats'
        ],
        'Grok': [
            'Set clear boundaries on response length',
            'Ask for concise summaries after detailed explanations',
            'Use it for brainstorming and exploration'
        ],
        'Mistral': [
            'Keep prompts focused and concise',
            'Use it for rapid prototyping',
            'Leverage its efficiency for quick iterations'
        ]
    };
    
    // Add generic insights if we don't have enough specific ones
    if (llm.strengths.length < 4 && genericStrengths[llmName]) {
        genericStrengths[llmName].forEach(s => {
            if (llm.strengths.length < 5 && !llm.strengths.includes(s)) {
                llm.strengths.push(s);
            }
        });
    }
    
    if (llm.weaknesses.length < 3 && genericWeaknesses[llmName]) {
        genericWeaknesses[llmName].forEach(w => {
            if (llm.weaknesses.length < 5 && !llm.weaknesses.includes(w)) {
                llm.weaknesses.push(w);
            }
        });
    }
    
    if (llm.bestPractices.length < 3 && genericPractices[llmName]) {
        genericPractices[llmName].forEach(p => {
            if (llm.bestPractices.length < 4 && !llm.bestPractices.includes(p)) {
                llm.bestPractices.push(p);
            }
        });
    }
}

// Render Advanced Insights Section
function renderAdvancedInsights() {
    renderCategoryHeatmap();
    renderHomeworkDifficulty();
    renderLLMEvolution();
    renderAVsBComparison();
    renderSuccessStories();
    renderCommonPitfalls();
}

// 1. Category Heatmap - shows which LLMs have which issues
function renderCategoryHeatmap() {
    const container = document.getElementById('category-heatmap');
    if (!container) return;
    
    const majorLLMs = ['ChatGPT', 'Claude', 'Gemini', 'DeepSeek', 'Grok', 'Mistral'];
    const categories = ['hallucinations', 'errors', 'explanations', 'correct solutions', 'one-shot solving', 'prompt engineering', 'confusion'];
    
    // Count category occurrences for each LLM
    const heatmapData = {};
    majorLLMs.forEach(llm => {
        heatmapData[llm] = {};
        categories.forEach(cat => {
            heatmapData[llm][cat] = 0;
        });
    });
    
    allSubmissions.forEach(sub => {
        const llmName = normalizeLLMName(sub.llm_name);
        if (majorLLMs.includes(llmName) && sub.categories) {
            sub.categories.forEach(cat => {
                if (categories.includes(cat)) {
                    heatmapData[llmName][cat]++;
                }
            });
        }
    });
    
    // Create heatmap HTML
    let html = '<div class="heatmap-container">';
    html += '<table class="heatmap-table"><thead><tr><th>LLM</th>';
    categories.forEach(cat => {
        html += `<th>${cat.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    majorLLMs.forEach(llm => {
        html += `<tr><td class="llm-name">${llm}</td>`;
        categories.forEach(cat => {
            const count = heatmapData[llm][cat];
            const maxCount = Math.max(...Object.values(heatmapData).map(d => d[cat]));
            const intensity = maxCount > 0 ? (count / maxCount) : 0;
            const color = cat === 'correct solutions' || cat === 'one-shot solving' || cat === 'explanations' 
                ? `rgba(40, 167, 69, ${intensity * 0.8})` 
                : cat === 'hallucinations' || cat === 'errors' || cat === 'confusion'
                ? `rgba(220, 53, 69, ${intensity * 0.8})`
                : `rgba(59, 126, 161, ${intensity * 0.8})`;
            html += `<td class="heatmap-cell" style="background-color: ${color}" title="${llm} - ${cat}: ${count} mentions">${count || ''}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// 2. Homework Difficulty Analysis
function renderHomeworkDifficulty() {
    const canvas = document.getElementById('homework-difficulty-chart');
    const textContainer = document.getElementById('homework-insights-text');
    if (!canvas || !textContainer) return;
    
    // Analyze homework issues
    const hwData = {};
    allSubmissions.forEach(sub => {
        if (sub.homework && sub.homework !== 'Not specified') {
            if (!hwData[sub.homework]) {
                hwData[sub.homework] = {
                    total: 0,
                    issues: 0,
                    hallucinations: 0,
                    errors: 0,
                    correct: 0,
                    oneShot: 0
                };
            }
            hwData[sub.homework].total++;
            if (sub.categories) {
                if (sub.categories.includes('hallucinations')) hwData[sub.homework].hallucinations++;
                if (sub.categories.includes('errors')) hwData[sub.homework].errors++;
                if (sub.categories.includes('correct solutions')) hwData[sub.homework].correct++;
                if (sub.categories.includes('one-shot solving')) hwData[sub.homework].oneShot++;
                hwData[sub.homework].issues += sub.categories.filter(c => 
                    ['hallucinations', 'errors', 'confusion'].includes(c)
                ).length;
            }
        }
    });
    
    // Sort by homework number
    const sortedHW = Object.keys(hwData).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numA - numB;
    }).slice(0, 12);
    
    // Create chart
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedHW,
            datasets: [
                {
                    label: 'Total Submissions',
                    data: sortedHW.map(hw => hwData[hw].total),
                    backgroundColor: 'rgba(59, 126, 161, 0.6)',
                    borderColor: 'rgba(59, 126, 161, 1)',
                    borderWidth: 2
                },
                {
                    label: 'Issues Reported',
                    data: sortedHW.map(hw => hwData[hw].issues),
                    backgroundColor: 'rgba(220, 53, 69, 0.6)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 2
                },
                {
                    label: 'One-Shot Successes',
                    data: sortedHW.map(hw => hwData[hw].oneShot),
                    backgroundColor: 'rgba(40, 167, 69, 0.6)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Count' } },
                x: { title: { display: true, text: 'Homework' } }
            }
        }
    });
    
    // Generate insights text
    const mostChallenging = sortedHW.reduce((max, hw) => 
        (hwData[hw].issues / hwData[hw].total) > (hwData[max].issues / hwData[max].total) ? hw : max
    );
    const easiest = sortedHW.reduce((min, hw) => 
        (hwData[hw].oneShot / hwData[hw].total) > (hwData[min].oneShot / hwData[min].total) ? hw : min
    );
    
    textContainer.innerHTML = `
        <div class="hw-insight-box">
            <div class="hw-insight-item">
                <i class="fas fa-trophy"></i>
                <div>
                    <strong>Most One-Shot Friendly:</strong>
                    <p>${easiest} - ${Math.round((hwData[easiest].oneShot / hwData[easiest].total) * 100)}% one-shot success rate</p>
                </div>
            </div>
            <div class="hw-insight-item">
                <i class="fas fa-mountain"></i>
                <div>
                    <strong>Most Challenging:</strong>
                    <p>${mostChallenging} - ${Math.round((hwData[mostChallenging].issues / hwData[mostChallenging].total) * 100)}% issue rate</p>
                </div>
            </div>
        </div>
    `;
}

// 3. LLM Evolution Timeline
function renderLLMEvolution() {
    const canvas = document.getElementById('llm-evolution-chart');
    if (!canvas) return;
    
    const majorLLMs = ['ChatGPT', 'Claude', 'Gemini', 'DeepSeek', 'Grok', 'Mistral'];
    
    // Group by month
    const monthlyData = {};
    allSubmissions.forEach(sub => {
        const llmName = normalizeLLMName(sub.llm_name);
        if (!majorLLMs.includes(llmName)) return;
        
        const date = new Date(sub.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {};
            majorLLMs.forEach(llm => monthlyData[monthKey][llm] = 0);
        }
        monthlyData[monthKey][llmName]++;
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    
    const colors = {
        'ChatGPT': 'rgba(16, 163, 127, 1)',
        'Gemini': 'rgba(66, 133, 244, 1)',
        'Claude': 'rgba(204, 131, 82, 1)',
        'DeepSeek': 'rgba(139, 69, 255, 1)',
        'Grok': 'rgba(255, 99, 132, 1)',
        'Mistral': 'rgba(255, 159, 64, 1)'
    };
    
    const datasets = majorLLMs.map(llm => ({
        label: llm,
        data: sortedMonths.map(month => monthlyData[month][llm]),
        borderColor: colors[llm],
        backgroundColor: colors[llm].replace('1)', '0.3)'),
        tension: 0.4,
        fill: true
    }));
    
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedMonths.map(m => {
                const [year, month] = m.split('-');
                return new Date(year, month - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
            }),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top' }
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Submissions' } },
                x: { title: { display: true, text: 'Month' } }
            }
        }
    });
}

// 4. A vs B Comparison
function renderAVsBComparison() {
    const container = document.getElementById('a-vs-b-comparison');
    if (!container) return;
    
    const majorLLMs = ['ChatGPT', 'Claude', 'Gemini', 'DeepSeek', 'Grok', 'Mistral'];
    const comparison = {};
    
    majorLLMs.forEach(llm => {
        comparison[llm] = {
            a: { total: 0, correct: 0, oneShot: 0, issues: 0 },
            b: { total: 0, correct: 0, oneShot: 0, issues: 0 }
        };
    });
    
    allSubmissions.forEach(sub => {
        const llmName = normalizeLLMName(sub.llm_name);
        if (!majorLLMs.includes(llmName)) return;
        
        const type = sub.participation_type === 'A' ? 'a' : 'b';
        comparison[llmName][type].total++;
        
        if (sub.categories) {
            if (sub.categories.includes('correct solutions')) comparison[llmName][type].correct++;
            if (sub.categories.includes('one-shot solving')) comparison[llmName][type].oneShot++;
            comparison[llmName][type].issues += sub.categories.filter(c => 
                ['hallucinations', 'errors', 'confusion'].includes(c)
            ).length;
        }
    });
    
    let html = '<div class="comparison-grid">';
    
    majorLLMs.forEach(llm => {
        const data = comparison[llm];
        const aSuccessRate = data.a.total > 0 ? Math.round((data.a.oneShot / data.a.total) * 100) : 0;
        const bSuccessRate = data.b.total > 0 ? Math.round((data.b.oneShot / data.b.total) * 100) : 0;
        const better = aSuccessRate > bSuccessRate ? 'analytical' : aSuccessRate < bSuccessRate ? 'coding' : 'balanced';
        
        html += `
            <div class="comparison-card">
                <h4>${llm}</h4>
                <div class="comparison-bars">
                    <div class="comparison-bar-row">
                        <span class="bar-label"><i class="fas fa-file-alt"></i> Analytical (A)</span>
                        <div class="bar-container">
                            <div class="bar analytical" style="width: ${Math.max(aSuccessRate, 5)}%">
                                <span class="bar-value">${aSuccessRate}%</span>
                            </div>
                        </div>
                    </div>
                    <div class="comparison-bar-row">
                        <span class="bar-label"><i class="fas fa-code"></i> Coding (B)</span>
                        <div class="bar-container">
                            <div class="bar coding" style="width: ${Math.max(bSuccessRate, 5)}%">
                                <span class="bar-value">${bSuccessRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="comparison-verdict ${better}">
                    ${better === 'analytical' ? '📊 Stronger at analytical tasks' : 
                      better === 'coding' ? '💻 Stronger at coding tasks' : 
                      '⚖️ Balanced performance'}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// 5. Success Stories
function renderSuccessStories() {
    const container = document.getElementById('success-stories');
    if (!container) return;
    
    // Find submissions with high engagement and positive categories
    const successfulSubmissions = allSubmissions
        .filter(sub => 
            sub.categories && 
            sub.categories.includes('correct solutions') &&
            sub.categories.includes('one-shot solving') &&
            sub.view_count > 100
        )
        .sort((a, b) => b.view_count - a.view_count)
        .slice(0, 5);
    
    let html = '<div class="success-stories-grid">';
    
    successfulSubmissions.forEach(sub => {
        const excerpt = sub.content.substring(0, 200).replace(/\n/g, ' ') + '...';
        html += `
            <div class="success-story-card">
                <div class="success-badge"><i class="fas fa-star"></i> Success</div>
                <h4>${escapeHtml(sub.title)}</h4>
                <div class="success-meta">
                    <span><i class="fas fa-user"></i> ${escapeHtml(sub.author_name)}</span>
                    <span><i class="fas fa-robot"></i> ${escapeHtml(sub.llm_name)}</span>
                    <span><i class="fas fa-book"></i> ${escapeHtml(sub.homework)}</span>
                </div>
                <p class="success-excerpt">${escapeHtml(excerpt)}</p>
                <div class="success-stats">
                    <span><i class="fas fa-eye"></i> ${sub.view_count} views</span>
                    <span class="success-tag">One-shot solve</span>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// 6. Common Pitfalls
function renderCommonPitfalls() {
    const container = document.getElementById('common-pitfalls');
    if (!container) return;
    
    // Analyze common issues
    const pitfalls = {
        'hallucinations': {
            count: 0,
            icon: 'fa-ghost',
            title: 'Hallucinations & Fabrications',
            solutions: [
                'Cross-verify important facts with authoritative sources',
                'Ask the model to cite sources or explain reasoning',
                'Use multiple LLMs for fact-checking critical information'
            ]
        },
        'errors': {
            count: 0,
            icon: 'fa-bug',
            title: 'Calculation & Logic Errors',
            solutions: [
                'Request step-by-step breakdowns for complex problems',
                'Ask the model to verify its own work',
                'Provide clear context and constraints'
            ]
        },
        'confusion': {
            count: 0,
            icon: 'fa-question-circle',
            title: 'Confusion & Misunderstanding',
            solutions: [
                'Use clear, unambiguous language in prompts',
                'Break complex questions into smaller parts',
                'Provide examples of desired output format'
            ]
        },
        'verbose': {
            count: 0,
            icon: 'fa-comment-dots',
            title: 'Overly Verbose Responses',
            solutions: [
                'Explicitly request concise answers',
                'Set word or paragraph limits in your prompt',
                'Ask for summaries instead of full explanations'
            ]
        }
    };
    
    // Count occurrences
    allSubmissions.forEach(sub => {
        if (sub.categories) {
            if (sub.categories.includes('hallucinations')) pitfalls['hallucinations'].count++;
            if (sub.categories.includes('errors')) pitfalls['errors'].count++;
            if (sub.categories.includes('confusion')) pitfalls['confusion'].count++;
        }
        if (sub.content && sub.content.toLowerCase().includes('verbose')) {
            pitfalls['verbose'].count++;
        }
    });
    
    // Sort by count
    const sortedPitfalls = Object.entries(pitfalls)
        .sort((a, b) => b[1].count - a[1].count)
        .filter(([_, data]) => data.count > 0);
    
    let html = '<div class="pitfalls-grid">';
    
    sortedPitfalls.forEach(([key, data]) => {
        html += `
            <div class="pitfall-card">
                <div class="pitfall-header">
                    <i class="fas ${data.icon}"></i>
                    <h4>${data.title}</h4>
                    <span class="pitfall-count">${data.count} occurrences</span>
                </div>
                <div class="pitfall-solutions">
                    <strong>How to Avoid:</strong>
                    <ul>
                        ${data.solutions.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}