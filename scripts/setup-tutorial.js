#!/usr/bin/env node

/**
 * Tutorial Setup Script
 * Creates a new tutorial with proper structure and boilerplate files
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class TutorialSetup {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.categories = [
            'product-marketing',
            'growth-engineering', 
            'analytics-tracking',
            'email-marketing',
            'content-marketing',
            'paid-acquisition'
        ];
        
        this.difficulties = ['Beginner', 'Intermediate', 'Advanced'];
    }
    
    async run() {
        console.log('🚀 Tutorial Setup Wizard\n');
        console.log('This script will help you create a new tutorial with proper structure.\n');
        
        try {
            const tutorialInfo = await this.collectTutorialInfo();
            await this.createTutorialStructure(tutorialInfo);
            console.log('\n✅ Tutorial setup complete!');
            console.log(`📁 Tutorial created at: tutorials/${tutorialInfo.category}/${tutorialInfo.slug}/`);
            console.log('\nNext steps:');
            console.log('1. Edit the README.md file with your content');
            console.log('2. Add working code examples to the code/ directory');
            console.log('3. Update docker-compose.yml for your specific requirements');
            console.log('4. Test your tutorial with: npm run validate');
        } catch (error) {
            console.error('❌ Setup failed:', error.message);
        } finally {
            this.rl.close();
        }
    }
    
    async collectTutorialInfo() {
        const info = {};
        
        // Tutorial title
        info.title = await this.ask('Tutorial title (e.g., "Build Your Own Referral System"): ');
        if (!info.title) throw new Error('Title is required');
        
        // Category
        console.log('\nAvailable categories:');
        this.categories.forEach((cat, index) => {
            console.log(`${index + 1}. ${cat}`);
        });
        
        const categoryIndex = await this.ask('Select category (1-6): ');
        const categoryNum = parseInt(categoryIndex);
        if (categoryNum < 1 || categoryNum > this.categories.length) {
            throw new Error('Invalid category selection');
        }
        info.category = this.categories[categoryNum - 1];
        
        // Generate slug from title
        info.slug = info.title
            .toLowerCase()
            .replace(/build your own /i, '')
            .replace(/create your own /i, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        
        // Difficulty
        console.log('\nDifficulty levels:');
        this.difficulties.forEach((diff, index) => {
            console.log(`${index + 1}. ${diff}`);
        });
        
        const diffIndex = await this.ask('Select difficulty (1-3): ');
        const diffNum = parseInt(diffIndex);
        if (diffNum < 1 || diffNum > this.difficulties.length) {
            throw new Error('Invalid difficulty selection');
        }
        info.difficulty = this.difficulties[diffNum - 1];
        
        // Time estimate
        info.timeRequired = await this.ask('Time required (e.g., "4-6 hours"): ');
        if (!info.timeRequired) throw new Error('Time estimate is required');
        
        // Prerequisites
        info.prerequisites = await this.ask('Prerequisites (e.g., "Basic JavaScript knowledge"): ');
        if (!info.prerequisites) throw new Error('Prerequisites are required');
        
        // What they'll build
        info.whatYoullBuild = await this.ask('What will users build? (brief description): ');
        if (!info.whatYoullBuild) throw new Error('Description is required');
        
        // Skills learned
        info.skillsLearned = await this.ask('Skills learned (e.g., "Referral tracking, user incentives"): ');
        if (!info.skillsLearned) throw new Error('Skills are required');
        
        // Problem description
        info.problemDescription = await this.ask('Problem this tutorial solves: ');
        if (!info.problemDescription) throw new Error('Problem description is required');
        
        return info;
    }
    
    async createTutorialStructure(info) {
        const tutorialPath = path.join('tutorials', info.category, info.slug);
        
        // Create directory structure
        const dirs = [
            tutorialPath,
            path.join(tutorialPath, 'code'),
            path.join(tutorialPath, 'code', 'src'),
            path.join(tutorialPath, 'assets'),
            path.join(tutorialPath, 'templates')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        // Create README.md from template
        const readmeContent = this.generateReadmeTemplate(info);
        fs.writeFileSync(path.join(tutorialPath, 'README.md'), readmeContent);
        
        // Create docker-compose.yml
        const dockerContent = this.generateDockerTemplate(info);
        fs.writeFileSync(path.join(tutorialPath, 'docker-compose.yml'), dockerContent);
        
        // Create RESULTS.md template
        const resultsContent = this.generateResultsTemplate(info);
        fs.writeFileSync(path.join(tutorialPath, 'RESULTS.md'), resultsContent);
        
        // Create basic code files
        const indexContent = this.generateIndexTemplate(info);
        fs.writeFileSync(path.join(tutorialPath, 'code', 'index.html'), indexContent);
        
        const packageContent = this.generatePackageTemplate(info);
        fs.writeFileSync(path.join(tutorialPath, 'code', 'package.json'), packageContent);
        
        console.log(`✅ Created tutorial structure at ${tutorialPath}`);
    }
    
    generateReadmeTemplate(info) {
        return `# ${info.title}

**Difficulty:** ${info.difficulty}  
**Time Required:** ${info.timeRequired}  
**Prerequisites:** ${info.prerequisites}  
**What You'll Build:** ${info.whatYoullBuild}  
**Skills Learned:** ${info.skillsLearned}  

## 🎯 Problem Statement

### The Challenge
${info.problemDescription}

### Why It Matters
[Explain the business impact and importance]

### Common Mistakes
[List common pitfalls and mistakes]

### Success Metrics
[Define measurable outcomes and KPIs]

## 💡 Solution Overview

### Our Approach
[Describe the high-level strategy]

### Tools We'll Use
[List the tools, technologies, and services]

### Expected Outcomes
[What users will achieve after completion]

## 🛠️ Implementation Guide

### Step 1: Environment Setup

#### Prerequisites Check
\`\`\`bash
# Add commands to verify prerequisites
\`\`\`

#### Project Initialization
\`\`\`bash
# Setup commands
\`\`\`

### Step 2: [Core Implementation]

[Add detailed implementation steps]

## 📊 Measuring Results

### Key Metrics
[Define what to measure]

### Analytics Setup
[How to track performance]

## 🚀 Advanced Concepts

### Optimization Techniques
[Advanced features and improvements]

### Integration Options
[How to connect with other tools]

## 📈 Real-World Case Study

**Company:** [Example company]  
**Challenge:** [Specific problem]  
**Implementation:** [How they used this tutorial]  
**Results:** [Actual outcomes and metrics]  

## 🔧 Troubleshooting

### Common Issues
[List potential problems and solutions]

## 📚 Additional Resources

### Documentation Links
[Relevant documentation and guides]

### Related Tutorials
[Links to complementary tutorials]

## 🎯 Next Steps

### Immediate Actions
[What to do after completing the tutorial]

### Advanced Implementations
[Ideas for extending the implementation]

---

**🌟 Built your ${info.title.toLowerCase()}? Share your results with the community!**
`;
    }
    
    generateDockerTemplate(info) {
        return `version: '3.8'

services:
  # Main application service
  app:
    image: node:18-alpine
    working_dir: /app
    ports:
      - "3000:3000"
    volumes:
      - ./code:/app
      - /app/node_modules
    command: >
      sh -c "
        npm install &&
        npm start
      "
    environment:
      - NODE_ENV=development
      - PORT=3000

  # Add additional services as needed for your tutorial
  # Example: database, redis, etc.
`;
    }
    
    generateResultsTemplate(info) {
        return `# ${info.title} - Expected Results

## Success Metrics and Benchmarks

### Primary Metrics
[Define the main KPIs and their target values]

### Implementation Success Criteria
[What indicates a successful implementation]

## Expected Outcomes

### Short-term Results (1-2 weeks)
[Immediate benefits and outcomes]

### Long-term Impact (1-3 months)
[Sustained improvements and growth]

## Performance Benchmarks

### Industry Standards
[Relevant industry benchmarks and comparisons]

### Optimization Targets
[Performance goals and optimization opportunities]

## Real-World Results

### Case Study Results
[Actual implementation results and metrics]

### Community Success Stories
[Examples from users who completed the tutorial]

## Troubleshooting Success

### Common Success Indicators
[Signs that the implementation is working correctly]

### Performance Monitoring
[How to track ongoing performance]

---

**📊 Share your results with the community by opening a discussion or pull request!**
`;
    }
    
    generateIndexTemplate(info) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${info.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: #f5f7fa;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
        }
        .status {
            text-align: center;
            padding: 20px;
            background: #e8f5e8;
            border-radius: 8px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${info.title}</h1>
        <div class="status">
            <h2>🚧 Tutorial Implementation</h2>
            <p>This is the working example for the ${info.title} tutorial.</p>
            <p>Follow the README.md instructions to build your implementation.</p>
        </div>
        
        <!-- Add your implementation here -->
        
    </div>
    
    <script>
        // Add your JavaScript implementation here
        console.log('${info.title} tutorial starting...');
    </script>
</body>
</html>`;
    }
    
    generatePackageTemplate(info) {
        const packageName = info.slug;
        return JSON.stringify({
            "name": packageName,
            "version": "1.0.0",
            "description": `Working example for ${info.title} tutorial`,
            "main": "index.html",
            "scripts": {
                "start": "live-server --port=3000 --host=localhost --open=/",
                "test": "echo 'Add tests for your implementation'"
            },
            "dependencies": {},
            "devDependencies": {
                "live-server": "^1.2.2"
            }
        }, null, 2);
    }
    
    async ask(question) {
        return new Promise(resolve => {
            this.rl.question(question, resolve);
        });
    }
}

// Run setup if called directly
if (require.main === module) {
    const setup = new TutorialSetup();
    setup.run().catch(console.error);
}

module.exports = TutorialSetup;
`;
    }
}