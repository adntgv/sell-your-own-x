class CommunityMonitor {
    constructor() {
        this.keywords = [];
        this.mentions = [];
    }
    
    addKeywords(keywords) {
        this.keywords = [...this.keywords, ...keywords];
    }
    
    // Monitor for mentions across platforms
    async monitorMentions() {
        const platforms = ["reddit", "twitter", "hackernews", "indiehackers"];
        
        for (const platform of platforms) {
            const mentions = await this.searchPlatform(platform, this.keywords);
            
            mentions.forEach(mention => {
                if (this.isEngagementOpportunity(mention)) {
                    this.mentions.push({
                        platform: platform,
                        content: mention.content,
                        author: mention.author,
                        url: mention.url,
                        sentiment: this.analyzeSentiment(mention.content),
                        opportunity: this.getEngagementOpportunity(mention),
                        timestamp: new Date()
                    });
                }
            });
        }
        
        return this.mentions;
    }
    
    isEngagementOpportunity(mention) {
        // Filter for genuine engagement opportunities
        const indicators = [
            mention.content.includes("looking for"),
            mention.content.includes("recommendations"),
            mention.content.includes("help with"),
            mention.content.includes("struggling with"),
            mention.content.includes("what tools")
        ];
        
        return indicators.some(indicator => indicator === true);
    }
    
    getEngagementOpportunity(mention) {
        if (mention.content.includes("tool") || mention.content.includes("software")) {
            return "tool_recommendation";
        } else if (mention.content.includes("advice") || mention.content.includes("help")) {
            return "provide_advice";
        } else if (mention.content.includes("story") || mention.content.includes("experience")) {
            return "share_experience";
        } else {
            return "general_engagement";
        }
    }
}
