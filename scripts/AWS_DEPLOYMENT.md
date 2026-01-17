# Running Lambda Runtime Check in AWS

There are several ways to run the Lambda runtime check script directly in AWS:

## Option 1: AWS CloudShell (Easiest) ⭐ Recommended

AWS CloudShell is a browser-based shell that comes pre-configured with AWS credentials.

### Steps:

1. **Open AWS CloudShell**
   - Go to AWS Console
   - Click the CloudShell icon (top right) or search for "CloudShell"

2. **Upload and run the script**
   ```bash
   # Option A: Use the simplified CloudShell script
   curl -O https://raw.githubusercontent.com/your-repo/scripts/run-in-cloudshell.sh
   bash run-in-cloudshell.sh
   
   # Option B: Clone your repo and run
   git clone https://github.com/your-repo/aircrew_transportation-app.git
   cd aircrew_transportation-app
   npm install
   npm run check-lambda
   ```

3. **View results**
   - The script will output directly in CloudShell
   - No need to configure AWS credentials (already done)

## Option 2: Deploy as Lambda Function

Deploy the check script as a Lambda function that can run on a schedule or be triggered manually.

### Quick Deploy:

```bash
# Make script executable
chmod +x scripts/deploy-lambda-check.sh

# Deploy (requires AWS CLI configured)
./scripts/deploy-lambda-check.sh
```

### Manual Deploy:

1. **Create Lambda Function in AWS Console**
   - Go to Lambda → Create Function
   - Name: `lambda-runtime-checker`
   - Runtime: Node.js 22.x
   - Architecture: x86_64

2. **Set IAM Permissions**
   - Attach policy with:
     - `lambda:ListFunctions`
     - `lambda:GetFunction`
     - `lambda:UpdateFunctionConfiguration`

3. **Upload Code**
   - Use the `checkLambdaRuntimes-lambda.ts` file
   - Compile to JavaScript or use inline code

4. **Invoke Function**
   ```bash
   # Check only
   aws lambda invoke --function-name lambda-runtime-checker \
     --payload '{}' response.json
   
   # Check and update
   aws lambda invoke --function-name lambda-runtime-checker \
     --payload '{"update":true}' response.json
   ```

## Option 3: Add to Amplify Build Pipeline

The script can run automatically after each deployment.

### In `amplify.yml`:

```yaml
backend:
  phases:
    build:
      commands:
        - npm install --legacy-peer-deps
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
        # Check Lambda runtimes (non-blocking)
        - npm run check-lambda || echo "Lambda check completed with warnings"
```

**Note:** The `|| true` or `|| echo` ensures the build doesn't fail if the check finds issues.

## Option 4: AWS Systems Manager (SSM) Run Command

Run the script on EC2 instances or via SSM:

```bash
aws ssm send-command \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /path/to/project && npm run check-lambda"]' \
  --targets "Key=instanceids,Values=i-1234567890abcdef0"
```

## Option 5: AWS CodeBuild

Add to your CI/CD pipeline:

```yaml
# buildspec.yml
phases:
  build:
    commands:
      - npm install
      - npm run check-lambda
```

## Recommended Approach

For your use case, **AWS CloudShell** is the easiest:
- ✅ No setup required
- ✅ AWS credentials already configured
- ✅ Can run immediately
- ✅ Results visible in browser

## Security Notes

- The script needs read access to Lambda functions
- For updates, it needs write access
- Consider using least-privilege IAM policies
- Review functions before auto-updating in production

## Troubleshooting

**"Access Denied" errors:**
- Ensure your IAM user/role has `lambda:ListFunctions` permission
- For updates, also needs `lambda:UpdateFunctionConfiguration`

**"Module not found" errors:**
- Run `npm install` first
- Or use `npx` to run with auto-install

**Script times out:**
- Increase Lambda timeout if running as Lambda function
- Or check fewer regions at a time
