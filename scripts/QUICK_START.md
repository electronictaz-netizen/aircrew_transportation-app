# Quick Start: Running the Lambda Runtime Check Script

## Where to Run

Run the script from the **project root directory** (where `package.json` is located):

```
Aircrew transportation app/
```

## Step-by-Step Instructions

### 1. Open Terminal/Command Prompt

Navigate to your project directory:
```bash
cd "C:\Users\ericd\app\Aircrew transportation app"
```

Or if you're already in the `app` directory:
```bash
cd "Aircrew transportation app"
```

### 2. Install Dependencies (if not already installed)

```bash
npm install
```

This will install the required packages including `@aws-sdk/client-lambda` and `ts-node`.

### 3. Configure AWS Credentials

Make sure your AWS credentials are configured. You can do this in one of these ways:

**Option A: Using AWS CLI (Recommended)**
```bash
aws configure
```
Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (e.g., `json`)

**Option B: Environment Variables**
```powershell
$env:AWS_ACCESS_KEY_ID="your-access-key"
$env:AWS_SECRET_ACCESS_KEY="your-secret-key"
$env:AWS_DEFAULT_REGION="us-east-1"
```

**Option C: IAM Role** (if running on EC2/ECS)

### 4. Run the Script

**Check functions (read-only):**
```bash
npm run check-lambda
```

**Check and update functions automatically:**
```bash
npm run check-lambda:update
```

## Expected Output

The script will:
1. Scan multiple AWS regions
2. List all Lambda functions found
3. Highlight functions using Node.js 20.x
4. Show a summary with functions needing updates

Example output:
```
🚀 Starting Lambda function runtime check...

🔍 Checking region: us-east-1...
   Found 5 function(s)
   ⚠️  my-function: nodejs20.x (NEEDS UPDATE)
   ✓  other-function: nodejs22.x

📊 SUMMARY
================================================================================
Total functions found: 5
Node.js functions: 3
Functions needing update: 1
Amplify-related functions: 2
```

## Troubleshooting

**Error: "Cannot find module '@aws-sdk/client-lambda'"**
- Run: `npm install`

**Error: "AWS credentials not found"**
- Configure AWS credentials using `aws configure` or environment variables

**Error: "AccessDeniedException"**
- Your AWS credentials don't have permission to list Lambda functions
- Contact your AWS administrator to grant `lambda:ListFunctions` permission

**Script runs but finds no functions**
- This is normal if you don't have any Lambda functions in your account
- Or if functions are in regions not checked by default
- Use `--region=<region-name>` to check a specific region

## Need Help?

Check the full documentation in `scripts/README.md` for more details.
