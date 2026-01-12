# Git Commit Script for Aircrew Transportation App
# This script commits and pushes all recent changes

Write-Host "=== Aircrew Transportation App - Git Commit Script ===" -ForegroundColor Cyan
Write-Host ""

# Navigate to project directory
$projectDir = "C:\Users\ericd\app\Aircrew transportation app"
Set-Location $projectDir

Write-Host "Current directory: $projectDir" -ForegroundColor Yellow
Write-Host ""

# Check git status
Write-Host "Checking git status..." -ForegroundColor Yellow
git status --short
Write-Host ""

# Add all modified and new files (excluding ignored files)
Write-Host "Adding files to staging..." -ForegroundColor Yellow

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

Write-Host "Files staged successfully!" -ForegroundColor Green
Write-Host ""

# Show what will be committed
Write-Host "Files to be committed:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Ask for confirmation
$response = Read-Host "Do you want to commit these changes? (y/n)"
if ($response -ne 'y' -and $response -ne 'Y') {
    Write-Host "Commit cancelled." -ForegroundColor Red
    exit
}

# Get commit message
Write-Host ""
Write-Host "Enter commit message (or press Enter for default):" -ForegroundColor Yellow
$commitMessage = Read-Host

if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Add flight status date filtering, API key security improvements, and debugging utilities"
}

# Commit changes
Write-Host ""
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "Commit successful!" -ForegroundColor Green
    Write-Host ""
    
    # Ask about pushing
    $pushResponse = Read-Host "Do you want to push to GitHub? (y/n)"
    if ($pushResponse -eq 'y' -or $pushResponse -eq 'Y') {
        Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "=== Success! Changes pushed to GitHub ===" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "Push failed. Check your git remote and permissions." -ForegroundColor Red
        }
    } else {
        Write-Host "Changes committed locally. Push manually when ready." -ForegroundColor Yellow
    }
} else {
    Write-Host "Commit failed. Check for errors above." -ForegroundColor Red
}

Write-Host ""
