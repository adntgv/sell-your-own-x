// analytics/alertSystem.js
class AlertSystem {
    constructor() {
        this.alertChannels = {
            slack: process.env.SLACK_WEBHOOK_URL,
            email: process.env.EMAIL_SERVICE_API_KEY
        }
        this.alertThresholds = {
            conversionRate: { min: 2, max: 10 },
            bounceRate: { max: 60 },
            errorRate: { max: 2 },
            loadTime: { max: 3000 }
        }
    }
    
    async checkAlerts(currentMetrics, previousMetrics) {
        const alerts = []
        
        // Check each threshold
        Object.entries(this.alertThresholds).forEach(([metric, thresholds]) => {
            const currentValue = currentMetrics[metric]
            const previousValue = previousMetrics[metric]
            
            if (this.shouldAlert(metric, currentValue, previousValue, thresholds)) {
                alerts.push(this.createAlert(metric, currentValue, previousValue, thresholds))
            }
        })
        
        // Send alerts
        for (const alert of alerts) {
            await this.sendAlert(alert)
        }
        
        return alerts
    }
    
    shouldAlert(metric, current, previous, thresholds) {
        // Check absolute thresholds
        if (thresholds.min && current < thresholds.min) return true
        if (thresholds.max && current > thresholds.max) return true
        
        // Check relative changes (>20% change)
        if (previous && Math.abs(current - previous) / previous > 0.2) return true
        
        return false
    }
    
    createAlert(metric, current, previous, thresholds) {
        const change = previous ? ((current - previous) / previous * 100).toFixed(1) : 0
        const direction = change > 0 ? 'increased' : 'decreased'
        
        return {
            metric: metric,
            current: current,
            previous: previous,
            change: Math.abs(change),
            direction: direction,
            severity: this.calculateSeverity(metric, current, thresholds),
            message: this.generateAlertMessage(metric, current, change, direction),
            timestamp: new Date().toISOString()
        }
    }
    
    calculateSeverity(metric, value, thresholds) {
        const criticalMetrics = ['errorRate', 'loadTime']
        
        if (criticalMetrics.includes(metric)) {
            return 'critical'
        }
        
        if (thresholds.max && value > thresholds.max * 1.5) return 'critical'
        if (thresholds.min && value < thresholds.min * 0.5) return 'critical'
        
        return 'warning'
    }
    
    generateAlertMessage(metric, current, change, direction) {
        const metricNames = {
            conversionRate: 'Conversion Rate',
            bounceRate: 'Bounce Rate', 
            errorRate: 'Error Rate',
            loadTime: 'Page Load Time'
        }
        
        const metricName = metricNames[metric] || metric
        const unit = metric === 'loadTime' ? 'ms' : '%'
        
        return `🚨 ${metricName} Alert: ${direction} by ${change}% to ${current}${unit}`
    }
    
    async sendAlert(alert) {
        // Send to Slack
        if (this.alertChannels.slack) {
            await this.sendSlackAlert(alert)
        }
        
        // Send email for critical alerts
        if (alert.severity === 'critical' && this.alertChannels.email) {
            await this.sendEmailAlert(alert)
        }
        
        // Log alert
        console.log(`ALERT: ${alert.message}`)
    }
    
    async sendSlackAlert(alert) {
        const payload = {
            text: alert.message,
            attachments: [{
                color: alert.severity === 'critical' ? 'danger' : 'warning',
                fields: [
                    {
                        title: 'Current Value',
                        value: alert.current,
                        short: true
                    },
                    {
                        title: 'Change',
                        value: `${alert.change}% ${alert.direction}`,
                        short: true
                    },
                    {
                        title: 'Severity',
                        value: alert.severity,
                        short: true
                    }
                ],
                footer: 'Analytics Alert System',
                ts: Math.floor(new Date(alert.timestamp).getTime() / 1000)
            }]
        }
        
        try {
            await fetch(this.alertChannels.slack, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
        } catch (error) {
            console.error('Failed to send Slack alert:', error)
        }
    }
    
    async sendEmailAlert(alert) {
        // Implementation depends on your email service
        console.log('Would send email alert:', alert)
    }
}

export default AlertSystem
