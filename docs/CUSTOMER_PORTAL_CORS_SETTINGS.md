# Customer Portal Lambda Function URL - CORS Settings

## Recommended CORS Configuration

When creating the Lambda Function URL for the `customerPortal` function, configure CORS with the following settings:

### Development/Testing
- **Allow origin**: `*` (allows all origins)
  - ⚠️ **Note**: Only use `*` for development/testing. Not recommended for production.

### Production
- **Allow origin**: Specify your app domain(s):
  - `https://onyxdispatch.us`
  - `https://*.onyxdispatch.us` (if using subdomains)
  - Add each company's custom domain if they host the portal on their own domain
  - Example: `https://portal.company1.com,https://portal.company2.com`

### Standard Settings (Both Environments)
- **Allow methods**: `POST`, `OPTIONS`
- **Allow headers**: `Content-Type`
- **Expose headers**: (leave empty, or add specific headers if your frontend needs them)
- **Max age**: `86400` (24 hours) - Optional, helps cache preflight requests

## Why These Settings?

1. **POST method**: The customer portal API only accepts POST requests with JSON body
2. **OPTIONS method**: Required for CORS preflight requests
3. **Content-Type header**: Required because requests send JSON data
4. **Max age**: Reduces preflight requests by caching the CORS policy for 24 hours

## Important Notes

1. **Handler Code**: The Lambda handler code does NOT set CORS headers. CORS is handled entirely by the Lambda Function URL configuration to avoid duplicate headers.

2. **Multiple Origins**: If you need to support multiple origins (e.g., multiple company domains), you can:
   - List them comma-separated in the "Allow origin" field
   - Or use a wildcard pattern if all subdomains follow the same pattern

3. **Security**: 
   - Never use `*` for Allow origin in production
   - Restrict to only the domains that need access
   - Consider adding rate limiting at the Function URL level

## AWS Console Steps

1. Go to **AWS Lambda Console**
2. Select the `customerPortal` function
3. Go to **Configuration** → **Function URL**
4. Click **Edit** (or **Create function URL** if not created yet)
5. Under **CORS settings**, configure:
   - **Allow origin**: (see recommendations above)
   - **Allow methods**: `POST, OPTIONS`
   - **Allow headers**: `Content-Type`
   - **Expose headers**: (leave empty)
   - **Max age**: `86400` (optional)
6. Click **Save**

## Troubleshooting

### CORS Error: "No 'Access-Control-Allow-Origin' header"
- Verify CORS is enabled in Function URL settings
- Check that your origin is included in the "Allow origin" list
- Ensure the handler code doesn't set CORS headers (they're handled by Function URL)

### CORS Error: "Method not allowed"
- Verify `POST` and `OPTIONS` are in the "Allow methods" list

### CORS Error: "Request header field is not allowed"
- Verify `Content-Type` is in the "Allow headers" list
- If using additional headers, add them to the allowed list
