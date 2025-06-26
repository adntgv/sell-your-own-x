// src/emailService.js
const axios = require('axios');

class EmailService {
    constructor() {
        this.apiKey = process.env.CONVERTKIT_API_KEY;
        this.apiSecret = process.env.CONVERTKIT_API_SECRET;
        this.baseURL = 'https://api.convertkit.com/v3';
    }

    // Add subscriber with tags and custom fields
    async addSubscriber(email, firstName, tags = [], customFields = {}) {
        try {
            const response = await axios.post(`${this.baseURL}/forms/YOUR_FORM_ID/subscribe`, {
                api_key: this.apiKey,
                email: email,
                first_name: firstName,
                tags: tags,
                fields: customFields
            });

            return {
                success: true,
                subscriberId: response.data.subscription.subscriber.id,
                data: response.data
            };
        } catch (error) {
            console.error('ConvertKit API Error:', error.response?.data);
            return {
                success: false,
                error: error.response?.data || error.message
            };
        }
    }

    // Add tags to subscriber (for behavioral triggers)
    async addTagsToSubscriber(subscriberId, tags) {
        try {
            const tagPromises = tags.map(tag => 
                axios.post(`${this.baseURL}/tags`, {
                    api_secret: this.apiSecret,
                    tag: {
                        name: tag,
                        subscriber: {
                            id: subscriberId
                        }
                    }
                })
            );

            await Promise.all(tagPromises);
            return { success: true };
        } catch (error) {
            console.error('Tag addition error:', error);
            return { success: false, error: error.message };
        }
    }

    // Remove tags (for sequence progression)
    async removeTagsFromSubscriber(subscriberId, tags) {
        try {
            const removePromises = tags.map(tag =>
                axios.delete(`${this.baseURL}/subscribers/${subscriberId}/tags/${tag}`, {
                    params: { api_secret: this.apiSecret }
                })
            );

            await Promise.all(removePromises);
            return { success: false, error: error.message };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Get subscriber data for personalization
    async getSubscriber(subscriberId) {
        try {
            const response = await axios.get(`${this.baseURL}/subscribers/${subscriberId}`, {
                params: { api_secret: this.apiSecret }
            });

            return {
                success: true,
                subscriber: response.data.subscriber
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Send broadcast email to segment
    async sendBroadcast(subject, content, tags = []) {
        try {
            const response = await axios.post(`${this.baseURL}/broadcasts`, {
                api_secret: this.apiSecret,
                subject: subject,
                content: content,
                tags: tags
            });

            return {
                success: true,
                broadcastId: response.data.broadcast.id
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = EmailService;
