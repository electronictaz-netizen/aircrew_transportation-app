# Troubleshooting: Trips Not Being Added

## Debugging Steps

### 1. Check Browser Console
Open your browser's Developer Tools (F12) and check the Console tab when creating a trip. Look for:

- `"TripForm submitting data:"` - Shows what data is being sent from the form
- `"Creating trip with data:"` - Shows what data is received by the handler
- `"Creating one-time trip with data:"` - Shows the final data being sent to API
- `"Final trip data being sent:"` - Shows the cleaned data
- `"Trip creation result:"` - Shows the API response
- Any error messages in red

### 2. Check Network Tab
1. Open Developer Tools (F12)
2. Go to Network tab
3. Try creating a trip
4. Look for API calls to your Amplify backend
5. Check if the request is being made
6. Check the response status and body

### 3. Verify Authentication
- Make sure you're logged in
- Check if you see your email/username in the navigation bar
- Try logging out and logging back in

### 4. Check Required Fields
Ensure all required fields are filled:
- ✅ Pickup Date and Time
- ✅ Flight Number
- ✅ Pickup Location
- ✅ Dropoff Location

### 5. Common Issues

#### Issue: "No data returned from trip creation"
**Possible causes:**
- Backend not properly deployed
- Schema mismatch
- Authentication issue

**Solution:**
- Check AWS Amplify Console for backend deployment status
- Verify `amplify_outputs.json` is up to date
- Check browser console for authentication errors

#### Issue: Status enum error
**Possible causes:**
- Status value not matching enum values
- Status is null/undefined

**Solution:**
- Status should be one of: 'Unassigned', 'Assigned', 'InProgress', 'Completed'
- Code automatically sets to 'Unassigned' if not provided

#### Issue: Date format error
**Possible causes:**
- Invalid date format
- Date in the past (if validation exists)

**Solution:**
- Ensure date is in valid format
- Check console for date parsing errors

### 6. Test with Minimal Data
Try creating a trip with minimal data:
1. Pickup Date: Any future date
2. Flight Number: "AA1234"
3. Pickup Location: "Airport"
4. Dropoff Location: "Hotel"
5. Leave everything else default
6. Don't check "Recurring Job"
7. Click "Create Trip"

### 7. Check Backend Logs
If deployed to AWS:
1. Go to AWS Amplify Console
2. Check AppSync API logs
3. Check CloudWatch logs for errors

### 8. Verify Schema
Check that your schema matches what's being sent:
- Required fields: pickupDate, flightNumber, pickupLocation, dropoffLocation
- Optional fields: driverId, numberOfPassengers, status
- Recurring fields: isRecurring, recurringPattern, recurringEndDate

## Quick Fixes to Try

1. **Clear browser cache and reload**
2. **Check if backend is deployed** - Go to AWS Amplify Console
3. **Verify amplify_outputs.json exists** and is valid
4. **Try in incognito/private window** to rule out extension issues
5. **Check for JavaScript errors** in console before submitting

## What to Share for Help

If trips still aren't being added, please share:
1. Console logs (copy all messages when creating a trip)
2. Network tab screenshot (showing the API call)
3. Any error messages shown in the UI
4. Browser and version
5. Whether you're testing locally or on deployed version
