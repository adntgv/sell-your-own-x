// analytics/eventTracker.js
class AdvancedEventTracker {
    constructor() {
        this.sessionStartTime = Date.now()
        this.pageStartTime = Date.now()
        this.scrollDepthTracked = new Set()
        this.timeOnPageTracked = new Set()
        
        this.setupAutomaticTracking()
    }
    
    setupAutomaticTracking() {
        // Track scroll depth
        this.trackScrollDepth()
        
        // Track time on page milestones
        this.trackTimeOnPage()
        
        // Track user engagement
        this.trackEngagement()
        
        // Track errors and performance
        this.trackErrorsAndPerformance()
    }
    
    // Track meaningful user actions
    trackUserAction(action, context = {}) {
        const event = {
            action: action,
            context: context,
            sessionTime: Date.now() - this.sessionStartTime,
            pageTime: Date.now() - this.pageStartTime,
            timestamp: new Date().toISOString()
        }
        
        posthog.capture(`user_action_${action}`, event)
        
        // Store for session analysis
        this.storeSessionEvent(event)
    }
    
    // Product-specific event tracking
    trackProductEvents() {
        // Feature usage tracking
        document.addEventListener('click', (e) => {
            const element = e.target
            
            // Track button clicks with context
            if (element.tagName === 'BUTTON' || element.classList.contains('btn')) {
                this.trackUserAction('button_click', {
                    buttonText: element.textContent,
                    buttonId: element.id,
                    buttonClass: element.className,
                    section: this.getPageSection(element)
                })
            }
            
            // Track link clicks
            if (element.tagName === 'A') {
                this.trackUserAction('link_click', {
                    linkText: element.textContent,
                    linkUrl: element.href,
                    linkType: element.href.includes(window.location.origin) ? 'internal' : 'external'
                })
            }
            
            // Track form interactions
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                this.trackUserAction('form_interaction', {
                    fieldType: element.type,
                    fieldName: element.name,
                    formId: element.closest('form')?.id
                })
            }
        })
        
        // Track form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target
            const formData = new FormData(form)
            
            this.trackUserAction('form_submit', {
                formId: form.id,
                formAction: form.action,
                fieldCount: formData.entries().length,
                formMethod: form.method
            })
        })
    }
    
    // Conversion funnel tracking
    trackFunnelStep(stepName, stepData = {}) {
        posthog.capture('funnel_step', {
            step: stepName,
            stepData: stepData,
            funnelTimestamp: Date.now(),
            sessionId: this.getSessionId()
        })
        
        // Check if this completes a conversion funnel
        this.checkFunnelCompletion(stepName)
    }
    
    checkFunnelCompletion(currentStep) {
        const funnelSteps = [
            'landing_page_view',
            'feature_exploration', 
            'signup_form_view',
            'signup_complete',
            'onboarding_start',
            'first_action_complete'
        ]
        
        const currentStepIndex = funnelSteps.indexOf(currentStep)
        if (currentStepIndex === funnelSteps.length - 1) {
            posthog.capture('conversion_funnel_complete', {
                completionTime: Date.now() - this.sessionStartTime,
                stepsCompleted: funnelSteps.length
            })
        }
    }
    
    // User engagement scoring
    trackEngagement() {
        let engagementScore = 0
        let interactionCount = 0
        
        // Track meaningful interactions
        const engagementEvents = [
            'click', 'scroll', 'keydown', 'focus', 'blur'
        ]
        
        engagementEvents.forEach(eventType => {
            document.addEventListener(eventType, () => {
                interactionCount++
                
                // Calculate engagement score
                const timeOnPage = (Date.now() - this.pageStartTime) / 1000
                engagementScore = Math.min(100, 
                    (interactionCount * 2) + 
                    (timeOnPage / 60 * 5) + 
                    (this.scrollDepthTracked.size * 3)
                )
                
                // Send engagement milestone events
                if (engagementScore >= 25 && !this.milestoneTracked?.engagement_25) {
                    this.trackMilestone('engagement_25', { score: engagementScore })
                }
                if (engagementScore >= 50 && !this.milestoneTracked?.engagement_50) {
                    this.trackMilestone('engagement_50', { score: engagementScore })
                }
                if (engagementScore >= 75 && !this.milestoneTracked?.engagement_75) {
                    this.trackMilestone('engagement_75', { score: engagementScore })
                }
            }, { passive: true })
        })
        
        // Send final engagement score on page leave
        window.addEventListener('beforeunload', () => {
            posthog.capture('page_engagement_complete', {
                engagementScore: engagementScore,
                interactionCount: interactionCount,
                timeOnPage: (Date.now() - this.pageStartTime) / 1000
            })
        })
    }
    
    trackScrollDepth() {
        const scrollMilestones = [25, 50, 75, 90, 100]
        
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            )
            
            scrollMilestones.forEach(milestone => {
                if (scrollPercent >= milestone && !this.scrollDepthTracked.has(milestone)) {
                    this.scrollDepthTracked.add(milestone)
                    posthog.capture('scroll_depth', {
                        depth: milestone,
                        actualPercent: scrollPercent
                    })
                }
            })
        }, { passive: true })
    }
    
    trackTimeOnPage() {
        const timeMilestones = [30, 60, 120, 300, 600] // seconds
        
        timeMilestones.forEach(milestone => {
            setTimeout(() => {
                if (!this.timeOnPageTracked.has(milestone)) {
                    this.timeOnPageTracked.add(milestone)
                    posthog.capture('time_on_page', {
                        milestone: milestone,
                        actualTime: (Date.now() - this.pageStartTime) / 1000
                    })
                }
            }, milestone * 1000)
        })
    }
    
    trackErrorsAndPerformance() {
        // Track JavaScript errors
        window.addEventListener('error', (e) => {
            posthog.capture('javascript_error', {
                message: e.message,
                filename: e.filename,
                line: e.lineno,
                column: e.colno,
                stack: e.error?.stack
            })
        })
        
        // Track performance metrics
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navigation = performance.getEntriesByType('navigation')[0]
                const paint = performance.getEntriesByType('paint')
                
                posthog.capture('page_performance', {
                    loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
                    firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime
                })
            }, 100)
        })
    }
    
    // Helper methods
    getPageSection(element) {
        const section = element.closest('section, header, main, aside, footer')
        return section?.id || section?.className || 'unknown'
    }
    
    getSessionId() {
        return sessionStorage.getItem('sessionId') || 
               sessionStorage.setItem('sessionId', Date.now().toString())
    }
    
    storeSessionEvent(event) {
        const sessionEvents = JSON.parse(sessionStorage.getItem('sessionEvents') || '[]')
        sessionEvents.push(event)
        
        // Keep only last 100 events
        if (sessionEvents.length > 100) {
            sessionEvents.shift()
        }
        
        sessionStorage.setItem('sessionEvents', JSON.stringify(sessionEvents))
    }
    
    trackMilestone(milestoneName, data) {
        this.milestoneTracked = this.milestoneTracked || {}
        this.milestoneTracked[milestoneName] = true
        
        posthog.capture('engagement_milestone', {
            milestone: milestoneName,
            ...data
        })
    }
}

// Initialize tracker
const eventTracker = new AdvancedEventTracker()
export default eventTracker
