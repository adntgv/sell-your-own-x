/**
 * SEO Analytics Dashboard
 * Frontend JavaScript for the SEO analytics dashboard
 */

class SEODashboard {
    constructor() {
        this.charts = {};
        this.data = {};
        this.filters = {
            dateRange: '30d',
            keywordSearch: '',
            intentFilter: ''
        };
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.loadDashboardData();
        this.hideLoading();
    }
    
    setupEventListeners() {
        // Date range selector
        document.getElementById('dateRange').addEventListener('change', (e) => {
            this.filters.dateRange = e.target.value;
            this.refreshDashboard();
        });
        
        // Refresh button
        document.getElementById('refreshData').addEventListener('click', () => {
            this.refreshDashboard();
        });
        
        // Keyword search
        document.getElementById('keywordSearch').addEventListener('input', (e) => {
            this.filters.keywordSearch = e.target.value;
            this.filterKeywordsTable();
        });
        
        // Intent filter
        document.getElementById('intentFilter').addEventListener('change', (e) => {
            this.filters.intentFilter = e.target.value;
            this.filterKeywordsTable();
        });
        
        // Run audit button
        document.getElementById('runAudit').addEventListener('click', () => {
            this.runTechnicalAudit();
        });
        
        // Modal close
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('auditModal').style.display = 'none';
        });
        
        // Close modal on outside click
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('auditModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    async loadDashboardData() {
        try {
            // Load all data in parallel
            const [analyticsData, keywordsData, technicalData, contentData] = await Promise.all([
                this.fetchAnalyticsData(),
                this.fetchKeywordsData(),
                this.fetchTechnicalData(),
                this.fetchContentOpportunities()
            ]);
            
            this.data = {
                analytics: analyticsData,
                keywords: keywordsData,
                technical: technicalData,
                content: contentData
            };
            
            this.updateDashboard();
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showError('Failed to load dashboard data. Please try again.');
        }
    }
    
    async fetchAnalyticsData() {
        const response = await fetch(`/api/analytics/overview?period=${this.filters.dateRange}`);
        if (!response.ok) throw new Error('Failed to fetch analytics data');
        return response.json();
    }
    
    async fetchKeywordsData() {
        const response = await fetch(`/api/keywords/rankings?period=${this.filters.dateRange}`);
        if (!response.ok) throw new Error('Failed to fetch keywords data');
        return response.json();
    }
    
    async fetchTechnicalData() {
        const response = await fetch('/api/seo/technical-health');
        if (!response.ok) throw new Error('Failed to fetch technical data');
        return response.json();
    }
    
    async fetchContentOpportunities() {
        const response = await fetch('/api/content/opportunities');
        if (!response.ok) throw new Error('Failed to fetch content opportunities');
        return response.json();
    }
    
    updateDashboard() {
        this.updateMetricCards();
        this.updateCharts();
        this.updateKeywordsTable();
        this.updateTechnicalIssuesTable();
        this.updateContentOpportunities();
    }
    
    updateMetricCards() {
        const { analytics, keywords, technical } = this.data;
        
        // Organic traffic
        this.updateMetricCard('organic-sessions', {
            value: analytics.organicSessions?.toLocaleString() || '0',
            change: analytics.trafficChange || 0,
            changeType: analytics.trafficChange > 0 ? 'positive' : analytics.trafficChange < 0 ? 'negative' : 'neutral'
        });
        
        // Top 10 keywords
        const top10Keywords = keywords.filter(k => k.position <= 10).length;
        this.updateMetricCard('top-keywords', {
            value: top10Keywords.toString(),
            change: keywords.rankingChanges?.top10 || 0,
            changeType: keywords.rankingChanges?.top10 > 0 ? 'positive' : 'neutral'
        });
        
        // Average position
        const avgPosition = keywords.length > 0 ? 
            (keywords.reduce((sum, k) => sum + k.position, 0) / keywords.length).toFixed(1) : '0';
        this.updateMetricCard('average-position', {
            value: avgPosition,
            change: analytics.positionChange || 0,
            changeType: analytics.positionChange < 0 ? 'positive' : analytics.positionChange > 0 ? 'negative' : 'neutral'
        });
        
        // Click-through rate
        this.updateMetricCard('ctr-value', {
            value: `${(analytics.averageCTR * 100 || 0).toFixed(1)}%`,
            change: analytics.ctrChange || 0,
            changeType: analytics.ctrChange > 0 ? 'positive' : analytics.ctrChange < 0 ? 'negative' : 'neutral'
        });
        
        // Technical health
        this.updateMetricCard('health-score', {
            value: `${technical.overallScore || 0}%`,
            change: technical.overallScore >= 80 ? 'Good' : technical.overallScore >= 60 ? 'Fair' : 'Poor',
            changeType: technical.overallScore >= 80 ? 'positive' : technical.overallScore >= 60 ? 'neutral' : 'negative'
        });
        
        // Backlinks (mock data for demo)
        this.updateMetricCard('backlink-count', {
            value: '1,247',
            change: '+12',
            changeType: 'positive'
        });
    }
    
    updateMetricCard(cardId, data) {
        const card = document.getElementById(cardId);
        if (!card) return;
        
        const valueElement = card.querySelector('.metric-value');
        const changeElement = card.querySelector('.metric-change');
        
        if (valueElement) {
            valueElement.textContent = data.value;
        }
        
        if (changeElement) {
            changeElement.textContent = typeof data.change === 'number' ? 
                `${data.change > 0 ? '+' : ''}${data.change}%` : 
                data.change;
            changeElement.className = `metric-change ${data.changeType}`;
        }
    }
    
    updateCharts() {
        this.createTrafficChart();
        this.createRankingsChart();
    }
    
    createTrafficChart() {
        const ctx = document.getElementById('trafficChart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (this.charts.traffic) {
            this.charts.traffic.destroy();
        }
        
        const { analytics } = this.data;
        const labels = analytics.trends?.labels || this.generateDefaultLabels();
        const data = analytics.trends?.traffic || this.generateMockTrafficData(labels.length);
        
        this.charts.traffic = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Organic Sessions',
                    data: data,
                    borderColor: '#3182ce',
                    backgroundColor: 'rgba(49, 130, 206, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        cornerRadius: 6
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#718096'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#e2e8f0'
                        },
                        ticks: {
                            color: '#718096',
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
    
    createRankingsChart() {
        const ctx = document.getElementById('rankingsChart');
        if (!ctx) return;
        
        // Destroy existing chart
        if (this.charts.rankings) {
            this.charts.rankings.destroy();
        }
        
        const { keywords } = this.data;
        const positions = this.categorizePositions(keywords);
        
        this.charts.rankings = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Top 3', '4-10', '11-20', '21+'],
                datasets: [{
                    data: [
                        positions.top3,
                        positions.top10,
                        positions.top20,
                        positions.beyond20
                    ],
                    backgroundColor: [
                        '#22543d',
                        '#2c5282',
                        '#c05621',
                        '#742a2a'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            color: '#4a5568'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    categorizePositions(keywords) {
        return keywords.reduce((acc, keyword) => {
            if (keyword.position <= 3) acc.top3++;
            else if (keyword.position <= 10) acc.top10++;
            else if (keyword.position <= 20) acc.top20++;
            else acc.beyond20++;
            return acc;
        }, { top3: 0, top10: 0, top20: 0, beyond20: 0 });
    }
    
    updateKeywordsTable() {
        const tbody = document.querySelector('#keywordsTable tbody');
        if (!tbody) return;
        
        const { keywords } = this.data;
        tbody.innerHTML = '';
        
        keywords.slice(0, 50).forEach(keyword => {
            const row = this.createKeywordRow(keyword);
            tbody.appendChild(row);
        });
    }
    
    createKeywordRow(keyword) {
        const row = document.createElement('tr');
        
        const change = keyword.positionChange || 0;
        const changeText = change === 0 ? '-' : change > 0 ? `+${change}` : change.toString();
        const changeClass = change > 0 ? 'negative' : change < 0 ? 'positive' : 'neutral';
        
        row.innerHTML = `
            <td><strong>${keyword.keyword}</strong></td>
            <td><span class="position-badge ${this.getPositionClass(keyword.position)}">${keyword.position}</span></td>
            <td><span class="metric-change ${changeClass}">${changeText}</span></td>
            <td>${keyword.searchVolume?.toLocaleString() || '-'}</td>
            <td>${keyword.clicks?.toLocaleString() || '0'}</td>
            <td>${keyword.impressions?.toLocaleString() || '0'}</td>
            <td>${keyword.ctr ? (keyword.ctr * 100).toFixed(1) + '%' : '0%'}</td>
            <td><span class="intent-badge intent-${keyword.intent || 'informational'}">${keyword.intent || 'informational'}</span></td>
        `;
        
        return row;
    }
    
    getPositionClass(position) {
        if (position <= 3) return 'position-1-3';
        if (position <= 10) return 'position-4-10';
        if (position <= 20) return 'position-11-20';
        return 'position-21-plus';
    }
    
    updateTechnicalIssuesTable() {
        const tbody = document.querySelector('#issuesTable tbody');
        if (!tbody) return;
        
        const { technical } = this.data;
        tbody.innerHTML = '';
        
        if (technical.issues && technical.issues.length > 0) {
            technical.issues.forEach(issue => {
                const row = this.createIssueRow(issue);
                tbody.appendChild(row);
            });
        } else {
            // Show sample issues for demo
            const sampleIssues = [
                { type: 'Core Web Vitals', severity: 'high', count: 3, impact: 'User Experience', action: 'Optimize images' },
                { type: 'Missing Meta Descriptions', severity: 'medium', count: 12, impact: 'CTR', action: 'Add descriptions' },
                { type: 'Broken Internal Links', severity: 'low', count: 2, impact: 'Crawling', action: 'Fix links' }
            ];
            
            sampleIssues.forEach(issue => {
                const row = this.createIssueRow(issue);
                tbody.appendChild(row);
            });
        }
    }
    
    createIssueRow(issue) {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${issue.type}</td>
            <td><span class="severity-${issue.severity}">${issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}</span></td>
            <td>${issue.count}</td>
            <td>${issue.impact}</td>
            <td><button class="btn btn-secondary btn-sm">${issue.action}</button></td>
        `;
        
        return row;
    }
    
    updateContentOpportunities() {
        const container = document.getElementById('contentOpportunities');
        if (!container) return;
        
        const { content } = this.data;
        container.innerHTML = '';
        
        if (content.opportunities && content.opportunities.length > 0) {
            content.opportunities.forEach(opportunity => {
                const card = this.createOpportunityCard(opportunity);
                container.appendChild(card);
            });
        } else {
            // Show sample opportunities for demo
            const sampleOpportunities = [
                {
                    title: 'SEO Audit Checklist',
                    description: 'High-volume keyword with low competition. Create comprehensive guide.',
                    volume: 8900,
                    difficulty: 25,
                    intent: 'informational'
                },
                {
                    title: 'Technical SEO Tools',
                    description: 'Comparison content opportunity with commercial intent.',
                    volume: 5200,
                    difficulty: 35,
                    intent: 'commercial'
                },
                {
                    title: 'SEO Analytics Dashboard',
                    description: 'Tutorial content targeting developers and marketers.',
                    volume: 3100,
                    difficulty: 28,
                    intent: 'informational'
                }
            ];
            
            sampleOpportunities.forEach(opportunity => {
                const card = this.createOpportunityCard(opportunity);
                container.appendChild(card);
            });
        }
    }
    
    createOpportunityCard(opportunity) {
        const card = document.createElement('div');
        card.className = 'opportunity-card';
        
        card.innerHTML = `
            <h4>${opportunity.title}</h4>
            <p>${opportunity.description}</p>
            <div class="opportunity-meta">
                <span>Volume: ${opportunity.volume?.toLocaleString() || 'N/A'}</span>
                <span>Difficulty: ${opportunity.difficulty || 'N/A'}</span>
                <span class="intent-badge intent-${opportunity.intent || 'informational'}">${opportunity.intent || 'informational'}</span>
            </div>
        `;
        
        return card;
    }
    
    filterKeywordsTable() {
        const rows = document.querySelectorAll('#keywordsTable tbody tr');
        const searchTerm = this.filters.keywordSearch.toLowerCase();
        const intentFilter = this.filters.intentFilter;
        
        rows.forEach(row => {
            const keyword = row.querySelector('td:first-child').textContent.toLowerCase();
            const intent = row.querySelector('.intent-badge').textContent;
            
            const matchesSearch = !searchTerm || keyword.includes(searchTerm);
            const matchesIntent = !intentFilter || intent === intentFilter;
            
            row.style.display = matchesSearch && matchesIntent ? '' : 'none';
        });
    }
    
    async runTechnicalAudit() {
        const button = document.getElementById('runAudit');
        const originalText = button.textContent;
        
        button.textContent = 'Running Audit...';
        button.disabled = true;
        
        try {
            const response = await fetch('/api/seo/audit', { method: 'POST' });
            const results = await response.json();
            
            this.showAuditResults(results);
        } catch (error) {
            console.error('Audit failed:', error);
            this.showError('Technical audit failed. Please try again.');
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }
    
    showAuditResults(results) {
        const modal = document.getElementById('auditModal');
        const resultsContainer = document.getElementById('auditResults');
        
        resultsContainer.innerHTML = `
            <div class="audit-summary">
                <h3>Audit Summary</h3>
                <div class="audit-score">
                    <div class="score-circle">
                        <span class="score-value">${results.overallScore || 75}</span>
                        <span class="score-label">Overall Score</span>
                    </div>
                </div>
            </div>
            
            <div class="audit-details">
                <h4>Issues Found</h4>
                <ul>
                    ${(results.issues || []).map(issue => `
                        <li class="audit-issue severity-${issue.severity}">
                            <strong>${issue.type}:</strong> ${issue.description}
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            <div class="audit-recommendations">
                <h4>Recommendations</h4>
                <ul>
                    ${(results.recommendations || []).map(rec => `
                        <li class="audit-recommendation">
                            <strong>${rec.priority}:</strong> ${rec.message}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
        
        modal.style.display = 'block';
    }
    
    async refreshDashboard() {
        this.showLoading();
        await this.loadDashboardData();
        this.hideLoading();
    }
    
    showLoading() {
        document.getElementById('loading').style.display = 'flex';
        document.getElementById('dashboard-content').style.display = 'none';
    }
    
    hideLoading() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('dashboard-content').style.display = 'block';
    }
    
    showError(message) {
        // Simple error display - in production, use a proper notification system
        alert(message);
    }
    
    generateDefaultLabels() {
        const labels = [];
        const days = this.filters.dateRange === '7d' ? 7 : this.filters.dateRange === '30d' ? 30 : 90;
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        
        return labels;
    }
    
    generateMockTrafficData(length) {
        const data = [];
        let baseValue = 1000;
        
        for (let i = 0; i < length; i++) {
            baseValue += Math.random() * 200 - 100; // Random walk
            data.push(Math.max(0, Math.round(baseValue)));
        }
        
        return data;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SEODashboard();
});