#!/usr/bin/env node

/**
 * Email Automation Setup Script
 * Quickly configure and deploy email automation system
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class EmailAutomationSetup {
    constructor() {
        this.config = {};
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async run() {
        console.log('🚀 Email Automation Setup Wizard\n');
        
        try {
            await this.collectConfiguration();
            await this.generateConfigFiles();
            await this.createDockerSetup();
            await this.generateSequenceTemplates();
            
            console.log('\n✅ Email automation system setup complete!');
            console.log('\nNext steps:');
            console.log('1. Review generated configuration files');
            console.log('2. Add your API keys to .env file');
            console.log('3. Run: docker-compose up -d');
            console.log('4. Test with: npm run test-automation\n');
            
        } catch (error) {
            console.error('❌ Setup failed:', error.message);
        } finally {
            this.rl.close();
        }
    }

    async collectConfiguration() {
        console.log('📝 Let\'s configure your email automation system:\n');
        
        this.config.productName = await this.ask('Product/Service name: ');
        this.config.companyName = await this.ask('Company name: ');
        this.config.fromName = await this.ask('From name (e.g., "Alex from DevTool"): ');
        this.config.fromEmail = await this.ask('From email address: ');
        this.config.convertKitFormId = await this.ask('ConvertKit Form ID: ');
        this.config.webhookUrl = await this.ask('Webhook URL (optional): ') || '';
        
        console.log('\n🎯 Target audience configuration:');
        this.config.primaryAudience = await this.ask('Primary audience (solo-developers/startup-teams/enterprise): ');
        this.config.useCase = await this.ask('Main use case (development-tools/saas/api-tools): ');
        
        console.log('\n⚙️  Technical configuration:');
        this.config.databaseUrl = await this.ask('Database URL (postgres://...): ');
        this.config.serverPort = await this.ask('Server port (default 3000): ') || '3000';
    }

    async generateConfigFiles() {
        console.log('\n📁 Generating configuration files...');
        
        // Generate .env file
        const envContent = `
# Email Automation Configuration
CONVERTKIT_API_KEY=your_api_key_here
CONVERTKIT_API_SECRET=your_api_secret_here
CONVERTKIT_FORM_ID=${this.config.convertKitFormId}

# Database
DATABASE_URL=${this.config.databaseUrl}

# Server
PORT=${this.config.serverPort}
NODE_ENV=development

# Email Configuration
FROM_NAME="${this.config.fromName}"
FROM_EMAIL=${this.config.fromEmail}
WEBHOOK_URL=${this.config.webhookUrl}

# Product Information
PRODUCT_NAME="${this.config.productName}"
COMPANY_NAME="${this.config.companyName}"
PRIMARY_AUDIENCE=${this.config.primaryAudience}
USE_CASE=${this.config.useCase}
        `.trim();

        fs.writeFileSync('.env.example', envContent);
        
        // Generate package.json
        const packageJson = {
            name: `${this.config.productName.toLowerCase().replace(/\s+/g, '-')}-email-automation`,
            version: "1.0.0",
            description: `Email automation system for ${this.config.productName}`,
            main: "src/app.js",
            scripts: {
                start: "node src/app.js",
                dev: "nodemon src/app.js",
                test: "jest",
                "test-automation": "node scripts/test-sequences.js",
                setup: "node scripts/database-setup.js"
            },
            dependencies: {
                express: "^4.18.2",
                axios: "^1.4.0",
                dotenv: "^16.0.3",
                pg: "^8.10.0",
                cors: "^2.8.5",
                "node-cron": "^3.0.2"
            },
            devDependencies: {
                nodemon: "^2.0.22",
                jest: "^29.5.0",
                supertest: "^6.3.3"
            }
        };

        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        console.log('✓ Generated package.json and .env.example');
    }

    async createDockerSetup() {
        const dockerCompose = `
version: '3.8'

services:
  email-automation:
    build: .
    ports:
      - "${this.config.serverPort}:${this.config.serverPort}"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - postgres
    volumes:
      - ./logs:/app/logs

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: email_automation
      POSTGRES_USER: automation_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
        `.trim();

        fs.writeFileSync('docker-compose.yml', dockerCompose);

        const dockerfile = `
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE ${this.config.serverPort}

CMD ["npm", "start"]
        `.trim();

        fs.writeFileSync('Dockerfile', dockerfile);
        console.log('✓ Generated Docker configuration');
    }

    async generateSequenceTemplates() {
        console.log('\n📧 Generating email sequence templates...');
        
        if (!fs.existsSync('templates')) {
            fs.mkdirSync('templates');
        }

        // Welcome sequence template
        const welcomeTemplate = {
            name: 'welcome-sequence',
            description: `Welcome sequence for ${this.config.productName}`,
            triggers: ['signup', 'trial_started'],
            emails: [
                {
                    step: 1,
                    delay: 0,
                    subject: `Welcome to ${this.config.productName}! Let's get you started 🚀`,
                    template: 'welcome-email-1',
                    segment: this.config.primaryAudience
                },
                {
                    step: 2,
                    delay: 24 * 60 * 60 * 1000, // 1 day
                    subject: `Quick question about your ${this.config.productName} experience`,
                    template: 'welcome-email-2',
                    segment: this.config.primaryAudience
                },
                {
                    step: 3,
                    delay: 3 * 24 * 60 * 60 * 1000, // 3 days
                    subject: `Here's how to get the most from ${this.config.productName}`,
                    template: 'welcome-email-3',
                    segment: this.config.primaryAudience
                }
            ]
        };

        fs.writeFileSync('templates/welcome-sequence.json', JSON.stringify(welcomeTemplate, null, 2));

        // Trial sequence template
        const trialTemplate = {
            name: 'trial-nurturing',
            description: `Trial nurturing sequence for ${this.config.productName}`,
            triggers: ['trial_started'],
            emails: [
                {
                    step: 1,
                    delay: 0,
                    subject: `Your ${this.config.productName} trial is live! Here's what to try first`,
                    template: 'trial-email-1'
                },
                {
                    step: 2,
                    delay: 3 * 24 * 60 * 60 * 1000,
                    subject: `Quick check-in on your ${this.config.productName} trial`,
                    template: 'trial-email-2'
                },
                {
                    step: 3,
                    delay: 7 * 24 * 60 * 60 * 1000,
                    subject: `One week left in your trial - let's make it count!`,
                    template: 'trial-email-3'
                },
                {
                    step: 4,
                    delay: 12 * 24 * 60 * 60 * 1000,
                    subject: `Your trial ends in 2 days - special offer inside`,
                    template: 'trial-email-4'
                }
            ]
        };

        fs.writeFileSync('templates/trial-sequence.json', JSON.stringify(trialTemplate, null, 2));

        // Generate email content templates
        const emailTemplates = {
            'welcome-email-1': {
                subject: `Welcome to ${this.config.productName}! Let's get you started 🚀`,
                html: `
                    <h1>Welcome to ${this.config.productName}!</h1>
                    <p>Hi {{first_name}},</p>
                    <p>Welcome to ${this.config.productName}! I'm excited to help you [main benefit].</p>
                    <p>Here's what I recommend you do first:</p>
                    <ol>
                        <li><strong>Step 1:</strong> [First action]</li>
                        <li><strong>Step 2:</strong> [Second action]</li>
                        <li><strong>Step 3:</strong> [Third action]</li>
                    </ol>
                    <p>Questions? Just reply to this email.</p>
                    <p>Best,<br>${this.config.fromName}</p>
                `,
                text: `Welcome to ${this.config.productName}! [Text version]`
            }
        };

        fs.writeFileSync('templates/email-content.json', JSON.stringify(emailTemplates, null, 2));
        console.log('✓ Generated email sequence templates');
    }

    async ask(question) {
        return new Promise(resolve => {
            this.rl.question(question, resolve);
        });
    }
}

// Run the setup wizard
if (require.main === module) {
    const setup = new EmailAutomationSetup();
    setup.run().catch(console.error);
}

module.exports = EmailAutomationSetup;