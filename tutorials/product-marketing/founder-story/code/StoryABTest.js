// Simple A/B testing for founder story
class StoryABTest {
    constructor() {
        this.variants = {
            'control': {
                headline: 'Why I Built [Product Name]',
                hook: 'After 8 years as a developer, I was tired of spending more time fighting tools than building products.',
                approach: 'problem-first'
            },
            'mission-first': {
                headline: 'My Mission to Save Developers Time',
                hook: 'I believe developers should spend their time creating, not configuring.',
                approach: 'mission-first'
            },
            'credibility-first': {
                headline: 'From Senior Developer to Founder',
                hook: 'After 8 years at tech companies and 50+ developer interviews, I discovered the real problem.',
                approach: 'credibility-first'
            }
        };
        
        this.assignVariant();
    }
    
    assignVariant() {
        // Get or create user variant assignment
        let userVariant = localStorage.getItem('story_variant');
        
        if (!userVariant) {
            const variants = Object.keys(this.variants);
            userVariant = variants[Math.floor(Math.random() * variants.length)];
            localStorage.setItem('story_variant', userVariant);
        }
        
        this.currentVariant = userVariant;
        this.applyVariant();
        this.trackVariant();
    }
    
    applyVariant() {
        const variant = this.variants[this.currentVariant];
        
        // Update content based on variant
        const headline = document.querySelector('.story-text h2');
        const hook = document.querySelector('.story-hook');
        
        if (headline) headline.textContent = variant.headline;
        if (hook) hook.textContent = `"${variant.hook}"`;
    }
    
    trackVariant() {
        gtag('event', 'story_variant_assigned', {
            variant: this.currentVariant,
            approach: this.variants[this.currentVariant].approach
        });
    }
    
    trackConversion(conversionType) {
        gtag('event', 'story_variant_conversion', {
            variant: this.currentVariant,
            conversion_type: conversionType
        });
    }
}

// Initialize A/B test
const storyTest = new StoryABTest();

// Track conversions from story
document.querySelectorAll('.cta-button').forEach(button => {
    button.addEventListener('click', function() {
        storyTest.trackConversion('cta_click');
    });
});
