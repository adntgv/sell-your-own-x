class InfluencerCampaignManager {
    constructor() {
        this.campaignDatabase = new CampaignDatabase();
        this.contractManager = new ContractManager();
        this.contentTracker = new ContentTracker();
        this.paymentProcessor = new PaymentProcessor();
        this.performanceTracker = new PerformanceTracker();
    }
    
    async createCampaign(campaignConfig) {
        const campaign = {
            id: this.generateCampaignId(),
            name: campaignConfig.name,
            brand: campaignConfig.brand,
            objectives: campaignConfig.objectives,
            budget: campaignConfig.budget,
            timeline: campaignConfig.timeline,
            targetAudience: campaignConfig.targetAudience,
            deliverables: campaignConfig.deliverables,
            guidelines: campaignConfig.guidelines,
            selectedInfluencers: [],
            contracts: [],
            content: [],
            performance: {},
            status: 'planning',
            createdAt: new Date()
        };
        
        // Validate campaign configuration
        const validation = this.validateCampaignConfig(campaign);
        if (!validation.isValid) {
            throw new Error(`Invalid campaign config: ${validation.errors.join(', ')}`);
        }
        
        await this.campaignDatabase.save(campaign);
        return campaign;
    }
    
    async addInfluencerToCampaign(campaignId, influencerId, collaborationTerms) {
        const campaign = await this.getCampaign(campaignId);
        const influencer = await this.getInfluencer(influencerId);
        
        // Create collaboration proposal
        const proposal = {
            campaignId,
            influencerId,
            terms: collaborationTerms,
            deliverables: this.generateDeliverables(campaign, collaborationTerms),
            compensation: this.calculateCompensation(influencer, collaborationTerms),
            timeline: this.generateCollaborationTimeline(campaign.timeline, collaborationTerms),
            contractTemplate: await this.generateContractTemplate(campaign, influencer, collaborationTerms),
            status: 'pending'
        };
        
        // Send proposal to influencer
        await this.sendProposal(proposal);
        
        // Track proposal
        campaign.selectedInfluencers.push({
            influencerId,
            proposal,
            addedAt: new Date()
        });
        
        await this.campaignDatabase.update(campaign);
        return proposal;
    }
    
    async trackCampaignContent(campaignId) {
        const campaign = await this.getCampaign(campaignId);
        const contentTracking = {
            expected: [],
            delivered: [],
            pending: [],
            overdue: []
        };
        
        for (const influencer of campaign.selectedInfluencers) {
            const contract = await this.getInfluencerContract(campaignId, influencer.influencerId);
            if (!contract || contract.status !== 'signed') continue;
            
            // Track expected deliverables
            for (const deliverable of contract.deliverables) {
                const expectedContent = {
                    influencerId: influencer.influencerId,
                    type: deliverable.type,
                    platform: deliverable.platform,
                    dueDate: deliverable.dueDate,
                    requirements: deliverable.requirements
                };
                contentTracking.expected.push(expectedContent);
                
                // Check if content has been delivered
                const deliveredContent = await this.checkDeliveredContent(expectedContent);
                if (deliveredContent) {
                    contentTracking.delivered.push({
                        ...expectedContent,
                        content: deliveredContent,
                        deliveredAt: deliveredContent.publishedAt,
                        performance: await this.getContentPerformance(deliveredContent)
                    });
                } else if (new Date() > new Date(expectedContent.dueDate)) {
                    contentTracking.overdue.push(expectedContent);
                } else {
                    contentTracking.pending.push(expectedContent);
                }
            }
        }
        
        return contentTracking;
    }
    
    async calculateCampaignROI(campaignId) {
        const campaign = await this.getCampaign(campaignId);
        const performance = await this.getCampaignPerformance(campaignId);
        
        const costs = {
            influencerPayments: this.calculateInfluencerPayments(campaign),
            platformFees: this.calculatePlatformFees(campaign),
            productCosts: this.calculateProductCosts(campaign),
            managementFees: this.calculateManagementFees(campaign),
            total: 0
        };
        costs.total = Object.values(costs).reduce((sum, cost) => sum + (typeof cost === 'number' ? cost : 0), 0);
        
        const returns = {
            directSales: performance.attributedSales || 0,
            brandAwareness: this.calculateBrandAwarenessValue(performance),
            engagement: this.calculateEngagementValue(performance),
            contentAssets: this.calculateContentAssetValue(campaign),
            total: 0
        };
        returns.total = Object.values(returns).reduce((sum, value) => sum + (typeof value === 'number' ? value : 0), 0);
        
        const roi = {
            costs,
            returns,
            netReturn: returns.total - costs.total,
            roiPercentage: ((returns.total - costs.total) / costs.total) * 100,
            roas: returns.directSales / costs.total,
            cpmEquivalent: this.calculateCPMEquivalent(performance, costs.total),
            brandLift: performance.brandLift || {}
        };
        
        return roi;
    }
    
    async automatePayments(campaignId) {
        const campaign = await this.getCampaign(campaignId);
        const paymentResults = [];
        
        for (const influencer of campaign.selectedInfluencers) {
            const contract = await this.getInfluencerContract(campaignId, influencer.influencerId);
            if (!contract || contract.status !== 'signed') continue;
            
            // Check if milestones are met
            const milestones = await this.checkPaymentMilestones(contract);
            
            for (const milestone of milestones) {
                if (milestone.completed && !milestone.paid) {
                    try {
                        const payment = await this.paymentProcessor.processPayment({
                            recipient: contract.influencer.paymentDetails,
                            amount: milestone.amount,
                            currency: contract.currency,
                            reference: `${campaignId}-${milestone.id}`,
                            description: `Payment for ${milestone.description}`
                        });
                        
                        paymentResults.push({
                            influencerId: influencer.influencerId,
                            milestoneId: milestone.id,
                            amount: milestone.amount,
                            paymentId: payment.id,
                            status: 'completed',
                            processedAt: new Date()
                        });
                        
                        // Update milestone status
                        await this.updateMilestoneStatus(milestone.id, 'paid');
                        
                    } catch (error) {
                        paymentResults.push({
                            influencerId: influencer.influencerId,
                            milestoneId: milestone.id,
                            amount: milestone.amount,
                            status: 'failed',
                            error: error.message,
                            attemptedAt: new Date()
                        });
                    }
                }
            }
        }
        
        return paymentResults;
    }
}
