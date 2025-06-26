// src/userService.js
const { Pool } = require('pg');

class UserService {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL
        });
        this.initializeDatabase();
    }

    async initializeDatabase() {
        const client = await this.pool.connect();
        try {
            // Create users table
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    convertkit_id INTEGER,
                    first_name VARCHAR(100),
                    signup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    trial_started_at TIMESTAMP,
                    trial_ended_at TIMESTAMP,
                    subscription_status VARCHAR(50) DEFAULT 'free',
                    last_login TIMESTAMP,
                    company_size VARCHAR(50),
                    use_case VARCHAR(100),
                    tech_stack TEXT[]
                )
            `);

            // Create events table for behavior tracking
            await client.query(`
                CREATE TABLE IF NOT EXISTS user_events (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    event_type VARCHAR(100) NOT NULL,
                    event_data JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create email_campaigns table
            await client.query(`
                CREATE TABLE IF NOT EXISTS email_campaigns (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    campaign_type VARCHAR(100) NOT NULL,
                    sequence_step INTEGER DEFAULT 1,
                    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    opened_at TIMESTAMP,
                    clicked_at TIMESTAMP,
                    status VARCHAR(50) DEFAULT 'sent'
                )
            `);

        } finally {
            client.release();
        }
    }

    // Track user events for behavioral triggers
    async trackEvent(userId, eventType, eventData = {}) {
        const client = await this.pool.connect();
        try {
            await client.query(
                'INSERT INTO user_events (user_id, event_type, event_data) VALUES ($1, $2, $3)',
                [userId, eventType, JSON.stringify(eventData)]
            );

            // Trigger automation based on event
            await this.checkAutomationTriggers(userId, eventType, eventData);

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            client.release();
        }
    }

    // Check if user action should trigger email automation
    async checkAutomationTriggers(userId, eventType, eventData) {
        const triggers = {
            'trial_started': () => this.triggerTrialSequence(userId),
            'feature_explored': (data) => this.triggerFeatureEducation(userId, data.feature),
            'trial_day_3': () => this.triggerMidTrialCheck(userId),
            'trial_day_7': () => this.triggerTrialEndingSoon(userId),
            'trial_ended': () => this.triggerTrialConversion(userId),
            'payment_failed': () => this.triggerPaymentRetry(userId),
            'cancelled_subscription': () => this.triggerWinback(userId)
        };

        const trigger = triggers[eventType];
        if (trigger) {
            await trigger(eventData);
        }
    }

    // Get user segmentation data
    async getUserSegment(userId) {
        const client = await this.pool.connect();
        try {
            const userResult = await client.query(
                'SELECT * FROM users WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0) {
                return null;
            }

            const user = userResult.rows[0];

            // Get recent events for behavior analysis
            const eventsResult = await client.query(`
                SELECT event_type, event_data, created_at 
                FROM user_events 
                WHERE user_id = $1 
                ORDER BY created_at DESC 
                LIMIT 50
            `, [userId]);

            const events = eventsResult.rows;

            // Determine user segment
            const segment = this.calculateUserSegment(user, events);

            return {
                user,
                events,
                segment,
                tags: this.generateSegmentTags(segment, user, events)
            };

        } finally {
            client.release();
        }
    }

    calculateUserSegment(user, events) {
        const segments = [];

        // Company size segmentation
        if (user.company_size === 'solo') segments.push('solo-developer');
        else if (user.company_size === 'startup') segments.push('startup-team');
        else if (user.company_size === 'enterprise') segments.push('enterprise');

        // Engagement level
        const recentEvents = events.filter(e => 
            new Date(e.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );

        if (recentEvents.length > 10) segments.push('high-engagement');
        else if (recentEvents.length > 3) segments.push('medium-engagement');
        else segments.push('low-engagement');

        // Use case segmentation
        if (user.use_case) segments.push(`usecase-${user.use_case}`);

        // Trial stage
        if (user.trial_started_at) {
            const trialDays = Math.floor(
                (Date.now() - new Date(user.trial_started_at)) / (1000 * 60 * 60 * 24)
            );
            if (trialDays <= 3) segments.push('trial-early');
            else if (trialDays <= 7) segments.push('trial-mid');
            else if (trialDays <= 14) segments.push('trial-late');
        }

        return segments;
    }

    generateSegmentTags(segments, user, events) {
        const tags = [...segments];

        // Add behavioral tags
        const featureEvents = events.filter(e => e.event_type === 'feature_used');
        const features = [...new Set(featureEvents.map(e => e.event_data.feature))];
        features.forEach(feature => tags.push(`uses-${feature}`));

        // Add timing tags
        const daysSinceSignup = Math.floor(
            (Date.now() - new Date(user.signup_date)) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceSignup <= 1) tags.push('new-user');
        else if (daysSinceSignup <= 7) tags.push('recent-user');
        else tags.push('established-user');

        return tags;
    }
}

module.exports = UserService;
