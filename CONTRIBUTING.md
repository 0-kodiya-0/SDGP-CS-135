# Contributing to FusionSpace

## Table of Contents

- [Contributing to FusionSpace](#contributing-to-fusionspace)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Project Resources](#project-resources)
    - [Important Links](#important-links)
  - [Development Setup](#development-setup)
    - [Prerequisites](#prerequisites)
    - [Initial Setup](#initial-setup)
  - [Development Scripts](#development-scripts)
    - [Core Commands](#core-commands)
  - [Development Guidelines](#development-guidelines)
    - [Technology Stack](#technology-stack)
    - [Coding Standards](#coding-standards)
  - [Development Workflow](#development-workflow)
    - [Branch Strategy Options](#branch-strategy-options)
      - [1. Direct Branching (For Core Team Members)](#1-direct-branching-for-core-team-members)
      - [2. Fork and Branch](#2-fork-and-branch)
    - [Branch Naming Conventions](#branch-naming-conventions)
    - [Development Cycle Best Practices](#development-cycle-best-practices)
  - [Code Review Process](#code-review-process)
    - [Review Requirements](#review-requirements)
    - [Review Guidelines](#review-guidelines)
  - [Commit Guidelines](#commit-guidelines)
    - [Commit Message Template](#commit-message-template)
    - [Commit Structure](#commit-structure)
  - [Pull Request Process](#pull-request-process)
    - [PR Template](#pr-template)
  - [Issue Reporting](#issue-reporting)
    - [Bug Reports](#bug-reports)
    - [Feature Requests](#feature-requests)
  - [License](#license)

## Overview

Thank you for your interest in contributing to FusionSpace! This document provides comprehensive guidelines for contributing to our project.

## Project Resources

### Important Links

- [Project Setup Guide](./docs/setup.md)
- [Code Style Guide](./docs/style-guide.md)
- [API Documentation](./docs/api/README.md)
- [Database Schema](./docs/database/schema.md)
- [UI Components](./docs/user-interface/README.md)

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Git
- TypeScript knowledge

### Initial Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/FusionSpace.git
cd FusionSpace

# Install dependencies
npm install
```

## Development Scripts

### Core Commands

```bash
# Development Mode
npm start
# Starts Electron + dev server
# Enables hot reload
# Opens dev tools

# Package Application
npm run package
# Creates executables in 'out' directory
# Bundles without installers

# Create Installers
npm run make
# Builds platform-specific distributables
# Creates installation files

# Publish Release
npm run publish
# Packages and publishes
# Requires forge.config.js setup

# Code Linting
npm run lint
# ESLint checking
# Auto-fixes available issues
```

## Development Guidelines

### Technology Stack

- Electron
- React
- Webpack
- Babel
- TypeScript

### Coding Standards

1. TypeScript Usage:
   - Enable strict mode
   - Use interfaces
   - Avoid `any` type
   - Document complex types

2. Component Guidelines:
   - Functional components
   - React hooks
   - Error handling
   - Unit testing
   - Prop validation

3. Testing Requirements:
   - Unit tests
   - 80% code coverage
   - Jest + React Testing Library

## Development Workflow

### Branch Strategy Options

#### 1. Direct Branching (For Core Team Members)

Best for core team members with direct repository access.

```bash
# Clone the repository
git clone https://github.com/0-kodiya-0/SDGP-CS-135.git
cd SDGP-CS-135

# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/[feature-name]

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push changes
git push origin feature/[feature-name]
```

**When to use:**

- You're a core team member
- You have direct write access
- Working on immediate, time-sensitive features
- Collaborating closely with the team

#### 2. Fork and Branch

```bash
# 1. Fork repository (use GitHub UI)

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/SDGP-CS-135.git
cd SDGP-CS-135

# 3. Add upstream remote
git remote add upstream https://github.com/0-kodiya-0/SDGP-CS-135.git

# 4. Create feature branch
git checkout -b feature/[feature-name]

# 5. Keep fork updated
git fetch upstream
git checkout main
git merge upstream/main
git push origin main

# 6. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 7. Push to your fork
git push origin feature/[feature-name]
```

**When to use:**

- Working on large, independent features
- When you need isolated development

### Branch Naming Conventions

```bash
# Features
feature/user-authentication
feature/dark-mode

# Bug fixes
fix/login-error
fix/performance-issue

# Documentation
docs/api-guide
docs/setup-instructions

# Refactoring
refactor/database-queries
refactor/component-structure
```

### Development Cycle Best Practices

1. **Before Starting**

```bash
# For direct branching
git checkout main
git pull origin main

# For forked repository
git fetch upstream
git merge upstream/main
```

2. **During Development**

```bash
# Create branch with meaningful name
git checkout -b feature/descriptive-name

# Make small, focused commits
git commit -m "feat: add specific functionality"
```

3. 🔴 **Before Submitting** 🔴  <span style="color:red">  Danger zone, be carful  </span>

```bash
# Update with latest changes 
git fetch origin main
git rebase origin/main

# Test your changes
npm run test
npm run lint
```

## Code Review Process

### Review Requirements

1. Maintainer approval required
2. All comments resolved
3. CI checks passing
4. Documentation updated

### Review Guidelines

- Check code quality
- Verify test coverage
- Ensure documentation
- Validate performance
- Review security implications

## Commit Guidelines

### Commit Message Template

```
# Title: Summary, imperative, start upper case, don't end with a period
# No more than 50 chars. #### 50 chars is here:  #

# Remember blank line between title and body.

# Body: Explain *what* and *why* (not *how*). Include task ID (Jira issue).
# Wrap at 72 chars. ################################## which is here:  #

# At the end: Include Co-authored-by for all contributors.
```

### Commit Structure

1. **Type**:
   - `feat`: New feature
   - `fix`: Bug fix
   - `docs`: Documentation
   - `style`: Code style
   - `refactor`: Code restructuring
   - `perf`: Performance
   - `test`: Testing
   - `chore`: Maintenance

2. **Subject**:
   - Imperative mood
   - No period
   - Under 50 characters
   - Capitalize first letter

3. **Body**:
   - Explain what and why
   - 72 character wrap
   - Blank line after subject

4. **Footer**:
   - Reference issues
   - Note breaking changes
   - List co-authors

## Pull Request Process

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Other (specify)

## Testing
Describe testing steps

## Checklist
- [ ] Code follows guidelines
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Changelog updated
```

## Issue Reporting

### Bug Reports

```markdown
### Bug Description
Clear description of the bug

### Steps to Reproduce
1. Step 1
2. Step 2
3. ...

### Expected Behavior
What should happen

### Actual Behavior
What actually happens

### Environment
- OS:
- Node version:
- npm version:
- Browser (if applicable):
```

### Feature Requests

```markdown
### Feature Description
Clear description of proposed feature

### Problem It Solves
Explain the problem

### Proposed Solution
Your suggested implementation

### Alternative Solutions
Other considered approaches
```

## License

This project is licensed under the MIT License. By contributing, you agree to license your contributions under the same terms.

---
