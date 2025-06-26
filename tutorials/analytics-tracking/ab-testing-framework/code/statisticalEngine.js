// Statistical significance calculator
class StatisticalEngine {
    constructor() {
        this.confidenceLevel = 0.95; // 95% confidence
        this.minimumSampleSize = 100;
        this.tests = new Map();
    }
    
    calculateSampleSize(baselineConversion, minimumDetectableEffect, power = 0.8) {
        // Calculate required sample size for statistical significance
        const alpha = 1 - this.confidenceLevel;
        const beta = 1 - power;
        
        // Z-scores for two-tailed test
        const zAlpha = this.getZScore(1 - alpha / 2);
        const zBeta = this.getZScore(1 - beta);
        
        // Pooled standard deviation
        const p1 = baselineConversion;
        const p2 = baselineConversion * (1 + minimumDetectableEffect);
        const pPooled = (p1 + p2) / 2;
        
        // Sample size calculation
        const numerator = Math.pow(zAlpha + zBeta, 2) * 2 * pPooled * (1 - pPooled);
        const denominator = Math.pow(p2 - p1, 2);
        
        const sampleSizePerVariant = Math.ceil(numerator / denominator);
        
        return {
            perVariant: sampleSizePerVariant,
            total: sampleSizePerVariant * 2,
            estimatedDays: this.estimateDuration(sampleSizePerVariant)
        };
    }
    
    calculateSignificance(control, variant) {
        // Two-proportion z-test for conversion rate testing
        const n1 = control.visitors;
        const n2 = variant.visitors;
        const x1 = control.conversions;
        const x2 = variant.conversions;
        
        if (n1 < this.minimumSampleSize || n2 < this.minimumSampleSize) {
            return {
                isSignificant: false,
                pValue: null,
                confidenceInterval: null,
                message: 'Insufficient sample size'
            };
        }
        
        const p1 = x1 / n1;
        const p2 = x2 / n2;
        const pPooled = (x1 + x2) / (n1 + n2);
        
        // Standard error
        const se = Math.sqrt(pPooled * (1 - pPooled) * (1/n1 + 1/n2));
        
        // Z-score
        const z = (p2 - p1) / se;
        
        // P-value (two-tailed test)
        const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));
        
        // Confidence interval
        const ciMargin = this.getZScore(1 - (1 - this.confidenceLevel) / 2) * se;
        const lift = p2 - p1;
        const confidenceInterval = {
            lower: lift - ciMargin,
            upper: lift + ciMargin
        };
        
        // Relative improvement
        const relativeImprovement = ((p2 - p1) / p1) * 100;
        
        return {
            isSignificant: pValue < (1 - this.confidenceLevel),
            pValue: pValue,
            zScore: z,
            confidenceInterval: confidenceInterval,
            lift: lift,
            relativeImprovement: relativeImprovement,
            controlConversion: p1,
            variantConversion: p2,
            statisticalPower: this.calculatePower(n1, p1, p2)
        };
    }
    
    calculateBayesianProbability(control, variant) {
        // Bayesian approach for early stopping and continuous monitoring
        const alphaPrior = 1; // Beta prior parameters
        const betaPrior = 1;
        
        // Posterior parameters
        const alphaControl = alphaPrior + control.conversions;
        const betaControl = betaPrior + control.visitors - control.conversions;
        const alphaVariant = alphaPrior + variant.conversions;
        const betaVariant = betaPrior + variant.visitors - variant.conversions;
        
        // Monte Carlo simulation for P(variant > control)
        const simulations = 100000;
        let variantWins = 0;
        
        for (let i = 0; i < simulations; i++) {
            const controlSample = this.betaRandom(alphaControl, betaControl);
            const variantSample = this.betaRandom(alphaVariant, betaVariant);
            
            if (variantSample > controlSample) {
                variantWins++;
            }
        }
        
        const probabilityToWin = variantWins / simulations;
        
        // Expected loss calculation
        const expectedLoss = this.calculateExpectedLoss(
            alphaControl, betaControl,
            alphaVariant, betaVariant
        );
        
        return {
            probabilityToWin: probabilityToWin,
            expectedLoss: expectedLoss,
            recommendation: this.getBayesianRecommendation(probabilityToWin, expectedLoss),
            credibleInterval: this.getBayesianCredibleInterval(alphaVariant, betaVariant)
        };
    }
    
    performSequentialAnalysis(testData) {
        // Sequential testing to allow for early stopping
        const boundaries = this.calculateSequentialBoundaries(testData);
        const currentStatistic = this.calculateTestStatistic(testData);
        
        if (currentStatistic > boundaries.upper) {
            return {
                decision: 'stop_winner',
                confidence: this.confidenceLevel,
                message: 'Variant is significantly better'
            };
        } else if (currentStatistic < boundaries.lower) {
            return {
                decision: 'stop_loser',
                confidence: this.confidenceLevel,
                message: 'Variant is significantly worse'
            };
        } else {
            return {
                decision: 'continue',
                progress: this.calculateProgress(testData, boundaries),
                message: 'Continue collecting data'
            };
        }
    }
    
    calculateMultiVariateSignificance(control, variants) {
        // ANOVA-style analysis for multiple variants
        const allGroups = [control, ...variants];
        const totalVisitors = allGroups.reduce((sum, g) => sum + g.visitors, 0);
        const totalConversions = allGroups.reduce((sum, g) => sum + g.conversions, 0);
        const overallConversionRate = totalConversions / totalVisitors;
        
        // Calculate chi-square statistic
        let chiSquare = 0;
        allGroups.forEach(group => {
            const expected = group.visitors * overallConversionRate;
            const observed = group.conversions;
            chiSquare += Math.pow(observed - expected, 2) / expected;
        });
        
        const degreesOfFreedom = allGroups.length - 1;
        const pValue = 1 - this.chiSquareCDF(chiSquare, degreesOfFreedom);
        
        // Pairwise comparisons with Bonferroni correction
        const pairwiseResults = [];
        const numComparisons = variants.length;
        const adjustedAlpha = (1 - this.confidenceLevel) / numComparisons;
        
        variants.forEach((variant, index) => {
            const comparison = this.calculateSignificance(control, variant);
            comparison.adjustedPValue = comparison.pValue * numComparisons;
            comparison.isSignificant = comparison.adjustedPValue < adjustedAlpha;
            comparison.variantName = variant.name || `Variant ${index + 1}`;
            pairwiseResults.push(comparison);
        });
        
        return {
            overallSignificance: pValue < (1 - this.confidenceLevel),
            overallPValue: pValue,
            chiSquare: chiSquare,
            degreesOfFreedom: degreesOfFreedom,
            pairwiseComparisons: pairwiseResults,
            winner: this.determineWinner(pairwiseResults)
        };
    }
    
    // Helper functions
    getZScore(probability) {
        // Inverse normal CDF (approximation)
        const a1 = -39.6968302866538, a2 = 220.946098424521, a3 = -275.928510446969;
        const a4 = 138.357751867269, a5 = -30.6647980661472, a6 = 2.50662827745924;
        const b1 = -54.4760987982241, b2 = 161.585836858041, b3 = -155.698979859887;
        const b4 = 66.8013118877197, b5 = -13.2806815528857;
        const c1 = -0.00778489400243029, c2 = -0.322396458041136, c3 = -2.40075827716184;
        const c4 = -2.54973253934373, c5 = 4.37466414146497, c6 = 2.93816398269878;
        const d1 = 0.00778469570904146, d2 = 0.32246712907004, d3 = 2.445134137143;
        const d4 = 3.75440866190742;
        
        let q, r;
        
        if (probability < 0.02425 || probability > 0.97575) {
            q = Math.sqrt(-2 * Math.log(probability < 0.5 ? probability : 1 - probability));
            return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
                   ((((d1 * q + d2) * q + d3) * q + d4) * q + 1) *
                   (probability < 0.5 ? -1 : 1);
        } else {
            q = probability - 0.5;
            r = q * q;
            return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
                   (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
        }
    }
    
    normalCDF(z) {
        // Cumulative distribution function for standard normal
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;
        
        const sign = z >= 0 ? 1 : -1;
        z = Math.abs(z);
        
        const t = 1.0 / (1.0 + p * z);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
        
        return 0.5 * (1.0 + sign * y);
    }
    
    betaRandom(alpha, beta) {
        // Generate random sample from Beta distribution
        const u = Math.random();
        const v = Math.random();
        const x = Math.pow(u, 1 / alpha);
        const y = Math.pow(v, 1 / beta);
        return x / (x + y);
    }
}
