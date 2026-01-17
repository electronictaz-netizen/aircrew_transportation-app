#!/bin/bash
# Script to deploy the Lambda runtime check as a Lambda function
# 
# Prerequisites:
# - AWS CLI configured
# - Node.js 22.x installed
# - zip command available
#
# Usage: ./scripts/deploy-lambda-check.sh

set -e

FUNCTION_NAME="lambda-runtime-checker"
ROLE_NAME="lambda-runtime-checker-role"
REGION="${AWS_REGION:-us-east-1}"

echo "🚀 Deploying Lambda runtime check function..."

# Create deployment package
echo "📦 Creating deployment package..."
mkdir -p dist/lambda-check
cp scripts/checkLambdaRuntimes-lambda.ts dist/lambda-check/
cp package.json dist/lambda-check/
cd dist/lambda-check

# Install dependencies
echo "📥 Installing dependencies..."
npm install --production --legacy-peer-deps

# Compile TypeScript (if needed) or use ts-node
# For simplicity, we'll create a simple JS wrapper
cat > index.js << 'EOF'
const { handler } = require('./checkLambdaRuntimes-lambda');
exports.handler = handler;
EOF

# Create zip file
echo "📦 Creating zip file..."
zip -r ../lambda-check.zip . -q
cd ../..

# Check if function exists
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" 2>/dev/null; then
    echo "🔄 Updating existing function..."
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file fileb://dist/lambda-check.zip \
        --region "$REGION"
else
    echo "📝 Creating IAM role..."
    
    # Create trust policy
    cat > /tmp/trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    # Create role
    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --region "$REGION" 2>/dev/null || echo "Role may already exist"

    # Attach policies
    echo "🔐 Attaching policies..."
    aws iam attach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
        --region "$REGION" 2>/dev/null || true

    # Create custom policy for Lambda access
    cat > /tmp/lambda-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:ListFunctions",
        "lambda:GetFunction",
        "lambda:UpdateFunctionConfiguration"
      ],
      "Resource": "*"
    }
  ]
}
EOF

    POLICY_ARN=$(aws iam create-policy \
        --policy-name lambda-runtime-checker-policy \
        --policy-document file:///tmp/lambda-policy.json \
        --query 'Policy.Arn' \
        --output text \
        --region "$REGION" 2>/dev/null || \
        aws iam list-policies --query "Policies[?PolicyName=='lambda-runtime-checker-policy'].Arn" --output text --region "$REGION")

    if [ -n "$POLICY_ARN" ]; then
        aws iam attach-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-arn "$POLICY_ARN" \
            --region "$REGION" 2>/dev/null || true
    fi

    # Wait for role to be ready
    sleep 5

    ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text --region "$REGION")

    echo "✨ Creating Lambda function..."
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime nodejs22.x \
        --role "$ROLE_ARN" \
        --handler index.handler \
        --zip-file fileb://dist/lambda-check.zip \
        --timeout 300 \
        --memory-size 256 \
        --region "$REGION"
fi

echo "✅ Deployment complete!"
echo ""
echo "To invoke the function:"
echo "  aws lambda invoke --function-name $FUNCTION_NAME --region $REGION response.json"
echo ""
echo "To check functions (read-only):"
echo "  aws lambda invoke --function-name $FUNCTION_NAME --payload '{}' --region $REGION response.json"
echo ""
echo "To update functions automatically:"
echo "  aws lambda invoke --function-name $FUNCTION_NAME --payload '{\"update\":true}' --region $REGION response.json"
