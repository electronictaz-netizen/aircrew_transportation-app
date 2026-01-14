# Manager User Guide - Aircrew Transportation App

Welcome! This guide will help you manage trips, drivers, and locations in the Aircrew Transportation system.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Your Dashboard](#your-dashboard)
3. [Creating Trips](#creating-trips)
4. [Managing Drivers](#managing-drivers)
5. [Managing Locations](#managing-locations)
6. [Assigning Trips to Drivers](#assigning-trips-to-drivers)
7. [Viewing and Filtering Trips](#viewing-and-filtering-trips)
8. [Daily Assignment Emails](#daily-assignment-emails)
9. [Recurring Trips](#recurring-trips)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Step 1: Receive Your Invitation

Your company administrator will send you an invitation email with:
- A link to access the app
- Your login email address
- Instructions to create your account

### Step 2: Create Your Account

1. Click the link in your invitation email
2. Click "Create Account"
3. Enter your email address (the one from the invitation)
4. Create a secure password
5. Complete the sign-up process

### Step 3: Log In

1. Go to the app URL (provided by your company)
2. Enter your email and password
3. Click "Sign In"

### Step 4: Access Your Dashboard

After logging in, you'll see the **Management Dashboard** - your central hub for managing all trips, drivers, and locations.

---

## Your Dashboard

### Dashboard Overview

The Management Dashboard provides:

- **Trip List**: All trips for your company
- **Quick Actions**: Buttons to create trips, manage drivers, manage locations
- **Filters**: View trips by date, airport, driver, or status
- **Bulk Actions**: Assign or delete multiple trips at once

### Main Sections

1. **Header Bar**
   - Create Trip button
   - Manage Drivers button
   - Manage Locations button
   - Company Settings button (if you're an admin)
   - Send Daily Assignment Emails button

2. **Filters Section**
   - Airport filters (All, BUF, ROC, SYR, ALB)
   - Quick date filters (Today, Tomorrow, This Week, etc.)
   - Driver filter
   - Status filter

3. **Trip List**
   - Table view (desktop) or card view (mobile)
   - Shows all trip information
   - Actions: Edit, Delete, Assign

---

## Creating Trips

### Step-by-Step: Creating a New Trip

1. **Click "Create Trip"** in the Management Dashboard

2. **Select Airport** (Required)
   - Choose from the airports configured for your company
   - The available airports will be shown in the dropdown
   - This determines the airport for the trip

3. **Enter Flight Information**
   - **Flight Number**: Enter the airline code and number (e.g., UA1234, DL5678)
   - **Pickup Date**: Select the date
   - **Pickup Time**: Enter the time (24-hour format or AM/PM)

4. **Set Pickup Location**
   You have three options:
   
   **Option A: Use Airport**
   - Select "Use Airport"
   - The airport you selected will be used automatically
   
   **Option B: Use Saved Location**
   - Select "Use Saved Location"
   - Choose from your saved locations
   
   **Option C: Enter Custom Address**
   - Select "Enter Text"
   - Type the full address manually

5. **Set Dropoff Location**
   Same three options as pickup:
   - Use Airport
   - Use Saved Location
   - Enter Custom Address

6. **Enter Passenger Information**
   - **Passenger Name**: Full name
   - **Contact Information**: Phone number or email (optional but recommended)
   - **Special Instructions**: Any special requirements
     - Wheelchair assistance
     - Multiple passengers
     - Special vehicle needs
     - Contact preferences

7. **Set Recurring Options** (Optional)
   - Check "Recurring Trip" if this trip repeats
   - Select frequency: Daily, Weekly, Monthly
   - Set end date (or leave open-ended)

8. **Click "Save Trip"**

### Trip Creation Tips

✅ **Create trips in advance** - Don't wait until the last minute  
✅ **Use saved locations** - Saves time for frequently used addresses  
✅ **Include passenger contact info** - Helps drivers communicate  
✅ **Add special instructions** - Important for driver awareness  
✅ **Double-check flight numbers** - Ensure accuracy  

### Common Trip Scenarios

#### Airport Pickup
- **Airport**: Select appropriate airport
- **Pickup Location**: Use Airport
- **Dropoff Location**: Enter passenger's destination

#### Airport Dropoff
- **Airport**: Select appropriate airport
- **Pickup Location**: Enter passenger's starting location
- **Dropoff Location**: Use Airport

#### Airport to Airport
- **Airport**: Select pickup airport
- **Pickup Location**: Use Airport
- **Dropoff Location**: Use Airport (select different airport if needed)

#### Custom Location to Custom Location
- **Airport**: Select nearest airport (for reference)
- **Pickup Location**: Enter Text (custom address)
- **Dropoff Location**: Enter Text (custom address)

---

## Managing Drivers

### Accessing Driver Management

Click **"Manage Drivers"** in the Management Dashboard.

### Adding a New Driver

1. Click **"Add Driver"** button
2. Fill in driver information:
   - **Name**: Full name (required)
   - **Email**: Email address (required)
   - **Phone**: Phone number (required for SMS notifications)
   - **License Number**: Driver's license number
   - **Notification Preference**: 
     - Both (Email & SMS)
     - Email Only
     - SMS/Text Only
   - **Active**: Check to make driver active
3. Click **"Save"**

### Editing a Driver

1. Find the driver in the drivers list
2. Click **"Edit"** next to the driver
3. Update any information
4. Click **"Save"**

### Deactivating a Driver

1. Click **"Edit"** next to the driver
2. Uncheck **"Active"**
3. Click **"Save"**

**Note**: Deactivated drivers won't receive new trip assignments but remain in the system.

### Driver Information Fields

- **Name**: Driver's full name
- **Email**: Used for email notifications
- **Phone**: Used for SMS notifications (must be provided for SMS)
- **License Number**: For record keeping
- **Notification Preference**: How driver receives notifications
- **Active Status**: Whether driver can receive assignments

### Notification Preferences Explained

- **Both (Email & SMS)**: Driver receives notifications via both email and text
- **Email Only**: Driver receives notifications only via email
- **SMS/Text Only**: Driver receives notifications only via text (requires phone number)

**Important**: SMS notifications require a valid phone number.

---

## Managing Locations

### Accessing Location Management

Click **"Manage Locations"** in the Management Dashboard.

### Adding a New Location

1. Click **"Add Location"** button
2. Fill in location information:
   - **Name**: Descriptive name (e.g., "Downtown Office", "Hotel XYZ")
   - **Address**: Full street address
   - **Description**: Additional details (optional)
   - **Active**: Check to make location available
3. Click **"Save"**

### Editing a Location

1. Find the location in the locations list
2. Click **"Edit"** next to the location
3. Update any information
4. Click **"Save"**

### Deleting a Location

1. Find the location in the locations list
2. Click **"Delete"** next to the location
3. Confirm deletion

**Note**: You can't delete a location that's currently used in active trips.

### Using Saved Locations

When creating a trip:
1. Select "Use Saved Location" for pickup or dropoff
2. Choose from your saved locations
3. The address will be automatically filled in

**Benefits**:
- Faster trip creation
- Consistent address formatting
- Reduced typing errors

### Location Best Practices

✅ **Use descriptive names** - "Downtown Office" is better than "Location 1"  
✅ **Include full addresses** - Street, city, state, zip code  
✅ **Add descriptions** - Helpful notes like "Main entrance" or "Parking lot"  
✅ **Keep locations active** - Only deactivate if no longer used  

---

## Assigning Trips to Drivers

### Single Trip Assignment

1. Find the trip in the trip list
2. Click **"Assign"** next to the trip
3. Select a driver from the dropdown
4. Click **"Assign"**
5. The driver will receive a notification automatically

### Bulk Trip Assignment

Assign multiple trips to one driver at once:

1. **Select trips**: Check the boxes next to the trips you want to assign
2. **Click "Assign"** button (appears when trips are selected)
3. **Select driver**: Choose a driver from the dialog
4. **Click "Assign"** in the dialog
5. All selected trips will be assigned to the driver
6. The driver will receive notifications for all assigned trips

### Unassigning a Trip

1. Find the assigned trip
2. Click **"Assign"** next to the trip
3. Select **"Unassigned"** from the dropdown
4. Click **"Assign"**

### Reassigning a Trip

1. Find the trip currently assigned to a driver
2. Click **"Assign"** next to the trip
3. Select a different driver
4. Click **"Assign"**
5. Both drivers will be notified:
   - Previous driver: Trip has been reassigned
   - New driver: New trip assignment

### Assignment Best Practices

✅ **Assign trips in advance** - Give drivers time to plan  
✅ **Use bulk assignment** - Efficient for multiple trips to one driver  
✅ **Consider driver schedules** - Don't overload drivers  
✅ **Communicate changes** - Let drivers know if reassigning  
✅ **Check driver availability** - Verify drivers can complete trips  

---

## Viewing and Filtering Trips

### Trip List View

The trip list shows:
- **Airport**: Airport code (BUF, ROC, SYR, ALB)
- **Flight Number**: Airline and flight number
- **Pickup Date & Time**: When to pick up
- **Pickup Location**: Where to pick up
- **Dropoff Location**: Where to drop off
- **Passenger**: Passenger name
- **Driver**: Assigned driver (or "Unassigned")
- **Status**: Trip status
- **Actions**: Edit, Delete, Assign buttons

### Filtering Trips

#### By Airport

Click airport filter buttons:
- **All Airports**: Shows all trips
- **[Airport Name]**: Shows only trips for that specific airport
- Your company's configured airports will appear as filter buttons

#### By Date

Quick filters:
- **Today**: Trips scheduled for today
- **Tomorrow**: Trips scheduled for tomorrow
- **This Week**: Trips in the current week
- **Next Week**: Trips in the next week
- **This Month**: Trips in the current month
- **Custom Range**: Select specific date range

#### By Driver

- Select a driver from the driver filter dropdown
- Shows only trips assigned to that driver

#### By Status

- **All**: All trips
- **Assigned**: Trips with drivers assigned
- **Unassigned**: Trips without drivers

### Sorting Trips

Trips are automatically sorted by pickup date when you:
- Change airport filters
- Change date filters
- Refresh the page

### Mobile View

On mobile devices:
- Table view is replaced with card view
- Each trip is shown as a card
- All information is visible
- Actions are accessible via buttons

---

## Daily Assignment Emails

### What Are Daily Assignment Emails?

Daily assignment emails (and SMS) are summaries sent to drivers showing their trips for the following day. This helps drivers plan their schedule.

### Sending Daily Assignment Emails

1. Click **"Send Daily Assignment Emails"** in the Management Dashboard
2. Choose notification method:
   - **Email**: Send email summaries
   - **SMS**: Send text message summaries
   - **Both**: Send both email and SMS
3. Click **"Send"**

### What Drivers Receive

**Email Format**:
- List of all trips for tomorrow
- Pickup times
- Pickup locations
- Basic trip information
- Note to check app for full details

**SMS Format**:
- Brief summary
- Flight numbers
- Pickup times
- Pickup locations
- Note to check app for details

### When to Send

**Best Practices**:
- Send in the evening (after 6 PM) for next day's trips
- Send after all trips for tomorrow are created and assigned
- Send daily for consistency
- Consider automating (if available)

### Notification Preferences

The system respects each driver's notification preference:
- Drivers set to "Email Only" receive email only
- Drivers set to "SMS Only" receive SMS only (if phone number provided)
- Drivers set to "Both" receive both email and SMS

**Note**: SMS requires a valid phone number for each driver.

---

## Recurring Trips

### Creating Recurring Trips

1. Create a trip as normal
2. Check **"Recurring Trip"** checkbox
3. Select frequency:
   - **Daily**: Trip repeats every day
   - **Weekly**: Trip repeats every week on the same day
   - **Monthly**: Trip repeats every month on the same date
4. Set end date (optional):
   - Leave blank for ongoing trips
   - Set date to stop recurring trips
5. Click **"Save Trip"**

### How Recurring Trips Work

- System automatically generates upcoming trips
- Trips are created based on the frequency you set
- Generated trips appear in your trip list
- You can assign drivers to recurring trips
- Each occurrence can be edited individually

### Managing Recurring Trips

- **Edit individual occurrences**: Edit a specific trip instance
- **Edit the pattern**: Edit the original recurring trip to change future occurrences
- **Delete individual occurrences**: Delete a specific trip without affecting the pattern
- **Delete the pattern**: Delete the recurring trip and all future occurrences

### Recurring Trip Examples

**Daily Airport Shuttle**:
- Frequency: Daily
- Time: 8:00 AM
- Location: Hotel to Airport
- No end date

**Weekly Meeting Pickup**:
- Frequency: Weekly
- Day: Every Monday
- Time: 9:00 AM
- End date: End of quarter

---

## Editing and Deleting Trips

### Editing a Trip

1. Find the trip in the trip list
2. Click **"Edit"** next to the trip
3. Update any information
4. Click **"Save"**

**Note**: If the trip is assigned, the driver will be notified of changes.

### Deleting a Trip

1. Find the trip in the trip list
2. Click **"Delete"** next to the trip
3. Confirm deletion

**Bulk Delete**:
1. Check boxes next to multiple trips
2. Click **"Delete"** button
3. Confirm deletion

**Warning**: Deleted trips cannot be recovered.

### When to Edit vs. Delete

**Edit when**:
- Trip details change (time, location, passenger)
- Flight number changes
- Need to update special instructions

**Delete when**:
- Trip is cancelled
- Trip was created by mistake
- Trip is no longer needed

---

## Best Practices

### Trip Management

✅ **Create trips in advance** - At least 24 hours before pickup  
✅ **Use saved locations** - Faster and more accurate  
✅ **Include complete information** - Passenger details, special instructions  
✅ **Double-check flight numbers** - Ensure accuracy  
✅ **Assign drivers promptly** - Give drivers time to plan  
✅ **Update trips if changes occur** - Keep information current  

### Driver Management

✅ **Keep driver information current** - Update contact info regularly  
✅ **Set notification preferences** - Match driver preferences  
✅ **Deactivate inactive drivers** - Keep list clean  
✅ **Verify phone numbers** - Required for SMS notifications  

### Location Management

✅ **Add frequently used locations** - Saves time  
✅ **Use descriptive names** - Easy to identify  
✅ **Include full addresses** - Complete information  
✅ **Keep locations organized** - Deactivate unused locations  

### Assignment Management

✅ **Assign trips early** - Better driver planning  
✅ **Use bulk assignment** - Efficient for multiple trips  
✅ **Balance driver workload** - Don't overload drivers  
✅ **Communicate changes** - Let drivers know about reassignments  

### Communication

✅ **Send daily summaries** - Help drivers plan  
✅ **Respond to driver questions** - Prompt communication  
✅ **Update drivers on changes** - Keep them informed  
✅ **Use notifications effectively** - Don't spam drivers  

### Daily Routine

**Morning**:
- Review trips for today
- Check for any unassigned trips
- Verify driver assignments
- Send daily summaries (if not automated)

**Throughout the Day**:
- Create new trips as they come in
- Assign trips to drivers
- Update trip information if needed
- Respond to driver questions

**Evening**:
- Review tomorrow's trips
- Ensure all trips are assigned
- Send daily assignment summaries
- Plan for next day

---

## Troubleshooting

### Can't Create a Trip

**Problem**: Trip creation form won't submit

**Possible causes**:
- Required fields missing
- Invalid date/time format
- Airport not selected

**Solution**:
1. Check all required fields are filled
2. Verify date and time are correct
3. Ensure airport is selected
4. Try refreshing the page

### Driver Not Receiving Notifications

**Problem**: Driver says they didn't get notification

**Possible causes**:
- Email/phone number incorrect
- Notification preference not set
- Email in spam folder
- Phone number not provided (for SMS)

**Solution**:
1. Verify driver's email and phone in their profile
2. Check notification preference is set correctly
3. Ask driver to check spam folder
4. Ensure phone number is provided for SMS

### Can't Assign Trip

**Problem**: Assignment dropdown is empty or not working

**Possible causes**:
- No active drivers in system
- Driver list not loaded
- Browser issue

**Solution**:
1. Check that drivers are added and active
2. Refresh the page
3. Try a different browser
4. Contact support if issue persists

### Location Not Appearing in Dropdown

**Problem**: Saved location doesn't show when creating trip

**Possible causes**:
- Location is inactive
- Location was deleted
- Browser cache issue

**Solution**:
1. Check location is active in Manage Locations
2. Refresh the page
3. Try selecting location again

### Bulk Assignment Not Working

**Problem**: Can't assign multiple trips at once

**Possible causes**:
- No trips selected
- Browser issue
- Too many trips selected

**Solution**:
1. Ensure trips are checked (checkbox selected)
2. Try selecting fewer trips
3. Refresh the page
4. Try single assignments if bulk fails

### Daily Emails Not Sending

**Problem**: Daily assignment emails not being sent

**Possible causes**:
- No trips for tomorrow
- No active drivers
- Email service issue

**Solution**:
1. Verify there are trips for tomorrow
2. Check that drivers are active
3. Try sending again
4. Check browser console for errors

### Trip List Not Loading

**Problem**: Trips not showing in dashboard

**Possible causes**:
- Filters too restrictive
- No trips in date range
- Loading issue

**Solution**:
1. Clear all filters
2. Check date range
3. Refresh the page
4. Check internet connection

---

## Quick Reference

### Keyboard Shortcuts

- **F5**: Refresh page
- **Ctrl/Cmd + F**: Search (if available)
- **Esc**: Close modals/dialogs

### Airport Codes

- **BUF**: Buffalo Niagara International Airport
- **ROC**: Frederick Douglass Greater Rochester International Airport
- **SYR**: Syracuse Hancock International Airport
- **ALB**: Albany International Airport

### Common Actions

- **Create Trip**: Click "Create Trip" → Fill form → Save
- **Assign Trip**: Click "Assign" → Select driver → Assign
- **Bulk Assign**: Check trips → Click "Assign" → Select driver
- **Edit Trip**: Click "Edit" → Update → Save
- **Delete Trip**: Click "Delete" → Confirm
- **Add Driver**: Manage Drivers → Add Driver → Fill form → Save
- **Add Location**: Manage Locations → Add Location → Fill form → Save

### Dashboard Navigation

- **Management**: Your main dashboard (default)
- **Driver View**: View as driver sees it (for testing)
- **Admin**: Admin dashboard (administrators only)

---

## Getting Help

### Contact Your Administrator

For questions about:
- Company settings
- User permissions
- Account issues
- System configuration

### Technical Support

For technical issues:
- App not loading
- Features not working
- Data not saving
- Error messages

Contact your system administrator or support email.

### Training Resources

- **Driver Guide**: Share with drivers for their reference
- **Quick Start Guide**: For new managers
- **This Guide**: Comprehensive manager reference

---

## Frequently Asked Questions

### Q: Can I assign the same trip to multiple drivers?

**A**: No, each trip can only be assigned to one driver at a time. If you need multiple drivers, create separate trips.

### Q: What happens if I delete a trip that's already assigned?

**A**: The trip will be deleted and the driver will no longer see it. Consider unassigning first if you want to keep the trip but change the driver.

### Q: Can I edit a recurring trip pattern?

**A**: Yes, edit the original recurring trip to change the pattern. This affects all future occurrences.

### Q: How do I know if a driver received a notification?

**A**: The system sends notifications automatically. If a driver says they didn't receive it, check their email/phone and notification preferences.

### Q: Can I create trips for past dates?

**A**: Yes, but it's not recommended. Past trips are typically for record-keeping only.

### Q: What's the difference between "Unassigned" and no driver?

**A**: They're the same - both mean the trip doesn't have a driver assigned yet.

### Q: Can I bulk edit trips?

**A**: Currently, trips must be edited individually. Use bulk assignment to assign multiple trips at once.

### Q: How do I know which trips need drivers?

**A**: Filter by "Unassigned" status or look for trips showing "Unassigned" in the driver column.

### Q: Can I schedule trips weeks in advance?

**A**: Yes! Create trips as far in advance as needed. Use recurring trips for regular schedules.

### Q: What if a driver can't complete an assigned trip?

**A**: Reassign the trip to another driver. The previous driver will be notified of the change.

---

## Tips for Success

💡 **Plan ahead** - Create trips as soon as you know about them  
💡 **Use saved locations** - Saves time and reduces errors  
💡 **Set up recurring trips** - Automate regular schedules  
💡 **Send daily summaries** - Help drivers plan effectively  
💡 **Keep driver info updated** - Ensures notifications work  
💡 **Use bulk actions** - More efficient for multiple items  
💡 **Review unassigned trips daily** - Ensure all trips have drivers  
💡 **Communicate proactively** - Keep drivers informed  

---

## Version Information

- **App Version**: 1.0
- **Last Updated**: January 2025

---

**Thank you for using the Aircrew Transportation Management System!**

For additional support, contact your system administrator.
