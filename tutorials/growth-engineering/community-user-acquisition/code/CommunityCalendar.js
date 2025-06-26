class CommunityCalendar {
    constructor() {
        this.communities = [
            {
                name: "r/entrepreneur",
                platform: "reddit",
                postFrequency: 2, // posts per week
                bestDays: ["tuesday", "wednesday", "thursday"],
                bestTimes: ["09:00", "14:00"],
                rules: "no direct promotion, value-first only"
            },
            {
                name: "Indie Hackers",
                platform: "indie_hackers", 
                postFrequency: 3,
                bestDays: ["monday", "wednesday", "friday"],
                bestTimes: ["10:00", "15:00", "19:00"],
                rules: "transparency and milestones welcome"
            }
        ];
        
        this.contentPillars = [
            { type: "educational", percentage: 40 },
            { type: "transparency", percentage: 30 },
            { type: "resources", percentage: 20 },
            { type: "product_mention", percentage: 10 }
        ];
    }
    
    generateWeeklyPlan() {
        const plan = {};
        
        this.communities.forEach(community => {
            plan[community.name] = [];
            
            for (let i = 0; i < community.postFrequency; i++) {
                const contentType = this.selectContentType();
                const day = community.bestDays[i % community.bestDays.length];
                const time = community.bestTimes[i % community.bestTimes.length];
                
                plan[community.name].push({
                    day: day,
                    time: time,
                    contentType: contentType,
                    title: this.generateTitle(contentType),
                    status: "planned"
                });
            }
        });
        
        return plan;
    }
    
    selectContentType() {
        const random = Math.random() * 100;
        let cumulative = 0;
        
        for (const pillar of this.contentPillars) {
            cumulative += pillar.percentage;
            if (random <= cumulative) {
                return pillar.type;
            }
        }
        return "educational"; // fallback
    }
    
    generateTitle(contentType) {
        const templates = {
            educational: [
                "How to [solve problem] in [timeframe]",
                "[Number] lessons learned from [experience]",
                "The [adjective] guide to [topic]"
            ],
            transparency: [
                "Month [X] revenue report: $[amount] and lessons learned",
                "I spent $[amount] on [experiment] - here's what happened",
                "[Number] mistakes that cost me [amount/time]"
            ],
            resources: [
                "My exact [tool/process] template ([metric] success rate)",
                "[Number] free tools for [use case]",
                "The [tool] stack that got me to [milestone]"
            ],
            product_mention: [
                "Ask: What tools do you use for [category]?",
                "Show: How I built [feature] to solve [problem]",
                "Compare: [Your product] vs [competitor] - honest review"
            ]
        };
        
        const typeTemplates = templates[contentType];
        return typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
    }
}
