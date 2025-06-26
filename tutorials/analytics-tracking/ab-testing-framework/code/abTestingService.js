// A/B Testing backend service
class ABTestingService {
    constructor() {
        this.database = new DatabaseConnection();
        this.statisticalEngine = new StatisticalEngine();
        this.cache = new RedisCache();
        this.eventProcessor = new EventProcessor();
    }
    
    async createTest(testConfig) {
        // Validate test configuration
        const validation = this.validateTestConfig(testConfig);
        if (!validation.isValid) {
            throw new Error(`Invalid test config: ${validation.errors.join(', ')}`);
        }
        
        // Calculate required sample size
        const sampleSize = this.statisticalEngine.calculateSampleSize(
            testConfig.baselineConversion,
            testConfig.minimumDetectableEffect,
            testConfig.statisticalPower || 0.8
        );
        
        // Create test
        const test = {
            id: this.generateTestId(),
            name: testConfig.name,
            description: testConfig.description,
            hypothesis: testConfig.hypothesis,
            primaryMetric: testConfig.primaryMetric,
            secondaryMetrics: testConfig.secondaryMetrics || [],
            control: {
                name: 'control',
                allocation: testConfig.controlAllocation || 0.5,
                description: testConfig.controlDescription
            },
            variants: testConfig.variants.map(v => ({
                ...v,
                allocation: v.allocation || (1 - testConfig.controlAllocation) / testConfig.variants.length
            })),
            targeting: testConfig.targeting || null,
            trafficAllocation: testConfig.trafficAllocation || 1.0,
            sampleSize: sampleSize,
            status: 'draft',
            createdAt: new Date(),
            createdBy: testConfig.createdBy
        };
        
        // Store test
        await this.database.createTest(test);
        
        // Invalidate cache
        await this.cache.invalidate('active_tests');
        
        return test;
    }
    
    async startTest(testId) {
        const test = await this.database.getTest(testId);
        
        if (test.status !== 'draft') {
            throw new Error('Test must be in draft status to start');
        }
        
        // Pre-test validation
        await this.performPreTestValidation(test);
        
        // Update test status
        test.status = 'running';
        test.startedAt = new Date();
        test.estimatedEndDate = this.calculateEstimatedEndDate(test);
        
        await this.database.updateTest(test);
        
        // Invalidate cache
        await this.cache.invalidate('active_tests');
        
        // Start monitoring
        await this.startTestMonitoring(test);
        
        return test;
    }
    
    async getTestResults(testId, options = {}) {
        const test = await this.database.getTest(testId);
        const events = await this.database.getTestEvents(testId, options);
        
        // Aggregate results by variant
        const results = this.aggregateResults(test, events);
        
        // Calculate statistical significance
        const statistics = this.calculateStatistics(results);
        
        // Segment results if requested
        const segments = options.segments ? 
            await this.segmentResults(test, events, options.segments) : null;
        
        // Generate insights
        const insights = await this.generateInsights(test, results, statistics);
        
        return {
            test,
            results,
            statistics,
            segments,
            insights,
            timeline: await this.generateTimeline(test, events),
            metadata: {
                lastUpdated: new Date(),
                totalEvents: events.length,
                uniqueUsers: results.totalUniqueUsers
            }
        };
    }
    
    aggregateResults(test, events) {
        const results = {
            control: {
                name: 'control',
                visitors: 0,
                conversions: 0,
                revenue: 0,
                events: {}
            },
            variants: test.variants.map(v => ({
                name: v.name,
                visitors: 0,
                conversions: 0,
                revenue: 0,
                events: {}
            })),
            totalUniqueUsers: new Set()
        };
        
        // Process events
        events.forEach(event => {
            const variant = this.getUserVariant(event.userId, test);
            const resultGroup = variant === 'control' ? 
                results.control : 
                results.variants.find(v => v.name === variant);
            
            if (!resultGroup) return;
            
            // Track unique visitors
            if (event.eventName === 'experiment_viewed') {
                results.totalUniqueUsers.add(event.userId);
                if (!resultGroup.uniqueVisitors) {
                    resultGroup.uniqueVisitors = new Set();
                }
                resultGroup.uniqueVisitors.add(event.userId);
                resultGroup.visitors = resultGroup.uniqueVisitors.size;
            }
            
            // Track conversions
            if (event.eventName === test.primaryMetric) {
                resultGroup.conversions++;
                
                // Track revenue if applicable
                if (event.properties && event.properties.value) {
                    resultGroup.revenue += event.properties.value;
                }
            }
            
            // Track all events
            if (!resultGroup.events[event.eventName]) {
                resultGroup.events[event.eventName] = 0;
            }
            resultGroup.events[event.eventName]++;
        });
        
        results.totalUniqueUsers = results.totalUniqueUsers.size;
        
        return results;
    }
    
    calculateStatistics(results) {
        const statistics = {};
        
        // Calculate significance for each variant
        results.variants.forEach(variant => {
            const significance = this.statisticalEngine.calculateSignificance(
                results.control,
                variant
            );
            
            const bayesian = this.statisticalEngine.calculateBayesianProbability(
                results.control,
                variant
            );
            
            statistics[variant.name] = {
                ...significance,
                bayesian,
                sampleSizeReached: this.checkSampleSize(results.control, variant)
            };
        });
        
        // Multi-variant analysis if applicable
        if (results.variants.length > 1) {
            statistics.multivariate = this.statisticalEngine.calculateMultiVariateSignificance(
                results.control,
                results.variants
            );
        }
        
        return statistics;
    }
    
    async segmentResults(test, events, segments) {
        const segmentedResults = {};
        
        for (const segment of segments) {
            const segmentEvents = await this.filterEventsBySegment(events, segment);
            const segmentResults = this.aggregateResults(test, segmentEvents);
            const segmentStatistics = this.calculateStatistics(segmentResults);
            
            segmentedResults[segment.name] = {
                segment,
                results: segmentResults,
                statistics: segmentStatistics,
                sampleSize: segmentEvents.length
            };
        }
        
        return segmentedResults;
    }
    
    async generateInsights(test, results, statistics) {
        const insights = [];
        
        // Check for statistical significance
        Object.entries(statistics).forEach(([variantName, stats]) => {
            if (stats.isSignificant) {
                insights.push({
                    type: 'significance_reached',
                    severity: 'high',
                    message: `${variantName} shows ${stats.relativeImprovement.toFixed(1)}% improvement with ${(stats.confidenceLevel * 100).toFixed(1)}% confidence`,
                    variant: variantName,
                    impact: stats.relativeImprovement
                });
            }
        });
        
        // Check for sample size issues
        if (!this.isSampleSizeAdequate(results)) {
            insights.push({
                type: 'insufficient_sample',
                severity: 'medium',
                message: 'Test has not reached minimum sample size for reliable results',
                currentSample: results.control.visitors + results.variants.reduce((sum, v) => sum + v.visitors, 0),
                requiredSample: test.sampleSize.total
            });
        }
        
        // Check for Simpson's paradox
        const simpsonCheck = await this.checkSimpsonsParadox(test, results);
        if (simpsonCheck.detected) {
            insights.push({
                type: 'simpsons_paradox',
                severity: 'high',
                message: 'Simpson\'s paradox detected - overall results may be misleading',
                details: simpsonCheck.details
            });
        }
        
        // Check for novelty effect
        const noveltyCheck = await this.checkNoveltyEffect(test, results);
        if (noveltyCheck.detected) {
            insights.push({
                type: 'novelty_effect',
                severity: 'medium',
                message: 'Potential novelty effect detected - results may not sustain long-term',
                details: noveltyCheck.details
            });
        }
        
        return insights;
    }
    
    async monitorTestHealth(testId) {
        const test = await this.database.getTest(testId);
        const recentEvents = await this.database.getRecentTestEvents(testId, '1h');
        
        const health = {
            testId,
            timestamp: new Date(),
            status: 'healthy',
            issues: []
        };
        
        // Check sample ratio mismatch
        const srmCheck = this.checkSampleRatioMismatch(test, recentEvents);
        if (srmCheck.detected) {
            health.status = 'warning';
            health.issues.push({
                type: 'sample_ratio_mismatch',
                severity: 'high',
                message: 'Traffic allocation deviates from expected ratios',
                details: srmCheck
            });
        }
        
        // Check for data quality issues
        const dataQuality = await this.checkDataQuality(recentEvents);
        if (dataQuality.issues.length > 0) {
            health.status = 'warning';
            health.issues.push(...dataQuality.issues);
        }
        
        // Check for interaction effects
        const interactions = await this.checkTestInteractions(test);
        if (interactions.detected) {
            health.status = 'warning';
            health.issues.push({
                type: 'test_interaction',
                severity: 'medium',
                message: 'Potential interaction with other running tests',
                details: interactions
            });
        }
        
        return health;
    }
}