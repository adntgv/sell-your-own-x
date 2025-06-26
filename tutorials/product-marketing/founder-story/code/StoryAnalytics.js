// Custom story analytics dashboard
class StoryAnalytics {
    constructor() {
        this.metrics = {
            views: 0,
            completions: 0,
            conversions: 0,
            avgTimeOnStory: 0,
            variantPerformance: {}
        };
        
        this.initTracking();
    }
    
    initTracking() {
        // Track story views
        gtag('event', 'story_view', {
            event_category: 'engagement'
        });
        
        // Track story reading time
        this.startTime = Date.now();
        
        window.addEventListener('beforeunload', () => {
            const timeSpent = Date.now() - this.startTime;
            gtag('event', 'story_reading_time', {
                value: Math.round(timeSpent / 1000)
            });
        });
    }
    
    getDashboardData() {
        // In a real implementation, this would fetch from Google Analytics API
        return {
            storyViews: 1247,
            completionRate: 68,
            avgReadingTime: 156,
            conversionLift: 23,
            topPerformingVariant: 'mission-first'
        };
    }
}
