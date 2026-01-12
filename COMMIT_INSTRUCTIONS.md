# Git Commit Instructions

## Quick Commit (PowerShell - Windows)

Run the provided script:
```powershell
.\commit-changes.ps1
```

## Quick Commit (Bash - Mac/Linux)

Make script executable and run:
```bash
chmod +x commit-changes.sh
./commit-changes.sh
```

## Manual Commit Steps

If you prefer to commit manually:

### 1. Stage Files
```bash
cd "Aircrew transportation app"

# Add modified files
git add .gitignore
git add src/components/DriverDashboard.tsx
git add src/components/TripList.tsx
git add src/main.tsx
git add src/utils/flightStatus.ts
git add src/utils/flightStatusConfig.ts
git add src/utils/flightStatusDebug.ts

# Add new documentation
git add API_KEY_SECURITY_WARNING.md
git add LOCAL_API_KEY_SETUP.md

# Add config example (template file)
git add src/config/apiKey.local.ts.example
```

### 2. Commit
```bash
git commit -m "Add flight status date filtering, API key security improvements, and debugging utilities"
```

### 3. Push
```bash
git push origin main
```

## Files Being Committed

### Modified Files:
- `.gitignore` - Added trans.env and *.env patterns
- `src/components/DriverDashboard.tsx` - Added date filtering for flight status
- `src/components/TripList.tsx` - Added date filtering for flight status
- `src/main.tsx` - Added flight status debug import
- `src/utils/flightStatus.ts` - Added date parameter and filtering
- `src/utils/flightStatusConfig.ts` - Updated test to use date
- `src/utils/flightStatusDebug.ts` - Updated debug to use date

### New Files:
- `API_KEY_SECURITY_WARNING.md` - Security documentation
- `LOCAL_API_KEY_SETUP.md` - Local API key setup guide
- `src/config/apiKey.local.ts.example` - Template for local API key

### Files NOT Committed (Gitignored):
- `trans.env` - Environment file (sensitive)
- `src/config/apiKey.local.ts` - Local API key file (sensitive)

## What This Commit Includes

1. **Flight Status Date Filtering**: Flight status now filters by pickup date to get the correct flight for that day
2. **API Key Security**: Documentation and setup guides for secure API key management
3. **Debugging Utilities**: Enhanced debugging tools for API issues
4. **Improved Error Handling**: Better 401 error handling and logging

## After Committing

1. AWS Amplify will automatically detect the push
2. It will trigger a new build
3. The new features will be deployed

## Verify Commit

After pushing, verify on GitHub:
```bash
git log --oneline -1
```

You should see your commit message in the history.
