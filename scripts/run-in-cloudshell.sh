#!/bin/bash
# Script to run Lambda runtime check in AWS CloudShell
# 
# Usage in AWS CloudShell:
# 1. Go to AWS CloudShell in AWS Console
# 2. Upload this script or paste the commands
# 3. Run: bash run-in-cloudshell.sh

echo "🚀 Setting up Lambda runtime check in AWS CloudShell..."

# Install Node.js if not available
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
    yum install -y nodejs
fi

# Install dependencies
echo "📥 Installing dependencies..."
npm install @aws-sdk/client-lambda ts-node typescript --global

# Create the check script
cat > checkLambdaRuntimes.ts << 'SCRIPT_EOF'
import { LambdaClient, ListFunctionsCommand } from '@aws-sdk/client-lambda';

const DEPRECATED_RUNTIMES = ['nodejs20.x', 'nodejs20'];
const REGIONS = ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-central-1'];

async function checkRegion(region: string) {
  const client = new LambdaClient({ region });
  try {
    const response = await client.send(new ListFunctionsCommand({}));
    const functions = response.Functions || [];
    const needsUpdate = functions.filter(f => 
      f.Runtime && DEPRECATED_RUNTIMES.some(dep => f.Runtime!.includes(dep))
    );
    
    if (needsUpdate.length > 0) {
      console.log(`\n⚠️  ${region}: ${needsUpdate.length} function(s) need update`);
      needsUpdate.forEach(f => console.log(`   - ${f.FunctionName}: ${f.Runtime}`));
    } else if (functions.length > 0) {
      console.log(`✓ ${region}: ${functions.length} function(s), all up to date`);
    }
    
    return needsUpdate.length;
  } catch (error: any) {
    console.log(`⚠️  ${region}: ${error.message}`);
    return 0;
  }
}

async function main() {
  console.log('🔍 Checking Lambda functions for Node.js 20.x...\n');
  let total = 0;
  for (const region of REGIONS) {
    total += await checkRegion(region);
  }
  console.log(`\n📊 Total functions needing update: ${total}`);
}

main();
SCRIPT_EOF

# Run the check
echo "🔍 Running Lambda runtime check..."
npx ts-node --esm checkLambdaRuntimes.ts

echo "\n✅ Check complete!"
