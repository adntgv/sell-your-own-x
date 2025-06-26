#!/usr/bin/env node

/**
 * Tutorial Structure Validation Script
 * Validates that all tutorials follow the required structure and standards
 */

const fs = require('fs');
const path = require('path');

class TutorialValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.tutorialCount = 0;
        
        this.requiredSections = [
            '## 🎯 Problem Statement',
            '## 💡 Solution Overview',
            '## 🛠️ Implementation Guide',
            '## 📊 Measuring Results',
            '## 🚀 Advanced Concepts',
            '## 📈 Real-World Case Study',
            '## 🔧 Troubleshooting',
            '## 📚 Additional Resources',
            '## 🎯 Next Steps'
        ];
        
        this.requiredMetadata = [
            'Difficulty:',
            'Time Required:',
            'Prerequisites:',
            'What You\'ll Build:',
            'Skills Learned:'
        ];
    }
    
    async validateAllTutorials() {
        console.log('🔍 Starting tutorial validation...\n');
        
        const tutorialsDir = path.join(process.cwd(), 'tutorials');
        
        if (!fs.existsSync(tutorialsDir)) {
            this.addError('Tutorials directory not found');
            return this.generateReport();
        }
        
        await this.scanTutorialDirectory(tutorialsDir);
        return this.generateReport();
    }
    
    async scanTutorialDirectory(dir, basePath = '') {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const itemPath = path.join(dir, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                const currentPath = basePath ? `${basePath}/${item}` : item;
                
                // Check if this directory contains a README.md (tutorial)
                const readmePath = path.join(itemPath, 'README.md');
                if (fs.existsSync(readmePath)) {
                    await this.validateTutorial(readmePath, currentPath);
                } else {
                    // Recursively scan subdirectories
                    await this.scanTutorialDirectory(itemPath, currentPath);
                }
            }
        }
    }
    
    async validateTutorial(readmePath, tutorialPath) {
        this.tutorialCount++;
        console.log(`📖 Validating: ${tutorialPath}`);
        
        try {
            const content = fs.readFileSync(readmePath, 'utf8');
            const tutorialDir = path.dirname(readmePath);
            
            // Validate content structure
            this.validateTutorialStructure(content, tutorialPath);
            
            // Validate metadata
            this.validateTutorialMetadata(content, tutorialPath);
            
            // Validate supporting files
            this.validateSupportingFiles(tutorialDir, tutorialPath);
            
            // Validate code examples
            this.validateCodeExamples(content, tutorialDir, tutorialPath);
            
            console.log(`✅ ${tutorialPath} - Structure validation complete`);
            
        } catch (error) {
            this.addError(`Failed to validate ${tutorialPath}: ${error.message}`);
        }
    }
    
    validateTutorialStructure(content, tutorialPath) {
        // Check for required sections
        for (const section of this.requiredSections) {
            if (!content.includes(section)) {
                this.addError(`${tutorialPath}: Missing required section "${section}"`);
            }
        }
        
        // Check for title structure
        const lines = content.split('\n');
        const firstLine = lines[0];
        if (!firstLine.startsWith('# ') || !firstLine.includes('Your Own')) {
            this.addWarning(`${tutorialPath}: Title should follow "Build/Create Your Own X" format`);
        }
        
        // Check for proper heading hierarchy
        this.validateHeadingHierarchy(content, tutorialPath);
        
        // Check for code block formatting
        this.validateCodeBlocks(content, tutorialPath);
    }
    
    validateTutorialMetadata(content, tutorialPath) {
        for (const metadata of this.requiredMetadata) {
            if (!content.includes(metadata)) {
                this.addError(`${tutorialPath}: Missing required metadata "${metadata}"`);
            }
        }
        
        // Validate difficulty levels
        const difficultyMatch = content.match(/\*\*Difficulty:\*\* (Beginner|Intermediate|Advanced)/);
        if (!difficultyMatch) {
            this.addError(`${tutorialPath}: Invalid or missing difficulty level`);
        }
        
        // Validate time estimate format
        const timeMatch = content.match(/\*\*Time Required:\*\* \d+(-\d+)? hours?/);
        if (!timeMatch) {
            this.addWarning(`${tutorialPath}: Time estimate should follow format "X hours" or "X-Y hours"`);
        }
    }
    
    validateSupportingFiles(tutorialDir, tutorialPath) {
        const expectedDirs = ['code', 'assets'];
        const optionalFiles = ['docker-compose.yml', 'RESULTS.md'];
        
        // Check for code directory
        const codeDir = path.join(tutorialDir, 'code');
        if (!fs.existsSync(codeDir)) {
            this.addWarning(`${tutorialPath}: Missing 'code' directory for working examples`);
        }
        
        // Check for Docker environment
        const dockerCompose = path.join(tutorialDir, 'docker-compose.yml');
        if (!fs.existsSync(dockerCompose)) {
            this.addWarning(`${tutorialPath}: Missing docker-compose.yml for reproducible environment`);
        }
        
        // Check for results documentation
        const resultsFile = path.join(tutorialDir, 'RESULTS.md');
        if (!fs.existsSync(resultsFile)) {
            this.addWarning(`${tutorialPath}: Missing RESULTS.md for expected outcomes`);
        }
    }
    
    validateCodeExamples(content, tutorialDir, tutorialPath) {
        // Find code blocks
        const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
        
        if (codeBlocks.length === 0) {
            this.addWarning(`${tutorialPath}: No code examples found`);
            return;
        }
        
        // Validate JavaScript code blocks
        const jsBlocks = codeBlocks.filter(block => 
            block.includes('```javascript') || block.includes('```js')
        );
        
        for (const block of jsBlocks) {
            const code = block.replace(/```(javascript|js)?\n?/, '').replace(/```$/, '');
            
            try {
                // Basic syntax validation (doesn't execute)
                new Function(code);
            } catch (error) {
                this.addError(`${tutorialPath}: JavaScript syntax error in code block`);
            }
        }
        
        // Check if code files exist for complex examples
        if (codeBlocks.length > 3) {
            const codeDir = path.join(tutorialDir, 'code');
            if (!fs.existsSync(codeDir)) {
                this.addWarning(`${tutorialPath}: Complex tutorial should have separate code files`);
            }
        }
    }
    
    validateHeadingHierarchy(content, tutorialPath) {
        const lines = content.split('\n');
        let currentLevel = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const headingMatch = line.match(/^(#{1,6})\s/);
            
            if (headingMatch) {
                const level = headingMatch[1].length;
                
                if (level > currentLevel + 1) {
                    this.addWarning(`${tutorialPath}: Heading hierarchy skip at line ${i + 1}`);
                }
                
                currentLevel = level;
            }
        }
    }
    
    validateCodeBlocks(content, tutorialPath) {
        const lines = content.split('\n');
        let inCodeBlock = false;
        let codeBlockStart = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.startsWith('```')) {
                if (inCodeBlock) {
                    // End of code block
                    inCodeBlock = false;
                    
                    // Check if code block is too long (>50 lines)
                    if (i - codeBlockStart > 50) {
                        this.addWarning(`${tutorialPath}: Very long code block at line ${codeBlockStart + 1} (consider splitting)`);
                    }
                } else {
                    // Start of code block
                    inCodeBlock = true;
                    codeBlockStart = i;
                    
                    // Check for language specification
                    if (line === '```') {
                        this.addWarning(`${tutorialPath}: Code block without language specification at line ${i + 1}`);
                    }
                }
            }
        }
        
        if (inCodeBlock) {
            this.addError(`${tutorialPath}: Unclosed code block starting at line ${codeBlockStart + 1}`);
        }
    }
    
    addError(message) {
        this.errors.push(message);
        console.log(`❌ ${message}`);
    }
    
    addWarning(message) {
        this.warnings.push(message);
        console.log(`⚠️  ${message}`);
    }
    
    generateReport() {
        console.log('\n📊 Validation Report');
        console.log('==================');
        console.log(`Tutorials validated: ${this.tutorialCount}`);
        console.log(`Errors: ${this.errors.length}`);
        console.log(`Warnings: ${this.warnings.length}`);
        
        if (this.errors.length > 0) {
            console.log('\n❌ Errors:');
            this.errors.forEach(error => console.log(`  • ${error}`));
        }
        
        if (this.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            this.warnings.forEach(warning => console.log(`  • ${warning}`));
        }
        
        const hasIssues = this.errors.length > 0 || this.warnings.length > 0;
        
        if (!hasIssues) {
            console.log('\n✅ All tutorials pass validation!');
        }
        
        // Exit with error code if there are errors (warnings are OK)
        if (this.errors.length > 0) {
            process.exit(1);
        }
        
        return {
            tutorialCount: this.tutorialCount,
            errors: this.errors,
            warnings: this.warnings,
            passed: this.errors.length === 0
        };
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new TutorialValidator();
    validator.validateAllTutorials();
}

module.exports = TutorialValidator;