#!/bin/bash
# Git Commit Script for Onyx Transportation App
# This script commits and pushes all recent changes

echo "=== Onyx Transportation App - Git Commit Script ==="
echo ""

# Navigate to project directory
cd "Aircrew transportation app" || exit

echo "Current directory: $(pwd)"
echo ""

# Check git status
echo "Checking git status..."
git status --short
echo ""

# Add all modified and new files (excluding ignored files)
echo "Adding files to staging..."

# Add modified files
git add .gitignore
git add src/components/DriverDashboard.tsx
git add src/components/TripList.tsx
git add src/main.tsx
git add src/utils/flightStatus.ts
git add src/utils/flightStatusConfig.ts
git add src/utils/flightStatusDebug.ts

# Add new documentation files
git add API_KEY_SECURITY_WARNING.md
git add LOCAL_API_KEY_SETUP.md

# Add config example file (but NOT the actual apiKey.local.ts which is gitignored)
git add src/config/apiKey.local.ts.example

echo "Files staged successfully!"
echo ""

# Show what will be committed
echo "Files to be committed:"
git status --short
echo ""

# Ask for confirmation
read -p "Do you want to commit these changes? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Commit cancelled."
    exit 1
fi

# Get commit message
echo ""
read -p "Enter commit message (or press Enter for default): " commitMessage

if [ -z "$commitMessage" ]; then
    commitMessage="Add flight status date filtering, API key security improvements, and debugging utilities"
fi

# Commit changes
echo ""
echo "Committing changes..."
git commit -m "$commitMessage"

if [ $? -eq 0 ]; then
    echo "Commit successful!"
    echo ""
    
    # Ask about pushing
    read -p "Do you want to push to GitHub? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Pushing to GitHub..."
        git push origin main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "=== Success! Changes pushed to GitHub ==="
        else
            echo ""
            echo "Push failed. Check your git remote and permissions."
        fi
    else
        echo "Changes committed locally. Push manually when ready."
    fi
else
    echo "Commit failed. Check for errors above."
fi

echo ""
