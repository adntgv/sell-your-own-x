// Simple A/B Test for Headline
function runHeadlineTest() {
    const headlines = [
        'The Best Dev Tool for Productive Teams', // Control
        'Ship Code 2x Faster with AI-Powered Automation' // Variant
    ];

    const userGroup = Math.random() < 0.5 ? 'control' : 'variant';
    const headlineElement = document.querySelector('.hero-headline');
    
    if (userGroup === 'variant') {
        headlineElement.textContent = headlines[1];
    }

    // Track which variant the user saw
    // In a real app, you'd send this to your analytics
    console.log(`User saw ${userGroup} headline.`);
}

runHeadlineTest();

// Example of dynamic value proposition based on URL parameter
const urlParams = new URLSearchParams(window.location.search);
const segment = urlParams.get('segment');

const valueProps = {
    'startup': {
        headline: 'The fastest way to build your MVP',
        subheadline: 'Tools for lean startups to ship and iterate quickly.'
    },
    'enterprise': {
        headline: 'Secure, Scalable, and Compliant Development',
        subheadline: 'Enterprise-grade tools for mission-critical applications.'
    }
};

if (segment && valueProps[segment]) {
    document.querySelector('.hero-headline').textContent = valueProps[segment].headline;
    document.querySelector('.hero-subheadline').textContent = valueProps[segment].subheadline;
}
