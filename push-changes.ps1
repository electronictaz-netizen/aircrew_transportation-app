# Quick Git Push Script
# Run this in PowerShell from the project directory

cd "C:\Users\ericd\app\Aircrew transportation app"

Write-Host "=== Staging Changes ===" -ForegroundColor Cyan
git add src/components/TripFilters.tsx
git add src/components/TripFilters.css

Write-Host "`n=== Files to be committed ===" -ForegroundColor Yellow
git status --short

Write-Host "`n=== Committing ===" -ForegroundColor Cyan
git commit -m "Add quick date filters (Today, This Week, Next Week) and show all trips by default"

Write-Host "`n=== Pushing to GitHub ===" -ForegroundColor Cyan
git push origin main

Write-Host "`n=== Done! ===" -ForegroundColor Green
