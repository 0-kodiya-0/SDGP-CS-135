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
  - [Code Review Process](#code-review-process)
    - [Review Requirements](#review-requirements)
    - [Review Guidelines](#review-guidelines)
  - [Commit Guidelines](#commit-guidelines)
    - [Commit Message Template](#commit-message-template)
    - [Template Setup](#template-setup)
    - [Commit Structure](#commit-structure)
  - [Pull Request Process](#pull-request-process)
    - [PR Requirements](#pr-requirements)
    - [PR Title Format](#pr-title-format)
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

### Template Setup

```bash
# Create template file
printf "# Title: Summary, imperative, start upper case, don't end with a period\n# No more than 50 chars. #### 50 chars is here:  #\n\n# Remember blank line between title and body.\n\n# Body: Explain *what* and *why* (not *how*). Include task ID (Jira issue).\n# Wrap at 72 chars. ################################## which is here:  #\n\n\n# At the end: Include Co-authored-by for all contributors. \n# Include at least one empty line before it. Format: \n# Co-authored-by: name <user@users.noreply.github.com>\n" > ~/.gitmessage

# Configure Git
git config --global commit.template ~/.gitmessage
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

2. **Scope** (optional):

```
feat(auth): add OAuth support
```

3. **Subject**:
   - Imperative mood
   - No period
   - Under 50 characters
   - Capitalize first letter

4. **Body** (optional):
   - Explain what and why
   - 72 character wrap
   - Blank line after subject

5. **Footer** (optional):
   - Reference issues
   - Note breaking changes
   - List co-authors

## Pull Request Process

### PR Requirements

1. Documentation updates
2. Style guideline compliance
3. Test coverage
4. Changelog updates

### PR Title Format

```
[type]: Brief description

Examples:
feat: add new feature
fix: resolve bug
docs: update documentation
```

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
