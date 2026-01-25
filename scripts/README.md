# Scripts

## snapshotGLSCompany.ts

Exports the **GLS Transportation** company and all related data to a JSON backup file. Use before making large changes (e.g. passenger-facing booking portal) so you can restore if something is overwritten.

### What it exports

- Company (GLS record)
- CompanyUser, Location, Trip, Driver, Vehicle, Customer
- FilterCategory, CustomField, CustomFieldValue
- ReportConfiguration, TripVehicle, VehicleLocation

All lists are paginated so nothing is skipped.

### Auth

- **Browser / existing session:** Run after using the app (e.g. with `ampx sandbox`), or ensure a valid Cognito session exists.
- **Node / CI:** Set `COGNITO_USER` and `COGNITO_PASSWORD`; the script will sign in before exporting.

### Usage

```bash
npm run snapshot-gls
```

Or:

```bash
npx ts-node --esm scripts/snapshotGLSCompany.ts
```

### Output

- **Path:** `scripts/backups/gls-snapshot-YYYY-MM-DDTHHmmss.json`
- **Format:** JSON with `exportedAt`, `companyId`, `company`, and arrays for each related model.

### Restore

A separate restore procedure is required to re-import from the JSON. This script only creates the snapshot.

---

## checkLambdaRuntimes.ts

Checks all Lambda functions in your AWS account for deprecated Node.js 18.x and 20.x runtimes and identifies functions that need to be updated to Node.js 22.x.

**Deprecated Runtimes:**
- Node.js 18.x (end of support)
- Node.js 20.x (end of life)

### Prerequisites

1. AWS credentials configured:
   - Via AWS CLI: `aws configure`
   - Via environment variables: `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
   - Via IAM role (if running on EC2/ECS)

2. Required permissions:
   - `lambda:ListFunctions`
   - `lambda:GetFunction`
   - `lambda:UpdateFunctionConfiguration` (only if using `--update` flag)

### Usage

#### Check functions (read-only):
```bash
npm run check-lambda
```

Or directly:
```bash
npx ts-node scripts/checkLambdaRuntimes.ts
```

#### Check specific region:
```bash
npx ts-node scripts/checkLambdaRuntimes.ts --region=us-east-1
```

#### Check and update functions automatically:
```bash
npm run check-lambda:update
```

Or directly:
```bash
npx ts-node scripts/checkLambdaRuntimes.ts --update
```

### What it does

1. Scans multiple AWS regions for Lambda functions
2. Identifies functions using Node.js 18.x (end of support) or 20.x (end of life) runtimes
3. Groups functions by deprecated runtime for easy identification
4. Highlights Amplify-related functions
5. Optionally updates functions to Node.js 22.x (with `--update` flag)

### Output

The script provides:
- List of all Lambda functions found
- Functions using deprecated Node.js 20.x runtime
- Summary of functions needing updates
- Option to automatically update runtimes

### Important Notes

⚠️ **Before updating runtimes:**
- Test your functions after updating
- Node.js 22.x may have breaking changes from Node.js 20.x
- Some functions may require code updates
- Consider updating in a staging environment first

### Regions Checked

By default, the script checks these regions:
- us-east-1 (US East - N. Virginia)
- us-east-2 (US East - Ohio)
- us-west-1 (US West - N. California)
- us-west-2 (US West - Oregon)
- eu-west-1 (Europe - Ireland)
- eu-central-1 (Europe - Frankfurt)
- ap-southeast-1 (Asia Pacific - Singapore)
- ap-southeast-2 (Asia Pacific - Sydney)

You can specify a single region using `--region=<region-name>`.
