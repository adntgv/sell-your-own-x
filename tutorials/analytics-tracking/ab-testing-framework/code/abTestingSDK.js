// Client-side A/B testing SDK
class ABTestingSDK {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.apiEndpoint = config.apiEndpoint || 'https://api.abtesting.com';
        this.userId = this.getUserId();
        this.activeTests = new Map();
        this.eventQueue = [];
        this.initialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            // Fetch active tests for user
            const tests = await this.fetchActiveTests();
            
            // Assign user to test variants
            tests.forEach(test => {
                const assignment = this.assignUserToVariant(test);
                this.activeTests.set(test.id, assignment);
            });
            
            // Set up event tracking
            this.setupEventTracking();
            
            // Start event batch processing
            this.startEventBatching();
            
            this.initialized = true;
            console.log('A/B Testing SDK initialized');
            
        } catch (error) {
            console.error('Failed to initialize A/B Testing SDK:', error);
        }
    }
    
    assignUserToVariant(test) {
        // Deterministic assignment based on user ID
        const hashValue = this.hashString(this.userId + test.id);
        const bucketValue = hashValue % 10000;
        
        let accumulatedAllocation = 0;
        let selectedVariant = test.control;
        
        // Handle traffic allocation
        const effectiveTraffic = test.trafficAllocation || 1.0;
        if (bucketValue >= effectiveTraffic * 10000) {
            return {
                testId: test.id,
                testName: test.name,
                variant: null,
                isInTest: false
            };
        }
        
        // Assign to variant based on allocation
        for (const variant of test.variants) {
            accumulatedAllocation += variant.allocation * effectiveTraffic * 10000;
            if (bucketValue < accumulatedAllocation) {
                selectedVariant = variant;
                break;
            }
        }
        
        // Apply targeting rules
        if (test.targeting && !this.evaluateTargeting(test.targeting)) {
            return {
                testId: test.id,
                testName: test.name,
                variant: null,
                isInTest: false
            };
        }
        
        return {
            testId: test.id,
            testName: test.name,
            variant: selectedVariant,
            isInTest: true,
            assignedAt: new Date()
        };
    }
    
    getVariant(testName) {
        // Get variant assignment for a test
        const assignment = Array.from(this.activeTests.values())
            .find(a => a.testName === testName);
        
        if (!assignment || !assignment.isInTest) {
            return 'control';
        }
        
        // Track exposure event
        this.track('experiment_viewed', {
            test_id: assignment.testId,
            test_name: assignment.testName,
            variant: assignment.variant.name
        });
        
        return assignment.variant.name;
    }
    
    isFeatureEnabled(featureName) {
        // Feature flag functionality
        const variant = this.getVariant(featureName);
        return variant !== 'control';
    }
    
    getVariantData(testName) {
        // Get variant configuration data
        const assignment = Array.from(this.activeTests.values())
            .find(a => a.testName === testName);
        
        if (!assignment || !assignment.isInTest) {
            return null;
        }
        
        return assignment.variant.data || null;
    }
    
    track(eventName, properties = {}) {
        // Track conversion events
        if (!this.initialized) {
            console.warn('SDK not initialized, queuing event');
            this.eventQueue.push({ eventName, properties, timestamp: new Date() });
            return;
        }
        
        const event = {
            user_id: this.userId,
            event_name: eventName,
            properties: {
                ...properties,
                ...this.getTestContext()
            },
            timestamp: new Date().toISOString()
        };
        
        this.eventQueue.push(event);
    }
    
    getTestContext() {
        // Get all active test assignments for event context
        const context = {};
        
        this.activeTests.forEach((assignment, testId) => {
            if (assignment.isInTest) {
                context[`test_${testId}`] = assignment.variant.name;
            }
        });
        
        return context;
    }
    
    setupEventTracking() {
        // Automatic event tracking
        
        // Click tracking
        document.addEventListener('click', (e) => {
            const target = e.target;
            const testElement = target.closest('[data-ab-test]');
            
            if (testElement) {
                const testName = testElement.getAttribute('data-ab-test');
                const action = testElement.getAttribute('data-ab-action') || 'click';
                
                this.track(`ab_${action}`, {
                    test_name: testName,
                    element_text: target.textContent,
                    element_tag: target.tagName
                });
            }
        });
        
        // Form submission tracking
        document.addEventListener('submit', (e) => {
            const form = e.target;
            const testForm = form.closest('[data-ab-test]');
            
            if (testForm) {
                const testName = testForm.getAttribute('data-ab-test');
                this.track('ab_form_submit', {
                    test_name: testName,
                    form_id: form.id,
                    form_action: form.action
                });
            }
        });
        
        // Page view tracking
        this.track('page_view', {
            url: window.location.href,
            referrer: document.referrer,
            title: document.title
        });
    }
    
    startEventBatching() {
        // Batch events for efficient sending
        setInterval(() => {
            if (this.eventQueue.length > 0) {
                this.flushEvents();
            }
        }, 5000); // Flush every 5 seconds
        
        // Also flush on page unload
        window.addEventListener('beforeunload', () => {
            this.flushEvents();
        });
    }
    
    async flushEvents() {
        if (this.eventQueue.length === 0) return;
        
        const events = [...this.eventQueue];
        this.eventQueue = [];
        
        try {
            await fetch(`${this.apiEndpoint}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({ events })
            });
        } catch (error) {
            console.error('Failed to send events:', error);
            // Re-queue events on failure
            this.eventQueue.unshift(...events);
        }
    }
    
    // Multi-armed bandit functionality
    async getMultiArmedBanditVariant(testName) {
        // Dynamic allocation based on performance
        try {
            const response = await fetch(`${this.apiEndpoint}/mab/${testName}/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({ user_id: this.userId })
            });
            
            const assignment = await response.json();
            
            // Cache assignment
            this.activeTests.set(assignment.test_id, assignment);
            
            return assignment.variant.name;
            
        } catch (error) {
            console.error('Failed to get MAB assignment:', error);
            return 'control';
        }
    }
    
    // Utility functions
    getUserId() {
        // Get or generate user ID
        let userId = localStorage.getItem('ab_user_id');
        
        if (!userId) {
            userId = this.generateUUID();
            localStorage.setItem('ab_user_id', userId);
        }
        
        return userId;
    }
    
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
}

// Usage example
const abTesting = new ABTestingSDK({
    apiKey: 'your-api-key',
    apiEndpoint: 'https://api.example.com'
});

// Simple variant check
if (abTesting.getVariant('new-checkout-flow') === 'variant_a') {
    // Show new checkout flow
} else {
    // Show control checkout flow
}

// Feature flag
if (abTesting.isFeatureEnabled('dark-mode')) {
    document.body.classList.add('dark-mode');
}

// Track conversion
abTesting.track('purchase_completed', {
    value: 99.99,
    currency: 'USD',
    items: ['product-123']
});
