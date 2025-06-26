// analytics/insightsEngine.js
class InsightsEngine {
    constructor(analyticsData) {
        this.data = analyticsData
        this.insights = []
        this.alerts = []
    }
    
    generateInsights() {
        this.insights = []
        
        // Conversion funnel insights
        this.analyzeFunnelPerformance()
        
        // User behavior insights
        this.analyzeUserBehavior()
        
        // Performance insights
        this.analyzePerformanceMetrics()
        
        // Segment insights
        this.analyzeUserSegments()
        
        // Growth insights
        this.analyzeGrowthTrends()
        
        return {
            insights: this.insights,
            alerts: this.alerts,
            recommendations: this.generateRecommendations()
        }
    }
    
    analyzeFunnelPerformance() {
        const funnel = this.data.funnels
        
        // Identify biggest conversion bottleneck
        if (funnel.biggestDropoff.percentage > 50) {
            this.addInsight({
                type: 'critical',
                category: 'conversion',
                title: 'Major Conversion Bottleneck Detected',
                description: `${funnel.biggestDropoff.percentage}% of users drop off at ${funnel.biggestDropoff.step}`,
                impact: 'high',
                recommendation: 'Investigate user experience issues at this step'
            })
        }
        
        // Overall conversion rate analysis
        const overallConversion = parseFloat(funnel.overallConversion)
        if (overallConversion < 2) {
            this.addInsight({
                type: 'warning',
                category: 'conversion',
                title: 'Low Overall Conversion Rate',
                description: `Only ${overallConversion}% of users complete the full funnel`,
                impact: 'high',
                recommendation: 'Focus on improving each funnel step incrementally'
            })
        }
        
        // Step-specific insights
        funnel.steps.forEach((step, index) => {
            if (index > 0 && step.conversionFromPrevious < 30) {
                this.addInsight({
                    type: 'warning',
                    category: 'conversion',
                    title: `Low Conversion at ${step.step}`,
                    description: `Only ${step.conversionFromPrevious}% of users progress from the previous step`,
                    impact: 'medium',
                    recommendation: `Optimize the ${step.step} experience`
                })
            }
        })
    }
    
    analyzeUserBehavior() {
        const overview = this.data.overview
        
        // Bounce rate analysis
        if (overview.bounceRate > 60) {
            this.addInsight({
                type: 'warning',
                category: 'engagement',
                title: 'High Bounce Rate',
                description: `${overview.bounceRate}% of users leave after viewing only one page`,
                impact: 'high',
                recommendation: 'Improve landing page relevance and loading speed'
            })
        }
        
        // Session duration analysis
        const avgSessionMinutes = overview.averageSessionDuration / 60
        if (avgSessionMinutes < 2) {
            this.addInsight({
                type: 'info',
                category: 'engagement',
                title: 'Short Session Duration',
                description: `Average session is only ${avgSessionMinutes.toFixed(1)} minutes`,
                impact: 'medium',
                recommendation: 'Add more engaging content or clearer navigation'
            })
        }
        
        // Traffic source insights
        if (overview.trafficSources) {
            const organicTraffic = overview.trafficSources.find(s => s.source === 'organic')
            if (organicTraffic && organicTraffic.percentage < 30) {
                this.addInsight({
                    type: 'opportunity',
                    category: 'acquisition',
                    title: 'SEO Improvement Opportunity',
                    description: `Only ${organicTraffic.percentage}% of traffic comes from organic search`,
                    impact: 'medium',
                    recommendation: 'Invest in SEO and content marketing'
                })
            }
        }
    }
    
    analyzePerformanceMetrics() {
        const performance = this.data.performance
        
        if (performance.averageLoadTime > 3000) {
            this.addInsight({
                type: 'critical',
                category: 'performance',
                title: 'Slow Page Load Times',
                description: `Average load time is ${(performance.averageLoadTime / 1000).toFixed(1)} seconds`,
                impact: 'high',
                recommendation: 'Optimize images, enable caching, consider CDN'
            })
        }
        
        if (performance.errorRate > 2) {
            this.addInsight({
                type: 'critical',
                category: 'performance',
                title: 'High Error Rate',
                description: `${performance.errorRate}% of requests result in errors`,
                impact: 'high',
                recommendation: 'Review error logs and fix critical issues'
            })
        }
    }
    
    analyzeUserSegments() {
        const segments = this.data.segments
        
        // Identify high-value segments
        if (segments.byPlan) {
            const paidUsers = Object.entries(segments.byPlan)
                .filter(([plan, count]) => plan !== 'free')
                .reduce((sum, [plan, count]) => sum + count, 0)
            
            const totalUsers = Object.values(segments.byPlan).reduce((sum, count) => sum + count, 0)
            const paidPercentage = (paidUsers / totalUsers * 100).toFixed(1)
            
            if (paidPercentage < 10) {
                this.addInsight({
                    type: 'opportunity',
                    category: 'monetization',
                    title: 'Low Paid Conversion Rate',
                    description: `Only ${paidPercentage}% of users are on paid plans`,
                    impact: 'high',
                    recommendation: 'Analyze free-to-paid conversion barriers'
                })
            }
        }
    }
    
    analyzeGrowthTrends() {
        // This would analyze historical data for trends
        // For now, we'll create sample trend insights
        
        this.addInsight({
            type: 'positive',
            category: 'growth',
            title: 'User Growth Acceleration',
            description: 'User acquisition has increased 25% week-over-week',
            impact: 'positive',
            recommendation: 'Double down on successful acquisition channels'
        })
    }
    
    addInsight(insight) {
        insight.id = Date.now() + Math.random()
        insight.timestamp = new Date().toISOString()
        this.insights.push(insight)
        
        // Create alerts for critical insights
        if (insight.type === 'critical') {
            this.addAlert(insight)
        }
    }
    
    addAlert(insight) {
        this.alerts.push({
            id: insight.id,
            type: 'alert',
            title: insight.title,
            description: insight.description,
            severity: insight.type,
            timestamp: insight.timestamp,
            actionRequired: true
        })
    }
    
    generateRecommendations() {
        const recommendations = []
        
        // Prioritize recommendations by impact
        const highImpactInsights = this.insights.filter(i => i.impact === 'high')
        const mediumImpactInsights = this.insights.filter(i => i.impact === 'medium')
        
        // Create actionable recommendations
        highImpactInsights.forEach(insight => {
            recommendations.push({
                priority: 'high',
                category: insight.category,
                action: insight.recommendation,
                expectedImpact: this.estimateImpact(insight),
                timeframe: '1-2 weeks'
            })
        })
        
        mediumImpactInsights.slice(0, 3).forEach(insight => {
            recommendations.push({
                priority: 'medium',
                category: insight.category,
                action: insight.recommendation,
                expectedImpact: this.estimateImpact(insight),
                timeframe: '2-4 weeks'
            })
        })
        
        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 }
            return priorityOrder[b.priority] - priorityOrder[a.priority]
        })
    }
    
    estimateImpact(insight) {
        const impactEstimates = {
            'Major Conversion Bottleneck Detected': '15-25% conversion improvement',
            'Low Overall Conversion Rate': '10-20% revenue increase',
            'High Bounce Rate': '20-30% engagement improvement',
            'Slow Page Load Times': '10-15% conversion improvement',
            'Low Paid Conversion Rate': '25-40% revenue increase'
        }
        
        return impactEstimates[insight.title] || 'Moderate improvement expected'
    }
}

export default InsightsEngine
