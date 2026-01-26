# Identify Dev Branch CloudFormation Stacks

## Quick Identification Guide

### Step 1: Go to CloudFormation Console

1. Go to **AWS CloudFormation** → **Stacks**
2. You'll see a list of all stacks

### Step 2: Look for Dev Branch Stacks

**Dev branch stacks will have these patterns in their names:**
- `amplify-d1wxo3x0z5r1oq-dev-branch-{hash}`
- `amplify-d1wxo3x0z5r1oq-de-{resource}-{hash}`
- Contains `-dev-` or `-de-` in the name

**Main branch stacks will have:**
- `amplify-d1wxo3x0z5r1oq-main-branch-{hash}`
- `amplify-d1wxo3x0z5r1oq-ma-{resource}-{hash}`
- Contains `-main-` or `-ma-` in the name

### Step 3: Use Filter to Find Dev Stacks

**In CloudFormation Console:**
1. Use the **Filter** box at the top
2. Type: `dev` or `de-`
3. This will show only stacks with "dev" or "de" in the name

**Or search for:**
- `d1wxo3x0z5r1oq-dev`
- `d1wxo3x0z5r1oq-de-`

## What to Look For

### Typical Dev Branch Stack Names:

1. **Main backend stack:**
   - `amplify-d1wxo3x0z5r1oq-dev-branch-{hash}`
   - This is the parent stack

2. **Nested stacks (child stacks):**
   - `amplify-d1wxo3x0z5r1oq-dev-branch-{hash}-data{hash}`
   - `amplify-d1wxo3x0z5r1oq-dev-branch-{hash}-publicBooking{hash}`
   - `amplify-d1wxo3x0z5r1oq-dev-branch-{hash}-auth{hash}`
   - Any stack with `-dev-branch-` or `-de-` in the name

### How to Verify a Stack is Dev Branch:

1. **Click on the stack** to view details
2. **Check Tags tab:**
   - Look for tags like:
     - `amplify:branch` = `dev`
     - `amplify:appId` = `d1wxo3x0z5r1oq`
3. **Check Resources tab:**
   - Look for resources with `-de-` in their names
   - Example: Lambda function with `de-publicBooking`

## Safe to Delete Checklist

Before deleting, verify:

- [ ] Stack name contains `-dev-` or `-de-`
- [ ] Stack tags show `amplify:branch` = `dev`
- [ ] Stack resources include `de-publicBooking` Lambda
- [ ] Stack was created for dev branch (check creation time)
- [ ] No important data in dev environment

## Example Stack Structure

**Dev Branch Stacks (DELETE THESE):**
```
amplify-d1wxo3x0z5r1oq-dev-branch-abc123
├── amplify-d1wxo3x0z5r1oq-dev-branch-abc123-data-xyz789
├── amplify-d1wxo3x0z5r1oq-dev-branch-abc123-publicBooking-def456
└── amplify-d1wxo3x0z5r1oq-dev-branch-abc123-auth-ghi789
```

**Main Branch Stacks (KEEP THESE):**
```
amplify-d1wxo3x0z5r1oq-main-branch-abc123
├── amplify-d1wxo3x0z5r1oq-main-branch-abc123-data-xyz789
├── amplify-d1wxo3x0z5r1oq-main-branch-abc123-publicBooking-def456
└── amplify-d1wxo3x0z5r1oq-main-branch-abc123-auth-ghi789
```

## Deletion Order

**Important:** Delete nested stacks BEFORE the parent stack, or delete the parent stack and it will delete nested stacks automatically.

**Option 1: Delete Parent Stack (Easier)**
1. Find the main dev branch stack: `amplify-d1wxo3x0z5r1oq-dev-branch-{hash}`
2. Delete it
3. CloudFormation will automatically delete all nested stacks

**Option 2: Delete Nested Stacks First (More Control)**
1. Delete nested stacks first (data, publicBooking, auth, etc.)
2. Then delete the parent stack

## Verification After Identification

Once you've identified the dev branch stacks:

1. **Count them:**
   - Note how many stacks you found
   - Typically 1 parent + 3-5 nested stacks

2. **Double-check:**
   - Make sure none of them say `main` or `ma-` in the name
   - Verify the tags show `branch: dev`

3. **Take a screenshot** (optional but recommended):
   - Document which stacks you're about to delete
   - Useful if something goes wrong

## Quick Visual Guide

**✅ DELETE (Dev Branch):**
- `amplify-d1wxo3x0z5r1oq-dev-branch-...`
- `amplify-d1wxo3x0z5r1oq-de-...`
- Any stack with `-dev-` or `-de-` in name

**❌ KEEP (Main Branch):**
- `amplify-d1wxo3x0z5r1oq-main-branch-...`
- `amplify-d1wxo3x0z5r1oq-ma-...`
- Any stack with `-main-` or `-ma-` in name

**❌ KEEP (Other Apps):**
- `amplify-aircrewtransporta-...` (different app, verify separately)

## Next Steps

After identifying the dev branch stacks:

1. Follow the deletion steps in `DELETE_DEV_BRANCH.md`
2. Delete the stacks via CloudFormation Console
3. Wait for deletion to complete (5-15 minutes)
4. Verify the Lambda function is gone
5. Verify no dev stacks remain
