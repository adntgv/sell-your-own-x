# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

"Sell Your Own X" is a comprehensive marketing education resource for developers and technical founders. It provides hands-on tutorials, step-by-step projects, and real examples that teach marketing by building and implementing it yourself — with the same philosophy as "Build Your Own X", but focused on customer acquisition, growth, and business development.

## Project Structure

```
├── tutorials/              # Core learning content organized by category
│   ├── product-marketing/  # Landing pages, value props, pricing
│   ├── growth-engineering/ # A/B testing, referrals, viral loops  
│   ├── analytics-tracking/ # Event tracking, dashboards, attribution
│   ├── email-marketing/    # Automation, segmentation, sequences
│   ├── content-marketing/  # SEO, automation, social integration
│   └── paid-acquisition/   # Campaign setup, tracking, optimization
├── tools/                  # Reusable templates, scripts, boilerplates
├── case-studies/          # Real-world implementations and results
├── community/             # Contribution guidelines and processes
├── docs/                  # Project documentation and architecture
└── framework/             # Content standards and quality guidelines
```

## Development Workflow

### Tutorial Development
- All tutorials follow the standardized template in `community/TUTORIAL_TEMPLATE.md`
- Each tutorial includes working code examples and Docker environments
- Implementation must be tested and results documented in `RESULTS.md`
- Use the content framework guidelines in `framework/content-framework.md`

### Quality Standards
- Code examples must be functional and tested
- Include comprehensive troubleshooting sections
- Provide real-world case studies and measurable outcomes
- Follow security best practices (no hardcoded secrets)
- Ensure mobile responsiveness and performance optimization

### Common Development Tasks

#### Adding a New Tutorial
```bash
# Use the tutorial template
cp community/TUTORIAL_TEMPLATE.md tutorials/[category]/[name]/README.md

# Create code structure
mkdir -p tutorials/[category]/[name]/{code,assets,templates}

# Add Docker environment
cp tools/templates/docker-compose.template.yml tutorials/[category]/[name]/docker-compose.yml
```

#### Testing Tutorial Implementation
```bash
cd tutorials/[category]/[name]
docker-compose up -d
# Follow tutorial steps to verify functionality
```

#### Setting Up Development Environment
```bash
# Install dependencies for scripts and tools
npm install  # For JavaScript-based tools
pip install -r requirements.txt  # For Python scripts

# Test all external links
npm run check-links

# Validate markdown formatting
npm run lint-docs
```

## Tool Integration

### Marketing APIs Used
- **ConvertKit**: Email automation and subscriber management
- **PostHog**: Analytics, A/B testing, and user tracking  
- **Webflow**: Landing page creation and optimization
- **Stripe**: Payment processing and conversion tracking

### Development Tools
- **Docker**: Reproducible tutorial environments
- **GitHub Actions**: Automated testing and link validation
- **Node.js/Python**: Automation scripts and setup tools

## Content Guidelines

### Tutorial Requirements
- Must include working code examples
- Docker environment for easy setup
- Clear prerequisites and learning objectives  
- Measurable success criteria and expected results
- Comprehensive troubleshooting section
- Real-world case study with actual metrics

### Writing Style
- Developer-friendly, technical but accessible
- Avoid marketing jargon and buzzwords
- Include specific examples and concrete metrics
- Focus on implementation over theory
- Provide actionable next steps

## Community Contribution

### Review Process
All contributions go through multi-stage review:
1. Automated checks (syntax, links, formatting)
2. Technical review (code functionality, security)
3. Educational review (clarity, learning value)
4. Community testing (for complex tutorials)

### Getting Started as Contributor
1. Read `community/CONTRIBUTING.md` for detailed guidelines
2. Check existing issues for tutorial requests
3. Use `community/TUTORIAL_TEMPLATE.md` for new content
4. Test implementations thoroughly before submission

## Architecture Notes

### Scalability Considerations
- Modular tutorial structure supports easy expansion
- Standardized templates ensure consistency
- Docker environments provide reproducibility
- Community-driven content creation model

### Performance Requirements
- Tutorial pages must load in <3 seconds
- All code examples must be production-ready
- Mobile-optimized responsive design required
- Analytics tracking for tutorial effectiveness

## Launch and Growth Strategy

### Success Metrics
- Tutorial completion rates and user satisfaction
- Community contributions and engagement
- Real-world implementation success stories
- Industry recognition and thought leadership

### Partnership Integration
- Collaborate with marketing tool APIs and documentation
- Cross-promote with developer education platforms
- Contribute to open source marketing tool projects
- Build relationships with developer community leaders