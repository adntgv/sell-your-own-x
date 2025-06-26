class IncrementalityTester {
    constructor() {
        this.experimentDesigner = new ExperimentDesigner();
        this.statisticalAnalyzer = new StatisticalAnalyzer();
        this.geoTester = new GeoExperimentTester();
        this.holdoutTester = new HoldoutTester();
    }
    
    async designIncrementalityTest(channel, testConfig) {
        const testDesign = {
            channel,
            testType: testConfig.testType || 'geo_experiment',
            hypothesis: testConfig.hypothesis,
            duration: testConfig.duration || '4w',
            significance: testConfig.significance || 0.05,
            power: testConfig.power || 0.8,
            mde: testConfig.minimumDetectableEffect || 0.05
        };
        
        switch (testDesign.testType) {
            case 'geo_experiment':
                return await this.designGeoExperiment(testDesign);
            case 'holdout_test':
                return await this.designHoldoutTest(testDesign);
            case 'conversion_lift':
                return await this.designConversionLiftTest(testDesign);
            case 'ghost_ads':
                return await this.designGhostAdsTest(testDesign);
            default:
                throw new Error(`Unknown test type: ${testDesign.testType}`);
        }
    }
    
    async designGeoExperiment(testConfig) {
        const geoData = await this.getGeographicData();
        const matchedPairs = await this.findMatchedGeoPairs(geoData, testConfig);
        
        const experiment = {
            type: 'geo_experiment',
            name: `Geo Test - ${testConfig.channel}`,
            hypothesis: testConfig.hypothesis,
            design: {
                matchedPairs,
                treatmentGeos: matchedPairs.map(pair => pair.treatment),
                controlGeos: matchedPairs.map(pair => pair.control),
                randomization: 'paired_randomization'
            },
            duration: testConfig.duration,
            metrics: {
                primary: 'conversions',
                secondary: ['revenue', 'visits', 'brand_awareness']
            },
            sampleSize: this.calculateGeoSampleSize(matchedPairs, testConfig),
            expectedResults: await this.predictGeoTestResults(matchedPairs, testConfig)
        };
        
        return experiment;
    }
    
    async findMatchedGeoPairs(geoData, testConfig) {
        const geos = Object.keys(geoData);
        const pairs = [];
        const used = new Set();
        
        // Calculate similarity scores for all geo pairs
        for (let i = 0; i < geos.length; i++) {
            if (used.has(geos[i])) continue;
            
            let bestMatch = null;
            let bestScore = -1;
            
            for (let j = i + 1; j < geos.length; j++) {
                if (used.has(geos[j])) continue;
                
                const similarity = this.calculateGeoSimilarity(
                    geoData[geos[i]],
                    geoData[geos[j]]
                );
                
                if (similarity > bestScore) {
                    bestScore = similarity;
                    bestMatch = geos[j];
                }
            }
            
            if (bestMatch && bestScore > 0.8) { // Minimum similarity threshold
                pairs.push({
                    treatment: Math.random() > 0.5 ? geos[i] : bestMatch,
                    control: Math.random() > 0.5 ? bestMatch : geos[i],
                    similarity: bestScore,
                    data: {
                        treatment: geoData[geos[i]],
                        control: geoData[bestMatch]
                    }
                });
                
                used.add(geos[i]);
                used.add(bestMatch);
            }
        }
        
        return pairs.sort((a, b) => b.similarity - a.similarity);
    }
    
    async runIncrementalityTest(experimentId) {
        const experiment = await this.getExperiment(experimentId);
        const results = {
            experimentId,
            status: 'running',
            startDate: new Date(),
            metrics: {},
            analysis: null
        };
        
        // Monitor test progress
        const monitoringInterval = setInterval(async () => {
            const currentData = await this.collectTestData(experiment);
            results.metrics = currentData;
            
            // Check for early stopping conditions
            const earlyStoppingCheck = await this.checkEarlyStopping(experiment, currentData);
            if (earlyStoppingCheck.shouldStop) {
                clearInterval(monitoringInterval);
                results.status = 'completed_early';
                results.analysis = await this.analyzeResults(experiment, currentData);
                results.endDate = new Date();
            }
        }, 24 * 60 * 60 * 1000); // Check daily
        
        // Schedule test completion
        setTimeout(async () => {
            clearInterval(monitoringInterval);
            const finalData = await this.collectTestData(experiment);
            results.status = 'completed';
            results.metrics = finalData;
            results.analysis = await this.analyzeResults(experiment, finalData);
            results.endDate = new Date();
        }, this.parseDuration(experiment.duration));
        
        return results;
    }
    
    async analyzeResults(experiment, data) {
        const analysis = {
            incrementality: {},
            significance: {},
            confidence: {},
            recommendations: []
        };
        
        // Calculate incrementality for each metric
        for (const metric of Object.keys(data.treatment)) {
            const treatmentValue = data.treatment[metric];
            const controlValue = data.control[metric];
            
            const incrementality = (treatmentValue - controlValue) / controlValue;
            const significance = await this.calculateSignificance(
                data.treatment[metric + '_distribution'],
                data.control[metric + '_distribution']
            );
            
            analysis.incrementality[metric] = {
                absolute: treatmentValue - controlValue,
                relative: incrementality,
                treatmentMean: treatmentValue,
                controlMean: controlValue,
                confidence: significance.confidence,
                pValue: significance.pValue,
                isSignificant: significance.isSignificant
            };
        }
        
        // Overall test assessment
        analysis.overall = {
            significant: analysis.incrementality.conversions.isSignificant,
            incrementality: analysis.incrementality.conversions.relative,
            confidence: analysis.incrementality.conversions.confidence,
            recommendation: this.generateRecommendation(analysis.incrementality.conversions)
        };
        
        return analysis;
    }
}
