class CommunityTracker {
    constructor() {
        this.posts = [];
        this.engagements = [];
        this.conversions = [];
    }
    
    trackPost(postData) {
        const post = {
            id: Date.now(),
            platform: postData.platform,
            community: postData.community,
            title: postData.title,
            contentType: postData.contentType,
            url: postData.url,
            timestamp: new Date(),
            metrics: {
                views: 0,
                upvotes: 0,
                comments: 0,
                shares: 0,
                clicks: 0
            }
        };
        
        this.posts.push(post);
        return post.id;
    }
    
    updatePostMetrics(postId, metrics) {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
            post.metrics = { ...post.metrics, ...metrics };
            post.lastUpdated = new Date();
        }
    }
    
    trackEngagement(postId, engagementData) {
        this.engagements.push({
            postId: postId,
            type: engagementData.type, // comment, dm, follow, etc.
            quality: engagementData.quality, // high, medium, low
            timestamp: new Date(),
            details: engagementData.details
        });
    }
    
    trackConversion(postId, conversionData) {
        this.conversions.push({
            postId: postId,
            type: conversionData.type, // signup, demo, trial, etc.
            value: conversionData.value,
            timestamp: new Date(),
            userInfo: conversionData.userInfo
        });
    }
    
    getPerformanceReport() {
        const totalPosts = this.posts.length;
        const totalEngagements = this.engagements.length;
        const totalConversions = this.conversions.length;
        
        const bestPerformingPosts = this.posts
            .sort((a, b) => b.metrics.upvotes - a.metrics.upvotes)
            .slice(0, 5);
            
        const communityPerformance = {};
        this.posts.forEach(post => {
            if (!communityPerformance[post.community]) {
                communityPerformance[post.community] = {
                    posts: 0,
                    totalUpvotes: 0,
                    totalComments: 0,
                    conversions: 0
                };
            }
            
            const community = communityPerformance[post.community];
            community.posts++;
            community.totalUpvotes += post.metrics.upvotes;
            community.totalComments += post.metrics.comments;
            community.conversions += this.conversions.filter(c => c.postId === post.id).length;
        });
        
        return {
            summary: {
                totalPosts,
                totalEngagements,
                totalConversions,
                conversionRate: (totalConversions / totalPosts * 100).toFixed(2) + '%'
            },
            bestPerformingPosts,
            communityPerformance
        };
    }
}
