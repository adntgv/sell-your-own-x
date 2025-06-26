// server/analytics-api.js
const express = require('express')
const { PostHog } = require('posthog-node')
const router = express.Router()

const client = new PostHog(
    process.env.POSTHOG_API_KEY,
    { host: 'https://app.posthog.com' }
)

class AnalyticsDashboard {
    constructor() {
        this.client = client
    }
    
    // Get comprehensive dashboard data
    async getDashboardData(timeRange = '7d') {
        try {
            const [
                overviewMetrics,
                funnelData,
                userSegments,
                retentionData,
                performanceMetrics
            ] = await Promise.all([
                this.getOverviewMetrics(timeRange),
                this.getFunnelAnalysis(timeRange),
                this.getUserSegments(timeRange),
                this.getRetentionAnalysis(timeRange),
                this.getPerformanceMetrics(timeRange)
            ])
            
            return {
                overview: overviewMetrics,
                funnels: funnelData,
                segments: userSegments,
                retention: retentionData,
                performance: performanceMetrics,
                lastUpdated: new Date().toISOString()
            }
        } catch (error) {
            console.error('Dashboard data error:', error)
            throw error
        }
    }
    
    async getOverviewMetrics(timeRange) {
        // This would use PostHog's query API in a real implementation
        // For now, we'll simulate the data structure
        
        return {
            totalUsers: await this.queryPostHog('unique_users', timeRange),
            totalSessions: await this.queryPostHog('total_sessions', timeRange),
            averageSessionDuration: await this.queryPostHog('avg_session_duration', timeRange),
            bounceRate: await this.queryPostHog('bounce_rate', timeRange),
            conversionRate: await this.queryPostHog('conversion_rate', timeRange),
            topPages: await this.queryPostHog('top_pages', timeRange),
            trafficSources: await this.queryPostHog('traffic_sources', timeRange)
        }
    }
    
    async getFunnelAnalysis(timeRange) {
        const funnelSteps = [
            'landing_page_view',
            'feature_exploration', 
            'signup_form_view',
            'signup_complete',
            'onboarding_start',
            'first_action_complete'
        ]
        
        const funnelData = []
        
        for (let i = 0; i < funnelSteps.length; i++) {
            const step = funnelSteps[i]
            const count = await this.queryPostHog(`count_event_${step}`, timeRange)
            const conversionFromPrevious = i > 0 ? 
                (count / funnelData[i-1].count * 100).toFixed(1) : 100
            
            funnelData.push({
                step: step,
                stepNumber: i + 1,
                count: count,
                conversionFromPrevious: parseFloat(conversionFromPrevious),
                dropoffFromPrevious: i > 0 ? 
                    (100 - parseFloat(conversionFromPrevious)).toFixed(1) : 0
            })
        }
        
        return {
            steps: funnelData,
            overallConversion: funnelData.length > 0 ? 
                (funnelData[funnelData.length - 1].count / funnelData[0].count * 100).toFixed(1) : 0,
            biggestDropoff: this.findBiggestDropoff(funnelData)
        }
    }
    
    async getUserSegments(timeRange) {
        // Segment users by behavior and characteristics
        return {
            byPlan: await this.queryPostHog('users_by_plan', timeRange),
            byEngagement: await this.queryPostHog('users_by_engagement', timeRange),
            bySource: await this.queryPostHog('users_by_source', timeRange),
            byFeatureUsage: await this.queryPostHog('users_by_feature_usage', timeRange)
        }
    }
    
    async getRetentionAnalysis(timeRange) {
        // Cohort analysis for user retention
        return {
            weeklyRetention: await this.queryPostHog('weekly_retention', timeRange),
            monthlyRetention: await this.queryPostHog('monthly_retention', timeRange),
            featureRetention: await this.queryPostHog('feature_retention', timeRange)
        }
    }
    
    async getPerformanceMetrics(timeRange) {
        return {
            averageLoadTime: await this.queryPostHog('avg_load_time', timeRange),
            errorRate: await this.queryPostHog('error_rate', timeRange),
            slowestPages: await this.queryPostHog('slowest_pages', timeRange),
            errorsByType: await this.queryPostHog('errors_by_type', timeRange)
        }
    }
    
    // Simulated PostHog query method
    // In a real implementation, this would use PostHog's query API
    async queryPostHog(queryType, timeRange) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Return simulated data based on query type
        const simulatedData = {
            unique_users: 1247,
            total_sessions: 3891,
            avg_session_duration: 342, // seconds
            bounce_rate: 23.4, // percentage
            conversion_rate: 3.2, // percentage
            top_pages: [
                { page: '/dashboard', views: 1247, bounce_rate: 12.3 },
                { page: '/features', views: 891, bounce_rate: 34.2 },
                { page: '/pricing', views: 567, bounce_rate: 45.1 }
            ],
            traffic_sources: [
                { source: 'organic', users: 567, percentage: 45.5 },
                { source: 'direct', users: 312, percentage: 25.0 },
                { source: 'social', users: 234, percentage: 18.8 },
                { source: 'email', users: 134, percentage: 10.7 }
            ],
            // Add more simulated data as needed
            count_event_landing_page_view: 1000,
            count_event_feature_exploration: 650,
            count_event_signup_form_view: 420,
            count_event_signup_complete: 320,
            count_event_onboarding_start: 280,
            count_event_first_action_complete: 210
        }
        
        return simulatedData[queryType] || 0
    }
    
    findBiggestDropoff(funnelData) {
        let biggestDropoff = { step: '', percentage: 0 }
        
        for (let i = 1; i < funnelData.length; i++) {
            const dropoff = parseFloat(funnelData[i].dropoffFromPrevious)
            if (dropoff > biggestDropoff.percentage) {
                biggestDropoff = {
                    step: `${funnelData[i-1].step} → ${funnelData[i].step}`,
                    percentage: dropoff
                }
            }
        }
        
        return biggestDropoff
    }
}

// API Routes
const analytics = new AnalyticsDashboard()

router.get('/dashboard', async (req, res) => {
    try {
        const timeRange = req.query.timeRange || '7d'
        const data = await analytics.getDashboardData(timeRange)
        res.json(data)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard data' })
    }
})

router.get('/funnel/:funnelName', async (req, res) => {
    try {
        const funnelData = await analytics.getFunnelAnalysis(req.query.timeRange)
        res.json(funnelData)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch funnel data' })
    }
})

router.get('/insights', async (req, res) => {
    try {
        const insights = await analytics.generateInsights(req.query.timeRange)
        res.json(insights)
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate insights' })
    }
})

module.exports = router
