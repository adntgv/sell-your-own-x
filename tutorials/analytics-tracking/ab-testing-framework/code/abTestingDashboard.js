// Real-time A/B testing dashboard
class ABTestingDashboard {
    constructor() {
        this.websocket = null;
        this.charts = {};
        this.currentTest = null;
        this.updateInterval = null;
    }
    
    async initialize(testId) {
        this.currentTest = await this.fetchTest(testId);
        
        // Set up WebSocket for real-time updates
        this.connectWebSocket();
        
        // Initial render
        await this.render();
        
        // Set up periodic updates
        this.startUpdates();
    }
    
    async render() {
        const results = await this.fetchResults(this.currentTest.id);
        
        document.getElementById('dashboard').innerHTML = this.generateDashboardHTML(results);
        
        // Initialize charts
        this.initializeCharts(results);
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    generateDashboardHTML(results) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${results.test.name} - A/B Test Results</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f7fa;
            color: #2d3748;
        }
        
        .dashboard {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .test-status {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-left: 15px;
        }
        
        .status-running { 
            background: #bee3f8; 
            color: #2c5282;
        }
        
        .status-completed { 
            background: #c6f6d5; 
            color: #22543d;
        }
        
        .results-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .variant-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            position: relative;
        }
        
        .variant-card.winner {
            border: 2px solid #22c55e;
        }
        
        .variant-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            text-transform: capitalize;
        }
        
        .metric-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .metric-label {
            color: #718096;
            font-size: 14px;
        }
        
        .metric-value {
            font-size: 18px;
            font-weight: 600;
        }
        
        .conversion-rate {
            font-size: 32px;
            font-weight: 700;
            color: #2d3748;
            margin: 20px 0;
            text-align: center;
        }
        
        .improvement {
            text-align: center;
            padding: 10px;
            background: #f0fdf4;
            border-radius: 8px;
            color: #22543d;
            font-weight: 600;
        }
        
        .confidence-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 8px;
        }
        
        .high-confidence { 
            background: #c6f6d5; 
            color: #22543d;
        }
        
        .medium-confidence { 
            background: #fef5e7; 
            color: #c05621;
        }
        
        .low-confidence { 
            background: #fed7d7; 
            color: #742a2a;
        }
        
        .charts-section {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .chart-container {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .insights-section {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .insight-item {
            padding: 15px;
            margin-bottom: 10px;
            border-left: 4px solid #3b82f6;
            background: #eff6ff;
            border-radius: 4px;
        }
        
        .insight-high {
            border-left-color: #22c55e;
            background: #f0fdf4;
        }
        
        .insight-medium {
            border-left-color: #f59e0b;
            background: #fffbeb;
        }
        
        .real-time-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            background: #22c55e;
            border-radius: 50%;
            margin-right: 8px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .sample-size-progress {
            margin-top: 20px;
        }
        
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: #3b82f6;
            transition: width 0.3s ease;
        }
        
        .progress-label {
            text-align: center;
            margin-top: 5px;
            font-size: 12px;
            color: #718096;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>${results.test.name}
                <span class="test-status status-${results.test.status}">${results.test.status}</span>
            </h1>
            <p>${results.test.description}</p>
            <p><strong>Hypothesis:</strong> ${results.test.hypothesis}</p>
            <p>
                <span class="real-time-indicator"></span>
                Real-time data • Last updated: ${new Date().toLocaleTimeString()}
            </p>
        </div>
        
        <div class="results-grid">
            ${this.generateVariantCards(results)}
        </div>
        
        <div class="charts-section">
            <div class="chart-container">
                <h3>Conversion Rate Over Time</h3>
                <canvas id="conversionChart" width="400" height="200"></canvas>
            </div>
            
            <div class="chart-container">
                <h3>Statistical Confidence</h3>
                <canvas id="confidenceChart" width="200" height="200"></canvas>
                ${this.generateBayesianStats(results)}
            </div>
        </div>
        
        <div class="chart-container">
            <h3>Sample Size Progress</h3>
            ${this.generateSampleSizeProgress(results)}
        </div>
        
        <div class="insights-section">
            <h3>Insights & Recommendations</h3>
            ${this.generateInsights(results)}
        </div>
        
        ${this.generateSegmentAnalysis(results)}
    </div>
    
    <script>
        // Initialize dashboard interactions
        ${this.generateDashboardScript(results)}
    </script>
</body>
</html>`;
    }
    
    generateVariantCards(results) {
        const cards = [];
        
        // Control card
        cards.push(this.generateVariantCard(results.results.control, null, results));
        
        // Variant cards
        results.results.variants.forEach(variant => {
            const stats = results.statistics[variant.name];
            cards.push(this.generateVariantCard(variant, stats, results));
        });
        
        return cards.join('');
    }
    
    generateVariantCard(variant, stats, results) {
        const conversionRate = variant.visitors > 0 ? 
            (variant.conversions / variant.visitors * 100).toFixed(2) : 0;
        
        const isWinner = stats && stats.isSignificant && stats.relativeImprovement > 0;
        const cardClass = isWinner ? 'variant-card winner' : 'variant-card';
        
        return `
        <div class="${cardClass}">
            ${isWinner ? '<div class="winner-badge">🏆 Winner</div>' : ''}
            <div class="variant-name">${variant.name}</div>
            
            <div class="conversion-rate">${conversionRate}%</div>
            
            ${stats ? `
                <div class="improvement">
                    ${stats.relativeImprovement > 0 ? '+' : ''}${stats.relativeImprovement.toFixed(1)}% vs control
                    <span class="confidence-badge ${this.getConfidenceClass(stats)}">
                        ${(stats.bayesian.probabilityToWin * 100).toFixed(0)}% confidence
                    </span>
                </div>
            ` : ''}
            
            <div class="metric-row">
                <span class="metric-label">Visitors</span>
                <span class="metric-value">${variant.visitors.toLocaleString()}</span>
            </div>
            
            <div class="metric-row">
                <span class="metric-label">Conversions</span>
                <span class="metric-value">${variant.conversions.toLocaleString()}</span>
            </div>
            
            ${variant.revenue > 0 ? `
                <div class="metric-row">
                    <span class="metric-label">Revenue</span>
                    <span class="metric-value">$${variant.revenue.toFixed(2)}</span>
                </div>
                
                <div class="metric-row">
                    <span class="metric-label">Revenue/Visitor</span>
                    <span class="metric-value">$${(variant.revenue / variant.visitors).toFixed(2)}</span>
                </div>
            ` : ''}
        </div>`;
    }
    
    getConfidenceClass(stats) {
        const confidence = stats.bayesian.probabilityToWin;
        if (confidence >= 0.95) return 'high-confidence';
        if (confidence >= 0.80) return 'medium-confidence';
        return 'low-confidence';
    }
    
    generateSampleSizeProgress(results) {
        const current = results.results.control.visitors + 
            results.results.variants.reduce((sum, v) => sum + v.visitors, 0);
        const required = results.test.sampleSize.total;
        const percentage = Math.min((current / required * 100), 100);
        
        return `
        <div class="sample-size-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="progress-label">
                ${current.toLocaleString()} / ${required.toLocaleString()} visitors
                (${percentage.toFixed(1)}% complete)
            </div>
        </div>`;
    }
    
    generateInsights(results) {
        if (!results.insights || results.insights.length === 0) {
            return '<p>No insights available yet. Continue collecting data.</p>';
        }
        
        return results.insights.map(insight => `
            <div class="insight-item insight-${insight.severity}">
                <strong>${insight.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>
                <p>${insight.message}</p>
            </div>
        `).join('');
    }
}
