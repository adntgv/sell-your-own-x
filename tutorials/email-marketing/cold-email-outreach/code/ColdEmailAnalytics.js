class ColdEmailAnalytics {
    constructor() {
        this.metrics = new Map();
        this.experiments = new Map();
        this.insights = new Map();
    }
    
    async generateAnalyticsDashboard(campaignId) {
        const campaign = await this.getCampaign(campaignId);
        const metrics = await this.collectAllMetrics(campaignId);
        
        return this.createDashboardHTML(campaign, metrics);
    }
    
    createDashboardHTML(campaign, metrics) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cold Email Campaign Analytics</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f7fa;
        }
        
        .dashboard {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .metric-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #2d3748;
        }
        
        .metric-value {
            font-size: 36px;
            font-weight: 700;
            color: #2b6cb0;
            margin: 10px 0;
        }
        
        .metric-change {
            font-size: 14px;
            padding: 4px 8px;
            border-radius: 4px;
        }
        
        .positive { color: #22c55e; }
        .negative { color: #ef4444; }
        .neutral { color: #6b7280; }
        
        .chart-container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        
        .engagement-funnel {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .funnel-step {
            padding: 20px;
            margin: 10px 0;
            background: #f7fafc;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .funnel-bar {
            height: 40px;
            background: #3b82f6;
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        
        .alerts {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .alert-item {
            padding: 10px 0;
            border-bottom: 1px solid #fbbf24;
        }
        
        .alert-item:last-child {
            border-bottom: none;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>${campaign.name} - Campaign Analytics</h1>
            <p>Campaign Duration: ${this.formatDuration(campaign.startedAt, campaign.completedAt || new Date())}</p>
        </div>
        
        ${this.generateAlerts(metrics)}
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Emails Sent</div>
                <div class="metric-value">${metrics.totalSent.toLocaleString()}</div>
                <div class="metric-change neutral">
                    ${metrics.sendingRate}/day average
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Open Rate</div>
                <div class="metric-value">${(metrics.openRate * 100).toFixed(1)}%</div>
                <div class="metric-change ${metrics.openRateTrend > 0 ? 'positive' : 'negative'}">
                    ${metrics.openRateTrend > 0 ? '+' : ''}${metrics.openRateTrend.toFixed(1)}% vs benchmark
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Reply Rate</div>
                <div class="metric-value">${(metrics.replyRate * 100).toFixed(1)}%</div>
                <div class="metric-change ${metrics.replyRateTrend > 0 ? 'positive' : 'negative'}">
                    ${metrics.replyRateTrend > 0 ? '+' : ''}${metrics.replyRateTrend.toFixed(1)}% vs benchmark
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Positive Reply Rate</div>
                <div class="metric-value">${(metrics.positiveReplyRate * 100).toFixed(1)}%</div>
                <div class="metric-change positive">
                    ${metrics.positiveReplies} opportunities
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Meeting Booked</div>
                <div class="metric-value">${metrics.meetingsBooked}</div>
                <div class="metric-change neutral">
                    ${(metrics.meetingRate * 100).toFixed(1)}% conversion
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Deliverability Score</div>
                <div class="metric-value">${metrics.deliverabilityScore}</div>
                <div class="metric-change ${metrics.deliverabilityScore >= 90 ? 'positive' : metrics.deliverabilityScore >= 70 ? 'neutral' : 'negative'}">
                    ${metrics.inboxPlacement}% inbox placement
                </div>
            </div>
        </div>
        
        <div class="chart-container">
            <h3>Campaign Performance Over Time</h3>
            <canvas id="performanceChart" width="400" height="200"></canvas>
        </div>
        
        <div class="engagement-funnel">
            <h3>Engagement Funnel</h3>
            ${this.generateFunnelSteps(metrics)}
        </div>
        
        <div class="chart-container">
            <h3>A/B Test Results</h3>
            <canvas id="abTestChart" width="400" height="150"></canvas>
        </div>
    </div>
    
    <script>
        // Performance chart
        const performanceCtx = document.getElementById('performanceChart').getContext('2d');
        new Chart(performanceCtx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(metrics.timeline.dates)},
                datasets: [{
                    label: 'Open Rate',
                    data: ${JSON.stringify(metrics.timeline.openRates)},
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    yAxisID: 'y-percentage'
                }, {
                    label: 'Reply Rate',
                    data: ${JSON.stringify(metrics.timeline.replyRates)},
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    yAxisID: 'y-percentage'
                }, {
                    label: 'Emails Sent',
                    data: ${JSON.stringify(metrics.timeline.emailsSent)},
                    borderColor: '#6b7280',
                    backgroundColor: 'rgba(107, 114, 128, 0.1)',
                    yAxisID: 'y-count'
                }]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    'y-percentage': {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    'y-count': {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false,
                        }
                    }
                }
            }
        });
        
        // A/B Test Chart
        const abTestCtx = document.getElementById('abTestChart').getContext('2d');
        new Chart(abTestCtx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(metrics.abTests.map(t => t.variant))},
                datasets: [{
                    label: 'Open Rate',
                    data: ${JSON.stringify(metrics.abTests.map(t => t.openRate * 100))},
                    backgroundColor: '#3b82f6'
                }, {
                    label: 'Reply Rate',
                    data: ${JSON.stringify(metrics.abTests.map(t => t.replyRate * 100))},
                    backgroundColor: '#22c55e'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;
    }
    
    generateAlerts(metrics) {
        const alerts = [];
        
        if (metrics.bounceRate > 0.05) {
            alerts.push({
                severity: 'high',
                message: `High bounce rate detected: ${(metrics.bounceRate * 100).toFixed(1)}%`
            });
        }
        
        if (metrics.spamRate > 0.001) {
            alerts.push({
                severity: 'critical',
                message: `Spam complaints detected: ${(metrics.spamRate * 100).toFixed(2)}%`
            });
        }
        
        if (metrics.deliverabilityScore < 70) {
            alerts.push({
                severity: 'high',
                message: `Low deliverability score: ${metrics.deliverabilityScore}`
            });
        }
        
        if (alerts.length === 0) return '';
        
        return `
        <div class="alerts">
            <h3>⚠️ Alerts</h3>
            ${alerts.map(alert => `
                <div class="alert-item">
                    <strong>${alert.severity.toUpperCase()}:</strong> ${alert.message}
                </div>
            `).join('')}
        </div>`;
    }
    
    generateFunnelSteps(metrics) {
        const funnel = [
            { label: 'Emails Sent', value: metrics.totalSent, percentage: 100 },
            { label: 'Emails Delivered', value: metrics.delivered, percentage: (metrics.delivered / metrics.totalSent * 100) },
            { label: 'Emails Opened', value: metrics.opened, percentage: (metrics.opened / metrics.totalSent * 100) },
            { label: 'Links Clicked', value: metrics.clicked, percentage: (metrics.clicked / metrics.totalSent * 100) },
            { label: 'Replies Received', value: metrics.replies, percentage: (metrics.replies / metrics.totalSent * 100) },
            { label: 'Positive Replies', value: metrics.positiveReplies, percentage: (metrics.positiveReplies / metrics.totalSent * 100) },
            { label: 'Meetings Booked', value: metrics.meetingsBooked, percentage: (metrics.meetingsBooked / metrics.totalSent * 100) }
        ];
        
        return funnel.map(step => `
            <div class="funnel-step">
                <div style="flex: 1;">
                    <strong>${step.label}</strong>
                    <div>${step.value.toLocaleString()} (${step.percentage.toFixed(1)}%)</div>
                </div>
                <div style="flex: 2; margin-left: 20px;">
                    <div class="funnel-bar" style="width: ${step.percentage}%;"></div>
                </div>
            </div>
        `).join('');
    }
}
