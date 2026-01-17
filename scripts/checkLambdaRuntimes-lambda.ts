/**
 * Lambda function version of the Lambda runtime check script
 * 
 * This can be deployed as a Lambda function to run on a schedule
 * or be triggered manually from the AWS Console.
 * 
 * Deploy using:
 * 1. Create a Lambda function in AWS Console
 * 2. Set runtime to Node.js 22.x
 * 3. Upload this file (compiled to JS) or use inline code
 * 4. Set IAM role with lambda:ListFunctions, lambda:GetFunction, lambda:UpdateFunctionConfiguration permissions
 */

import { LambdaClient, ListFunctionsCommand, UpdateFunctionConfigurationCommand } from '@aws-sdk/client-lambda';
import type { Context, Handler } from 'aws-lambda';

const TARGET_RUNTIME = 'nodejs22.x';
const DEPRECATED_RUNTIMES = ['nodejs20.x', 'nodejs20'];

interface FunctionInfo {
  functionName: string;
  runtime: string;
  lastModified: string;
  region: string;
  needsUpdate: boolean;
}

interface Event {
  update?: boolean;
  regions?: string[];
}

export const handler: Handler = async (event: Event, context: Context) => {
  console.log('Lambda runtime check started', { event });
  
  const shouldUpdate = event.update === true;
  const regionsToCheck = event.regions || [
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2',
    'eu-west-1',
    'eu-central-1',
  ];

  const allFunctions: FunctionInfo[] = [];
  const results: any = {
    checkedRegions: [],
    totalFunctions: 0,
    nodejsFunctions: 0,
    needsUpdate: 0,
    updated: 0,
    errors: [],
  };

  for (const region of regionsToCheck) {
    try {
      const client = new LambdaClient({ region });
      const listCommand = new ListFunctionsCommand({});
      const response = await client.send(listCommand);
      
      results.checkedRegions.push(region);
      
      if (!response.Functions || response.Functions.length === 0) {
        console.log(`No functions found in ${region}`);
        continue;
      }

      console.log(`Found ${response.Functions.length} function(s) in ${region}`);

      for (const func of response.Functions) {
        if (!func.FunctionName || !func.Runtime) continue;

        const runtime = func.Runtime;
        const needsUpdate = DEPRECATED_RUNTIMES.some(deprecated => 
          runtime.includes(deprecated) || runtime === deprecated
        );

        const functionInfo: FunctionInfo = {
          functionName: func.FunctionName,
          runtime: runtime,
          lastModified: func.LastModified?.toISOString() || 'Unknown',
          region: region,
          needsUpdate: needsUpdate,
        };

        allFunctions.push(functionInfo);
        results.totalFunctions++;
        
        if (runtime.startsWith('nodejs')) {
          results.nodejsFunctions++;
        }
        
        if (needsUpdate) {
          results.needsUpdate++;
          
          if (shouldUpdate) {
            try {
              const updateCommand = new UpdateFunctionConfigurationCommand({
                FunctionName: func.FunctionName,
                Runtime: TARGET_RUNTIME,
              });
              await client.send(updateCommand);
              results.updated++;
              console.log(`Updated ${func.FunctionName} in ${region} to ${TARGET_RUNTIME}`);
            } catch (error: any) {
              results.errors.push({
                function: func.FunctionName,
                region: region,
                error: error.message,
              });
              console.error(`Failed to update ${func.FunctionName}:`, error.message);
            }
          }
        }
      }
    } catch (error: any) {
      results.errors.push({
        region: region,
        error: error.message,
      });
      console.error(`Error checking ${region}:`, error.message);
    }
  }

  const functionsNeedingUpdate = allFunctions.filter(f => f.needsUpdate);
  
  return {
    statusCode: 200,
    body: {
      summary: results,
      functionsNeedingUpdate: functionsNeedingUpdate,
      message: shouldUpdate 
        ? `Checked ${results.totalFunctions} functions. Updated ${results.updated} functions to ${TARGET_RUNTIME}.`
        : `Checked ${results.totalFunctions} functions. Found ${results.needsUpdate} functions using deprecated Node.js 20.x runtime.`,
    },
  };
};
