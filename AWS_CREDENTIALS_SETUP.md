# AWS Credentials Setup for Amplify

## Error: Invalid Security Token

If you're getting `UnrecognizedClientException: The security token included in the request is invalid`, your AWS credentials need to be updated.

## Solution Options

### Option 1: Update Existing Profile (Recommended)

```powershell
cd "C:\Users\ericd\app\Aircrew transportation app"

# Update the default profile
npx ampx configure profile default
```

This will prompt you for:
- **AWS Access Key ID** - Your AWS access key
- **AWS Secret Access Key** - Your AWS secret key
- **AWS Region** - e.g., `us-east-1`

### Option 2: Create a New Profile

```powershell
cd "C:\Users\ericd\app\Aircrew transportation app"

# Create a new profile (e.g., "myprofile")
npx ampx configure profile myprofile

# Then use it when deploying
npx ampx sandbox --profile myprofile
```

### Option 3: Use AWS CLI Credentials

If you already have AWS CLI configured, Amplify can use those credentials:

```powershell
# Check if AWS CLI is configured
aws configure list

# If configured, Amplify should use them automatically
# If not, configure AWS CLI first:
aws configure
```

## Getting AWS Credentials

### If you have an AWS account:

1. **Go to AWS Console** → IAM → Users
2. **Select your user** (or create one)
3. **Security credentials tab** → Create access key
4. **Copy the Access Key ID and Secret Access Key**

### Required Permissions:

Your AWS user needs these permissions:
- `amplify:CreateApp`
- `amplify:CreateBackendEnvironment`
- `amplify:CreateBranch`
- `amplify:GetApp`
- `amplify:GetBackendEnvironment`
- `amplify:GetBranch`
- `amplify:UpdateApp`
- `amplify:UpdateBackendEnvironment`
- `amplify:UpdateBranch`
- `ssm:GetParameter` (for SSM parameters)
- `ssm:PutParameter` (for SSM parameters)
- CloudFormation permissions (for resource creation)
- IAM permissions (for creating roles)
- DynamoDB permissions (for data models)
- AppSync permissions (for GraphQL API)

**Easiest:** Use an IAM user with `AdministratorAccess` for development, or follow the [Amplify IAM setup guide](https://docs.amplify.aws/gen2/start/account-setup/).

## Alternative: Use CI/CD Only

If you don't want to configure local AWS credentials, you can:

1. **Skip local deployment** - Just push to git
2. **Let CI/CD deploy** - Your `amplify.yml` will deploy automatically
3. **The CompanyContext will auto-create** the company when users log in

The migration script is optional - the app will work without it since `CompanyContext` creates the company automatically.

## Verify Credentials

After configuring, test with:

```powershell
# Try to deploy (this will test credentials)
npx ampx sandbox --once
```

## Still Having Issues?

1. **Check AWS credentials are valid** - They may have expired
2. **Verify region** - Must match your Amplify app region
3. **Check IAM permissions** - User needs proper permissions
4. **Try creating new access keys** - Old ones may be invalid

## Quick Reference

```powershell
# Configure/update credentials
npx ampx configure profile

# Deploy schema locally
npx ampx sandbox

# Deploy schema (one-time, no watch)
npx ampx sandbox --once
```
