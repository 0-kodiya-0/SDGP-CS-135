# Git Operations Guide

## Table of Contents

- [Git Operations Guide](#git-operations-guide)
  - [Table of Contents](#table-of-contents)
  - [Basic Operations](#basic-operations)
    - [Daily Commands](#daily-commands)
    - [Branch vs Fork](#branch-vs-fork)
  - [Branch Management](#branch-management)
    - [Branch Types](#branch-types)
    - [Branch Operations](#branch-operations)
  - [Backup Strategy](#backup-strategy)
    - [Create Backup](#create-backup)
    - [Restore Backup](#restore-backup)
  - [Collaboration Flow](#collaboration-flow)
    - [Update From Main](#update-from-main)
    - [Handle Conflicts](#handle-conflicts)
  - [Advanced Operations](#advanced-operations)
    - [Stashing](#stashing)
    - [Undo Operations](#undo-operations)
    - [Cherry Pick](#cherry-pick)
  - [Troubleshooting](#troubleshooting)
    - [Never Do These](#never-do-these)
    - [Safety Guidelines](#safety-guidelines)
    - [Commit Message Format](#commit-message-format)
    - [Recovery Commands](#recovery-commands)

## Basic Operations

### Daily Commands

```bash
# Check status and history
git status
git log --oneline

# Stage and commit
git add [file-name]  # Specific files
git add .            # All changes
git commit -m "Your message"
```

### Branch vs Fork

- **Branches**: Use when you're a core team member with repository access
- **Forks**: Use when you're an external contributor without direct access

## Branch Management

### Branch Types

```
type/description-in-kebab-case

- feature/   (new features)
- bugfix/    (bug fixes)
- hotfix/    (urgent fixes)
- refactor/  (code improvements)
- design/    (UI/UX changes)
- docs/      (documentation)
```

### Branch Operations

```bash
# Create new branch
git checkout main
git pull origin main
git checkout -b feature/name

# Update branch
git checkout main
git pull
git checkout feature/name
git rebase main

# Complete branch
git branch -d feature/name
git push origin --delete feature/name
```

## Backup Strategy

### Create Backup

```bash
# Create and push backup
git checkout -b backup/YYYYMMDD-description
git push origin backup/YYYYMMDD-description
```

### Restore Backup

```bash
# List and restore
git branch | grep backup
git checkout backup/YYYYMMDD-description

# Restore specific files
git checkout backup/YYYYMMDD-description -- path/to/file
```

## Collaboration Flow

### Update From Main

```bash
# Preferred method (rebase)
git checkout your-branch
git rebase main

# Alternative (merge)
git merge main
```

### Handle Conflicts

```bash
# During conflicts
git status                 # Check files
# Fix conflicts manually
git add resolved-files
git rebase --continue      # If rebasing
git merge --continue       # If merging
```

## Advanced Operations

### Stashing

```bash
git stash save "description"
git stash list
git stash pop
git stash apply stash@{n}
```

### Undo Operations

```bash
# Keep changes
git reset --soft HEAD^

# Remove changes
git reset --hard HEAD^

# Revert public commits
git revert commit-hash
```

### Cherry Pick

```bash
git cherry-pick commit-hash
```

## Troubleshooting

### Never Do These

1. Force push to main: `git push --force origin main`
2. Rebase public branches
3. Delete branches without backup
4. Commit directly to main

### Safety Guidelines

1. Create backups before risky operations
2. Verify branch before committing
3. Review changes before pushing
4. Test after resolving conflicts

### Commit Message Format

```
Add feature X to improve Y                  

Longer description of why this change is needed
and what problem it solves. Include context    
and any important details.

Co-authored-by: Name <email/username>  
```

### Recovery Commands

```bash
# Undo staged changes
git reset HEAD file-name

# Undo unstaged changes
git checkout -- file-name

# List and recover stashed work
git stash list
git stash pop
```

---
