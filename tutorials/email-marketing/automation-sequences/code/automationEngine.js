// src/automationEngine.js
const EmailService = require('./emailService');
const UserService = require('./userService');
const EmailTemplates = require('./emailTemplates');

class AutomationEngine {
    constructor() {
        this.emailService = new EmailService();
        this.userService = new UserService();
        this.templates = new EmailTemplates();
        
        // Start background processes
        this.startScheduledJobs();
    }

    // Process behavioral triggers
    async processTrigger(userId, triggerType, data = {}) {
        try {
            const userSegment = await this.userService.getUserSegment(userId);
            if (!userSegment) return;

            const { user, segment, tags, events } = userSegment;

            switch (triggerType) {
                case 'welcome':
                    await this.sendWelcomeEmail(user, segment);
                    break;
                
                case 'trial_started':
                    await this.startTrialSequence(user, segment);
                    break;
                
                case 'feature_explored':
                    await this.sendFeatureEducation(user, data.feature, segment);
                    break;
                
                case 'inactivity':
                    await this.sendReengagementEmail(user, segment, data.daysSinceLastActivity);
                    break;
                
                case 'trial_ending':
                    await this.sendTrialEndingEmail(user, segment);
                    break;
            }

            // Update ConvertKit tags
            if (user.convertkit_id) {
                await this.emailService.addTagsToSubscriber(user.convertkit_id, tags);
            }

        } catch (error) {
            console.error('Automation processing error:', error);
        }
    }

    async sendWelcomeEmail(user, segment) {
        const template = this.templates.getWelcomeSequence(segment[0]);
        const personalizedContent = this.personalizeContent(template.content, user);

        // Send via ConvertKit
        const result = await this.emailService.sendBroadcast(
            template.subject,
            personalizedContent,
            [`welcome-${segment[0]}`]
        );

        // Track in database
        if (result.success) {
            await this.trackEmailSent(user.id, 'welcome', 1);
        }

        return result;
    }

    async startTrialSequence(user, segment) {
        // Schedule trial sequence emails
        const schedules = [
            { step: 1, delay: 0 },        // Immediate
            { step: 1, delay: 3 * 24 },   // Day 3
            { step: 1, delay: 7 * 24 },   // Day 7
            { step: 1, delay: 12 * 24 },  // Day 12
            { step: 1, delay: 15 * 24 }   // Day 15
        ];

        for (const schedule of schedules) {
            setTimeout(async () => {
                await this.sendTrialSequenceEmail(user, segment, schedule.step);
            }, schedule.delay * 60 * 60 * 1000); // Convert to milliseconds
        }
    }

    async sendTrialSequenceEmail(user, segment, step) {
        // Get user's latest events for personalization
        const userSegment = await this.userService.getUserSegment(user.id);
        const template = this.templates.getTrialSequence(step, segment[0], userSegment.events);
        
        const personalizedContent = this.personalizeContent(template.content, user);

        const result = await this.emailService.sendBroadcast(
            template.subject,
            personalizedContent,
            [`trial-step-${step}`, ...segment]
        );

        if (result.success) {
            await this.trackEmailSent(user.id, 'trial-sequence', step);
        }

        return result;
    }

    personalizeContent(content, user) {
        return content
            .replace(/{{first_name}}/g, user.first_name || 'there')
            .replace(/{{company_size}}/g, user.company_size || 'team')
            .replace(/{{use_case}}/g, user.use_case || 'development');
    }

    async trackEmailSent(userId, campaignType, sequenceStep) {
        const client = await this.userService.pool.connect();
        try {
            await client.query(`
                INSERT INTO email_campaigns (user_id, campaign_type, sequence_step) 
                VALUES ($1, $2, $3)
            `, [userId, campaignType, sequenceStep]);
        } finally {
            client.release();
        }
    }

    // Scheduled jobs for time-based automation
    startScheduledJobs() {
        // Run every hour
        setInterval(() => {
            this.processScheduledEmails();
        }, 60 * 60 * 1000);

        // Daily job for engagement analysis
        setInterval(() => {
            this.analyzeUserEngagement();
        }, 24 * 60 * 60 * 1000);
    }

    async processScheduledEmails() {
        // Check for users who need scheduled emails
        const client = await this.userService.pool.connect();
        try {
            // Find users who started trial 3 days ago
            const trialDay3Users = await client.query(`
                SELECT * FROM users 
                WHERE trial_started_at::date = CURRENT_DATE - INTERVAL '3 days'
                AND id NOT IN (
                    SELECT user_id FROM email_campaigns 
                    WHERE campaign_type = 'trial-sequence' AND sequence_step = 2
                )
            `);

            for (const user of trialDay3Users.rows) {
                await this.processTrigger(user.id, 'trial_day_3');
            }

            // Similar logic for other scheduled emails...

        } finally {
            client.release();
        }
    }
}

module.exports = AutomationEngine;
