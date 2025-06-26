class CommunityRelationships {
    constructor() {
        this.connections = [];
        this.interactions = [];
    }
    
    addConnection(connectionData) {
        const connection = {
            id: Date.now(),
            name: connectionData.name,
            platform: connectionData.platform,
            username: connectionData.username,
            community: connectionData.community,
            role: connectionData.role, // member, moderator, influencer
            interests: connectionData.interests,
            lastInteraction: new Date(),
            relationshipStage: "new", // new, engaged, warm, advocate
            notes: connectionData.notes || "",
            value: connectionData.value || 1 // 1-5 scale
        };
        
        this.connections.push(connection);
        return connection.id;
    }
    
    logInteraction(connectionId, interactionData) {
        const interaction = {
            connectionId: connectionId,
            type: interactionData.type, // comment, dm, mention, collaboration
            direction: interactionData.direction, // outbound, inbound
            content: interactionData.content,
            outcome: interactionData.outcome, // positive, neutral, negative
            timestamp: new Date()
        };
        
        this.interactions.push(interaction);
        
        // Update connection last interaction
        const connection = this.connections.find(c => c.id === connectionId);
        if (connection) {
            connection.lastInteraction = new Date();
            
            // Auto-update relationship stage based on interactions
            this.updateRelationshipStage(connectionId);
        }
    }
    
    updateRelationshipStage(connectionId) {
        const connection = this.connections.find(c => c.id === connectionId);
        const connectionInteractions = this.interactions.filter(i => i.connectionId === connectionId);
        
        if (!connection || connectionInteractions.length === 0) return;
        
        const positiveInteractions = connectionInteractions.filter(i => i.outcome === "positive").length;
        const recentInteractions = connectionInteractions.filter(i => {
            const daysAgo = (Date.now() - i.timestamp) / (1000 * 60 * 60 * 24);
            return daysAgo <= 30;
        }).length;
        
        if (positiveInteractions >= 5 && recentInteractions >= 3) {
            connection.relationshipStage = "advocate";
        } else if (positiveInteractions >= 3 && recentInteractions >= 2) {
            connection.relationshipStage = "warm";
        } else if (positiveInteractions >= 1 || recentInteractions >= 1) {
            connection.relationshipStage = "engaged";
        }
    }
    
    getRelationshipReport() {
        const stageBreakdown = {};
        this.connections.forEach(connection => {
            stageBreakdown[connection.relationshipStage] = 
                (stageBreakdown[connection.relationshipStage] || 0) + 1;
        });
        
        const advocates = this.connections.filter(c => c.relationshipStage === "advocate");
        const warmConnections = this.connections.filter(c => c.relationshipStage === "warm");
        
        return {
            totalConnections: this.connections.length,
            stageBreakdown,
            advocates: advocates.length,
            warmConnections: warmConnections.length,
            topAdvocates: advocates.slice(0, 10)
        };
    }
    
    getOutreachSuggestions() {
        const suggestions = [];
        
        // Connections that haven't been contacted recently
        const staleConnections = this.connections.filter(connection => {
            const daysSinceLastInteraction = (Date.now() - connection.lastInteraction) / (1000 * 60 * 60 * 24);
            return daysSinceLastInteraction > 14 && connection.relationshipStage !== "new";
        });
        
        staleConnections.forEach(connection => {
            suggestions.push({
                type: "re-engage",
                connection: connection,
                suggestion: `Reach out to ${connection.name} - no interaction in ${Math.floor((Date.now() - connection.lastInteraction) / (1000 * 60 * 60 * 24))} days`
            });
        });
        
        // New connections to follow up with
        const newConnections = this.connections.filter(c => c.relationshipStage === "new");
        newConnections.forEach(connection => {
            suggestions.push({
                type: "follow-up",
                connection: connection,
                suggestion: `Follow up with ${connection.name} from ${connection.community}`
            });
        });
        
        return suggestions;
    }
}
