# FlightAware AeroAPI Setup Guide

This guide explains how to configure FlightAware's AeroAPI for flight status checks.

## What is AeroAPI?

AeroAPI is FlightAware's modern REST API that provides real-time flight tracking data. It uses:
- **Header-based authentication** (API key in `x-apikey` header)
- **RESTful endpoints** (not the old FlightXML format)
- **JSON responses**

## Key Changes from Old Implementation

The code has been updated to use AeroAPI instead of the legacy FlightXML API:

### Authentication
- **Old**: Username/password in query parameters
- **New**: API key in HTTP header (`x-apikey`)

### Endpoint
- **Old**: `https://flightxml.flightaware.com/json/FlightXML2/FlightInfo`
- **New**: `https://aeroapi.flightaware.com/aeroapi/flights/{ident}`

### Response Format
- **Old**: XML-like JSON structure with `FlightInfoResult`
- **New**: Direct JSON with flight data fields

## Setup Steps

### Step 1: Sign Up for AeroAPI

1. Go to [FlightAware AeroAPI](https://www.flightaware.com/aeroapi/)
2. Click "Sign Up" or "Get Started"
3. Create an account or log in
4. Navigate to the AeroAPI section

### Step 2: Get Your API Key

1. In your FlightAware account, go to **AeroAPI** or **API Keys**
2. Generate a new API key (or use existing one)
3. Copy your API key
   - Format: Usually a long alphanumeric string
   - Keep it secure - treat it like a password

### Step 3: Configure Environment Variables

#### Option A: Multi-Provider Setup (Recommended)

In AWS Amplify Console → Environment Variables:

1. **Set provider list:**
   - **Key**: `VITE_FLIGHT_API_PROVIDERS`
   - **Value**: `aviationstack,flightaware`

2. **Set FlightAware API key:**
   - **Key**: `VITE_FLIGHT_API_KEY_FLIGHTAWARE`
   - **Value**: `your_aeroapi_key_here` (paste your actual AeroAPI key)

3. **Set AviationStack API key (if using):**
   - **Key**: `VITE_FLIGHT_API_KEY_AVIATIONSTACK`
   - **Value**: `your_aviationstack_key_here`

#### Option B: Single Provider Setup

1. **Key**: `VITE_FLIGHT_API_PROVIDER`
   - **Value**: `flightaware`

2. **Key**: `VITE_FLIGHT_API_KEY`
   - **Value**: `your_aeroapi_key_here`

### Step 4: Deploy and Test

1. Commit and push your changes
2. Wait for AWS Amplify to rebuild
3. Test flight status check in the app
4. Check browser console for `[flightaware]` logs

## How It Works

### API Call Format

```
GET https://aeroapi.flightaware.com/aeroapi/flights/{flight_number}
Headers:
  x-apikey: your_api_key_here
  Accept: application/json
```

### Example Request

For flight DL3709:
```
GET https://aeroapi.flightaware.com/aeroapi/flights/DL3709
Headers:
  x-apikey: abc123xyz...
```

### Response Format

AeroAPI returns flight data like:
```json
{
  "ident": "DL3709",
  "fa_flight_id": "DL3709-1234567890-abc123",
  "scheduled_off": "2024-01-13T10:00:00Z",
  "actual_off": "2024-01-13T10:15:00Z",
  "scheduled_on": "2024-01-13T12:00:00Z",
  "actual_on": null,
  "cancelled": false,
  ...
}
```

### Status Determination

The code determines flight status based on:
- **Landed**: `actual_on` is present
- **Delayed**: `actual_off` is significantly later than `scheduled_off` (>15 minutes)
- **Cancelled**: `cancelled` field is true
- **On Time**: Scheduled time hasn't passed or departure was on time

## Date Filtering

AeroAPI supports date filtering via the `start` parameter:
```
GET https://aeroapi.flightaware.com/aeroapi/flights/DL3709?start=2024-01-13
```

The code automatically adds this when a flight date is provided.

## Error Handling

The implementation handles:
- **401 Unauthorized**: Invalid API key
- **400 Bad Request**: Invalid parameters or endpoint
- **429 Too Many Requests**: Rate limit exceeded
- **403 Forbidden**: Access denied or quota exceeded

All errors trigger automatic fallback to the next provider in your list.

## Pricing

- **Free Tier**: Limited requests (check current limits)
- **Paid Plans**: Various tiers based on request volume
- Check [AeroAPI pricing](https://www.flightaware.com/aeroapi/) for current rates

## Troubleshooting

### Issue: 401 Unauthorized
**Solution:**
- Verify API key is correct
- Check API key hasn't expired
- Ensure key is for AeroAPI (not FlightXML)

### Issue: 400 Bad Request
**Solution:**
- Check flight number format (e.g., "DL3709" not "DL 3709")
- Verify endpoint URL is correct
- Check API key format

### Issue: No Response
**Solution:**
- Check browser console for errors
- Verify API key is set in environment variables
- Check network tab for API call details
- Ensure AeroAPI account is active

## API Documentation

For detailed API documentation:
- [AeroAPI Documentation](https://www.flightaware.com/aeroapi/)
- [AeroAPI Portal](https://www.flightaware.com/aeroapi/portal/)

## Notes

- AeroAPI requires HTTPS
- API key must be kept secure
- Rate limits apply based on your plan
- The code automatically handles authentication headers
- Date filtering is supported for historical flights
