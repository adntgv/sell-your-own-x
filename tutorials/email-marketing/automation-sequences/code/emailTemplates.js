// src/emailTemplates.js
class EmailTemplates {
    
    // Welcome sequence for new signups
    getWelcomeSequence(userSegment) {
        const templates = {
            'solo-developer': {
                subject: "Welcome to DevTool Pro! Let's get you set up ⚡",
                content: `
                    Hi {{first_name}},

                    Welcome to DevTool Pro! As a solo developer, I know your time is precious.

                    Here's what I recommend you do first:

                    1. **Install our CLI tool** (2 minutes)
                       curl -L https://devtool.pro/install | bash

                    2. **Connect your first project** (5 minutes)
                       Run: devtool init in your project directory

                    3. **Try the automated testing** (immediate results)
                       Run: devtool test --auto

                    You'll save 2+ hours this week alone.

                    Questions? Just reply to this email - I read every one.

                    Best,
                    Alex (Founder)

                    P.S. Here's a link to our solo developer workflow guide: 
                    https://devtool.pro/solo-guide?utm_source=email&utm_campaign=welcome
                `
            },
            'startup-team': {
                subject: "Welcome to DevTool Pro! Team setup in 10 minutes 🚀",
                content: `
                    Hi {{first_name}},

                    Excited to have your team on DevTool Pro!

                    For startup teams, here's the fastest path to value:

                    1. **Set up team workspace** (5 minutes)
                       I'll send you the team setup guide in the next email

                    2. **Connect your CI/CD pipeline** (5 minutes)
                       Works with GitHub Actions, GitLab, Jenkins

                    3. **Configure team notifications** (2 minutes)
                       Get alerts in Slack when issues are detected

                    Your team will ship 40% faster within the first week.

                    I'm here to help if you need anything.

                    Best,
                    Alex

                    P.S. Want to hop on a 15-minute call to get your team set up? 
                    Book here: https://calendly.com/devtool-setup
                `
            }
        };

        return templates[userSegment] || templates['solo-developer'];
    }

    // Trial nurturing sequence
    getTrialSequence(step, userSegment, userEvents) {
        const sequences = {
            1: { // Day 1
                subject: "Your DevTool Pro trial is live! Here's what to try first 🎯",
                content: this.getTrialDay1Content(userSegment)
            },
            2: { // Day 3
                subject: "Quick question about your DevTool Pro experience so far",
                content: this.getTrialDay3Content(userSegment, userEvents)
            },
            3: { // Day 7
                subject: "One week left in your trial - let's make it count!",
                content: this.getTrialDay7Content(userSegment)
            },
            4: { // Day 12
                subject: "Your trial ends in 2 days - special offer inside",
                content: this.getTrialEndingContent(userSegment)
            },
            5: { // Day 15 - Trial ended
                subject: "Your trial ended - but your success story doesn't have to",
                content: this.getTrialEndedContent(userSegment)
            }
        };

        return sequences[step];
    }

    getTrialDay1Content(userSegment) {
        return `
            Hi {{first_name}},

            Your 14-day DevTool Pro trial just started! 

            ${userSegment === 'solo-developer' ? 
                "As a solo developer, here's the fastest way to see results:" :
                "For your team, here's the quickest path to 10x productivity:"
            }

            **This Week's Goals:**
            □ Set up your first project (5 minutes)
            □ Run automated tests (see instant results)
            □ Try the code review feature
            □ ${userSegment === 'startup-team' ? 'Invite 2 team members' : 'Explore CI/CD integration'}

            **Need help?** Reply to this email or book a quick call:
            https://calendly.com/devtool-support

            Ready to save hours this week?

            Best,
            Alex

            P.S. 87% of users who complete setup in the first 48 hours become paying customers. 
            You've got this! 💪
        `;
    }

    getTrialDay3Content(userSegment, userEvents) {
        const hasUsedFeature = userEvents.some(e => e.event_type === 'feature_used');
        
        if (hasUsedFeature) {
            return `
                Hi {{first_name}},

                I see you've been exploring DevTool Pro - that's awesome! 

                Quick question: What's been the most valuable feature so far?

                I'm asking because I want to make sure you're getting maximum value 
                from your trial. Sometimes there are hidden gems you might miss.

                **Popular features you might not have tried:**
                - Automated security scanning
                - Performance optimization suggestions  
                - Team collaboration dashboard

                Want a personalized demo of advanced features? 
                Book 15 minutes: https://calendly.com/devtool-demo

                Best,
                Alex

                P.S. If you're already loving DevTool Pro, you can upgrade anytime 
                and get 20% off your first month: https://devtool.pro/upgrade
            `;
        } else {
            return `
                Hi {{first_name}},

                I noticed you haven't had a chance to explore DevTool Pro yet.

                Life gets busy - I totally get it. But I don't want you to miss out 
                on the productivity gains that could save you hours every week.

                **Quick 5-minute setup:**
                1. Download: https://devtool.pro/download
                2. Run: devtool init
                3. Watch the magic happen ✨

                Still stuck? I'm here to help personally.
                Just reply to this email or book a quick call.

                Your future self will thank you for those extra hours!

                Best,
                Alex
            `;
        }
    }

    // Feature-specific education emails
    getFeatureEducationEmail(feature, userSegment) {
        const emails = {
            'testing': {
                subject: "Master automated testing in DevTool Pro (5-minute read)",
                content: `
                    Hi {{first_name}},

                    I noticed you've been using our testing features. Here's how to get 10x more value:

                    **Advanced Testing Techniques:**

                    1. **Smart Test Generation**
                       devtool test --generate
                       Auto-creates tests based on your code patterns

                    2. **Performance Testing**
                       devtool test --performance
                       Catches slow code before it hits production

                    3. **Visual Regression Testing**
                       devtool test --visual
                       Perfect for frontend changes

                    **Pro Tip:** Set up pre-commit hooks to run tests automatically:
                    devtool hooks --install

                    This alone saves our users 3+ hours per week.

                    Questions? Reply to this email - I love helping developers succeed!

                    Best,
                    Alex

                    P.S. Want to see these features in action? Here's a 3-minute demo:
                    https://devtool.pro/testing-demo
                `
            },
            'deployment': {
                subject: "Zero-downtime deployments made simple",
                content: `
                    Hi {{first_name}},

                    Saw you're using our deployment features - smart choice!

                    Here's how to achieve zero-downtime deployments:

                    **The DevTool Pro Deployment Strategy:**

                    1. **Blue-Green Deployments**
                       devtool deploy --strategy=blue-green
                       Zero downtime, instant rollback capability

                    2. **Automated Health Checks**
                       devtool deploy --health-check=true
                       Automatically verifies deployment success

                    3. **Rollback in Seconds**
                       devtool rollback --version=previous
                       One command to undo any deployment

                    **Real Example:**
                    Sarah's team at TechCorp reduced deployment time from 2 hours to 8 minutes 
                    and eliminated all downtime incidents.

                    Want to set this up for your project? I can walk you through it:
                    https://calendly.com/devtool-deployment

                    Best,
                    Alex
                `
            }
        };

        return emails[feature] || emails['testing'];
    }
}

module.exports = EmailTemplates;
