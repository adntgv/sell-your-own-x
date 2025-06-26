class RealTimeSegmentationEngine {
    constructor() {
        this.segmentDefinitions = new Map();
        this.segmentMembership = new Map();
        this.eventProcessor = new EventProcessor();
        this.segmentAnalytics = new SegmentAnalytics();
    }
    
    async createSegment(segmentDefinition) {
        const segment = {
            id: this.generateSegmentId(),
            name: segmentDefinition.name,
            description: segmentDefinition.description,
            criteria: this.compileCriteria(segmentDefinition.criteria),
            isRealTime: segmentDefinition.realTime || false,
            refreshFrequency: segmentDefinition.refreshFrequency || '1h',
            createdAt: new Date(),
            memberCount: 0,
            status: 'active'
        };
        
        // Validate segment criteria
        const validation = await this.validateSegmentCriteria(segment.criteria);
        if (!validation.isValid) {
            throw new Error(`Invalid segment criteria: ${validation.errors.join(', ')}`);
        }
        
        // Calculate initial membership
        const initialMembers = await this.calculateSegmentMembership(segment);
        segment.memberCount = initialMembers.length;
        
        // Store segment and membership
        this.segmentDefinitions.set(segment.id, segment);
        this.segmentMembership.set(segment.id, new Set(initialMembers));
        
        // Set up real-time processing if enabled
        if (segment.isRealTime) {
            await this.setupRealTimeSegmentUpdates(segment);
        }
        
        return segment;
    }
    
    async calculateSegmentMembership(segment) {
        const members = [];
        const customers = await this.getAllCustomers();
        
        for (const customer of customers) {
            const profile = await this.getCustomerProfile(customer.id);
            const matchResult = await this.evaluateSegmentCriteria(segment.criteria, profile);
            
            if (matchResult.matches) {
                members.push({
                    customerId: customer.id,
                    joinedAt: new Date(),
                    matchScore: matchResult.score,
                    matchingCriteria: matchResult.matchingCriteria
                });
            }
        }
        
        return members;
    }
    
    async evaluateSegmentCriteria(criteria, customerProfile) {
        const result = {
            matches: false,
            score: 0,
            matchingCriteria: []
        };
        
        // Evaluate each criterion
        for (const criterion of criteria) {
            const criterionResult = await this.evaluateCriterion(criterion, customerProfile);
            
            if (criterionResult.matches) {
                result.matchingCriteria.push(criterion.name);
                result.score += criterionResult.score || 1;
            }
        }
        
        // Apply logical operators (AND, OR)
        result.matches = this.applyLogicalOperators(criteria.logic, result.matchingCriteria, criteria);
        
        return result;
    }
    
    async evaluateCriterion(criterion, profile) {
        switch (criterion.type) {
            case 'demographic':
                return this.evaluateDemographicCriterion(criterion, profile.attributes);
            case 'behavioral':
                return this.evaluateBehavioralCriterion(criterion, profile.behaviors);
            case 'transactional':
                return this.evaluateTransactionalCriterion(criterion, profile.transactions);
            case 'engagement':
                return this.evaluateEngagementCriterion(criterion, profile.engagement);
            case 'lifecycle':
                return this.evaluateLifecycleCriterion(criterion, profile.lifecycle);
            case 'computed':
                return this.evaluateComputedCriterion(criterion, profile);
            default:
                throw new Error(`Unknown criterion type: ${criterion.type}`);
        }
    }
    
    async updateSegmentMembershipRealTime(customerId, updatedProfile) {
        const membershipChanges = [];
        
        for (const [segmentId, segment] of this.segmentDefinitions) {
            if (!segment.isRealTime) continue;
            
            const currentMember = this.segmentMembership.get(segmentId).has(customerId);
            const matchResult = await this.evaluateSegmentCriteria(segment.criteria, updatedProfile);
            const shouldBeMember = matchResult.matches;
            
            if (shouldBeMember && !currentMember) {
                // Customer should be added to segment
                this.segmentMembership.get(segmentId).add(customerId);
                membershipChanges.push({
                    segmentId,
                    customerId,
                    action: 'added',
                    timestamp: new Date()
                });
                
                // Trigger segment entry events
                await this.triggerSegmentEntryEvents(segmentId, customerId);
                
            } else if (!shouldBeMember && currentMember) {
                // Customer should be removed from segment
                this.segmentMembership.get(segmentId).delete(customerId);
                membershipChanges.push({
                    segmentId,
                    customerId,
                    action: 'removed',
                    timestamp: new Date()
                });
                
                // Trigger segment exit events
                await this.triggerSegmentExitEvents(segmentId, customerId);
            }
        }
        
        return membershipChanges;
    }
    
    async getSegmentAnalytics(segmentId, timeRange = '30d') {
        const segment = this.segmentDefinitions.get(segmentId);
        const members = Array.from(this.segmentMembership.get(segmentId) || []);
        
        const analytics = {
            segment: segment,
            memberCount: members.length,
            growthRate: await this.calculateSegmentGrowthRate(segmentId, timeRange),
            demographics: await this.calculateSegmentDemographics(members),
            behaviors: await this.calculateSegmentBehaviors(members),
            value: await this.calculateSegmentValue(members),
            engagement: await this.calculateSegmentEngagement(members),
            churnRisk: await this.calculateSegmentChurnRisk(members),
            conversionRates: await this.calculateSegmentConversions(members)
        };
        
        return analytics;
    }
}
