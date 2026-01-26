# Manager User Guide - Onyx Transportation App

Welcome! This guide will help you manage trips, drivers, and locations in the Onyx Transportation App.

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
11. [Subscription Management](#subscription-management)
12. [Troubleshooting](#troubleshooting)

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
- **Calendar View**: Visual calendar showing trips by date
- **Quick Actions**: Buttons to create trips, manage drivers, manage locations
- **Filters**: View trips by date, location category, driver, or status
- **Bulk Actions**: Assign or delete multiple trips at once
- **Reports**: Driver Reports and Trip Reports for analytics

### Main Sections

1. **Header Bar**
   - Create Trip button
   - Manage Drivers button
   - Manage Locations button (Basic/Premium plans)
   - Filter Categories button (manage custom filters)
   - Configuration dropdown:
     - Custom Fields (Basic/Premium plans)
     - Report Configuration (Premium plan)
     - Company Settings (if you're an admin)
     - **Subscription Management** (view and manage your subscription)
   - Driver Reports button (view driver statistics)
   - Trip Reports button (view trip analytics)
   - Send Daily Assignment Emails button
   - Delete All Trips button (use with caution)

2. **View Toggle**
   - **List View**: Table/card view of all trips
   - **Calendar View**: Visual calendar showing trips by date

3. **Filters Section**
   - Location category filters (custom categories you create)
   - Quick date filters (Today, Tomorrow, This Week, etc.)
   - Driver filter
   - Status filter
   - Custom filter categories (if configured)

4. **Trip List/Calendar**
   - **List View**: Table view (desktop) or card view (mobile)
   - **Calendar View**: Monthly calendar with clickable dates
   - Shows all trip information
   - **Click on trip row or "Trip Type" column** to edit trip
   - Actions: Edit, Delete, Assign

---

## Creating Trips

### Step-by-Step: Creating a New Trip

1. **Click "Create Trip"** in the Management Dashboard

2. **Select Trip Type** (Required)
   - **Airport Trip**: Standard airport transportation with a flight number
   - **Standard Trip**: Non-airport transportation with a job number, PO number, or other identifier
   - This determines which fields are shown and required

3. **Enter Trip Identifier**
   
   **For Airport Trips:**
   - **Flight Number**: Enter the airline code and number (e.g., UA1234, DL5678)
   - Must follow format: 2-3 letters followed by 1-4 digits
   - Required field
   
   **For Standard Trips:**
   - **Job/PO Number**: Enter any identifier (e.g., "PO-12345", "Job-2025-001")
   - No format restrictions
   - Required field

4. **Set Date and Time**
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
   - **Phone**: Phone number (optional)
   - **License Number**: Driver's license number
   - **Notification Preference**: 
     - Email Only
     - Both (Email & In-App)
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
- **Phone**: Phone number (optional, for contact purposes)
- **License Number**: For record keeping
- **Notification Preference**: How driver receives notifications
- **Active Status**: Whether driver can receive assignments

### Notification Preferences Explained

- **Email Only**: Driver receives notifications only via email
- **Both (Email & In-App)**: Driver receives notifications via both email and in-app browser notifications

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
   - **Category**: Location category (e.g., "Airport", "Hotel", "Office", "Other")
     - Categories help with filtering and organization
     - Use consistent categories for better filtering
   - **Active**: Check to make location available
3. Click **"Save"**

### Adding Default Airports

Quick way to add common airport locations:

1. Click **"+ Add Default Airports"** button
2. Confirm the action
3. The system will add:
   - Buffalo Niagara International Airport (BUF)
   - Frederick Douglass Greater Rochester International Airport (ROC)
   - Syracuse Hancock International Airport (SYR)
   - Albany International Airport (ALB)
4. All airports are added with "Airport" category
5. Existing airports are skipped (won't create duplicates)

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
2. Choose from your saved locations (grouped by category)
3. The address will be automatically filled in
4. The location's category is automatically assigned to the trip

**Benefits**:
- Faster trip creation
- Consistent address formatting
- Reduced typing errors
- Automatic category assignment for filtering

### Location Categories

Locations can be assigned categories:
- **Airport**: Airport locations
- **Hotel**: Hotel locations
- **Office**: Office/business locations
- **Other**: Other location types
- **Custom**: Create your own categories

Categories help with:
- Filtering trips
- Organizing locations
- Auto-populating filter values

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

### View Modes

You can view trips in two ways:

#### List View
- Table view (desktop) or card view (mobile)
- Shows all trip information in a list
- Click on any row or "Trip Type" column to edit

#### Calendar View
- Visual monthly calendar
- Days with trips are highlighted
- Click on a date to see all trips for that day
- Navigate between months with arrow buttons
- Click "Today" to jump to current month

**Switch Views**: Use the view toggle buttons (📋 List / 📅 Calendar) in the dashboard header.

### Trip List View

The trip list shows:
- **Category**: Location category or airport code
- **Pickup Date**: Date of pickup
- **Pickup Time**: Time of pickup
- **Flight Number/Identifier**: Flight number (Airport Trip) or job/PO number (Standard Trip)
- **Flight Status**: Check flight status button (tier-based)
- **Pickup Location**: Where to pick up
- **Dropoff Location**: Where to drop off
- **Passengers**: Number of passengers
- **Driver**: Assigned driver (or "Unassigned")
- **Status**: Trip status (Unassigned, Assigned, In Progress, Completed)
- **Actual Pickup**: Time when trip was started (time only)
- **Actual Dropoff**: Time when trip was completed (time only)
- **Actions**: Edit, Delete buttons

**Note**: Table headers wrap for better readability, and times are shown in HH:mm format for compact display.

### Filtering Trips

#### By Location Category

Use custom filter categories:
- **Filter Categories**: Click "Filter Categories" to create custom filters
- **Location Categories**: Filter by pickup/dropoff location categories (e.g., "Airport", "Hotel", "Office")
- **Auto-Generated Values**: Filter categories can auto-populate from existing trips and locations
- **Multiple Filters**: Combine multiple filters for precise searches

#### By Airport/Location

- **All**: Shows all trips
- **Specific Categories**: Shows only trips matching that category
- Your company's configured location categories will appear as filter options

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
- Calendar view is optimized for touch interaction

---

## Driver Reports

### Accessing Driver Reports

Click **"📊 Driver Reports"** in the Management Dashboard header.

### What You Can View

**Summary View:**
- Total trips per driver
- Breakdown by status (Completed, Assigned, In Progress, Unassigned)
- Trips grouped by airline
- Date ranges for each driver's trips

**Driver Detail View:**
- Individual driver statistics
- All trips for that driver
- Trips grouped by airline
- Complete trip history

**Airline View:**
- All trips for a specific airline
- Driver assignments
- Trip details and status

### Features

- **Date Range Filtering**: Filter trips by start and end dates
- **Status Filtering**: Show only completed trips
- **Export to Excel**: Download comprehensive reports as Excel files
- **Print Support**: Print-friendly formatting
- **Click to Edit**: Click on trips to edit them

### Using Driver Reports

1. **Open Driver Reports**: Click "📊 Driver Reports" button
2. **Set Filters** (optional):
   - Start date
   - End date
   - Completed only checkbox
3. **View Summary**: See overview of all drivers
4. **View Driver Details**: Click "View Details" on any driver
5. **View by Airline**: Click "View All" on any airline breakdown
6. **Export**: Click "📥 Export Excel" to download report

---

## Trip Reports

### Accessing Trip Reports

Click **"📋 Trip Reports"** in the Management Dashboard header.

### What You Can View

**Summary View:**
- Total trips
- Breakdown by status
- Total passengers
- Date ranges

**By Status:**
- Trips grouped by status (Unassigned, Assigned, In Progress, Completed)
- Trip counts and passenger totals per status

**By Airline:**
- Trips grouped by airline code
- Trip counts and passenger totals per airline

**By Location:**
- Trips grouped by pickup/dropoff locations
- Pickup count, dropoff count, and total trips per location

**By Driver:**
- Trips grouped by driver
- Completed trips per driver
- Total passengers per driver

**All Trips:**
- Complete list of all trips with full details
- Sortable and filterable

### Features

- **Comprehensive Filtering**:
  - Date range (start/end dates)
  - Status filter
  - Location filter
  - Airline filter
  - Driver filter
- **Export to Excel**: Multi-sheet Excel file with all data
- **Print Support**: Print-friendly formatting
- **Click to Edit**: Click on trips to edit them

### Using Trip Reports

1. **Open Trip Reports**: Click "📋 Trip Reports" button
2. **Set Filters** (optional):
   - Start date, end date
   - Status, location, airline, driver
3. **Select View Mode**: Summary, By Status, By Airline, By Location, By Driver, or All Trips
4. **Export**: Click "📥 Export Excel" to download comprehensive report
5. **Print**: Click "🖨️ Print" for print-friendly view

---

## Filter Categories

### What Are Filter Categories?

Filter categories allow you to create custom filters for trips based on various criteria. This helps you quickly find and organize trips.

### Creating Filter Categories

1. Click **"Filter Categories"** in the Management Dashboard
2. Click **"+ Add Filter Category"**
3. Fill in the form:
   - **Category Name**: Descriptive name (e.g., "Airport Locations", "Service Types")
   - **Filter Field**: What to filter on
     - Location Category (Any - Pickup or Dropoff)
     - Primary Location Category (Pickup Only)
     - Other fields as needed
   - **Values**: Filter values (comma-separated)
   - **Display Order**: Order for display (lower numbers appear first)
   - **Active**: Check to enable the filter
4. Click **"Auto-fill"** to automatically populate values from existing trips and locations
5. Click **"Create Category"**

### Using Auto-Fill

The Auto-fill feature automatically extracts:
- Location categories from saved locations
- Airport codes from location names (e.g., "BUF" from "Buffalo Niagara International Airport (BUF)")
- Categories from existing trips
- Both pickup and dropoff location categories

This saves time and ensures consistency.

### Managing Filter Categories

- **Edit**: Click "Edit" to modify a filter category
- **Delete**: Click "Delete" to remove a filter category
- **Activate/Deactivate**: Edit the category and toggle "Active" status

### Using Filters

Once created, filter categories appear in the trip filters section:
- Click on filter category buttons to filter trips
- Combine with other filters (date, driver, status)
- Filters persist until you clear them

---

## Daily Assignment Emails

### What Are Daily Assignment Emails?

Daily assignment emails are summaries sent to drivers showing their trips for the following day. This helps drivers plan their schedule.

### Sending Daily Assignment Emails

You can send to all drivers or select a specific driver:

#### Option 1: Send to All Drivers

1. Click **"Send Daily Assignment Emails"** in the Management Dashboard
2. Click **"OK"** when asked if you want to send to all drivers
3. Confirm sending emails
4. Emails will be sent to all eligible drivers

#### Option 2: Send to Specific Driver

1. Click **"Send Daily Assignment Emails"** in the Management Dashboard
2. Click **"Cancel"** when asked about sending to all drivers
3. **Select a driver** from the driver selection dialog
4. Click **"Continue"**
5. Confirm sending email to the selected driver
6. Email will be sent to the driver

**Note**: Only drivers with trips scheduled for tomorrow will receive emails. Drivers without trips are automatically skipped.

### What Drivers Receive

**Email Format**:
- List of all trips for tomorrow
- Pickup times
- Pickup locations
- Basic trip information
- Note to check app for full details

### When to Send

**Best Practices**:
- Send in the evening (after 6 PM) for next day's trips
- Send after all trips for tomorrow are created and assigned
- Send daily for consistency
- Consider automating (if available)

### Notification Preferences

The system respects each driver's notification preference:
- Drivers set to "Email Only" receive email only
- Drivers set to "Both" receive both email and in-app notifications

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

**Multiple Ways to Edit:**

1. **Click "Edit" button** next to the trip
2. **Click on the trip row** in the table (anywhere on the row)
3. **Click on "Trip Type" column** (shows Airport Trip or Standard Trip)

After clicking, the trip editing modal will open where you can:
- Update trip type (Airport Trip ↔ Standard Trip)
- Change flight number or job identifier
- Update dates, times, locations
- Modify passenger information
- View GPS location information (if driver has started/completed trip)
- View reverse geocoded addresses (converted from GPS coordinates)

**Note**: If the trip is assigned, the driver will be notified of changes.

### Viewing GPS Location Information

When editing a trip, you can see:
- **Start Location**: GPS coordinates where driver started the trip (if recorded)
- **Complete Location**: GPS coordinates where driver completed the trip (if recorded)
- **Reverse Geocoded Addresses**: Human-readable addresses converted from GPS coordinates
- **Google Maps Links**: Click to view location on Google Maps

**Note**: GPS information is only visible in the Management Dashboard, not in the Driver Dashboard.

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

## Subscription Management

### Understanding Your Subscription

Your company's subscription determines which features you have access to:

- **Free Tier**: Up to 10 trips/month, basic features
- **Basic Plan** ($59/month): Unlimited trips, location management, custom fields
- **Premium Plan** ($129/month): Everything in Basic plus advanced reports and flight status API

### Accessing Subscription Management

1. Click **Configuration** in the Management Dashboard header
2. Select **Subscription Management**
3. View your current plan, status, and features

### Trial Period

If you're on a free trial:
- You'll see a banner at the top of your dashboard
- The banner shows days remaining in your trial
- Subscribe anytime during your trial to continue using premium features
- If your trial expires, your account automatically moves to the Free tier

### Upgrading Your Plan

1. Go to **Configuration** → **Subscription Management**
2. Review available plans and their features
3. Click **"Upgrade to [Plan Name]"** on the plan you want
4. Complete checkout through Stripe
5. Your subscription activates immediately

### Managing Billing

1. Go to **Subscription Management**
2. Click **"Manage Billing"**
3. You'll be redirected to Stripe Customer Portal where you can:
   - Update payment methods
   - View billing history
   - Download invoices
   - Cancel your subscription

### Feature Access

Some features are restricted by subscription tier:
- **Location Management**: Available on Basic and Premium plans
- **Custom Fields**: Available on Basic and Premium plans
- **Custom Report Configuration**: Available on Premium plan only
- **Unlimited Trips**: Available on Basic and Premium plans (Free tier limited to 10/month)

If you try to access a restricted feature, you'll see a lock icon (🔒) and an upgrade prompt.

**For complete subscription details, see [SUBSCRIPTION_AND_TRIAL_GUIDE.md](./SUBSCRIPTION_AND_TRIAL_GUIDE.md)**

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
- Email address incorrect
- Notification preference not set
- Email in spam folder

**Solution**:
1. Verify driver's email address in their profile
2. Check notification preference is set correctly
3. Ask driver to check spam folder
4. Ensure email notifications are enabled

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

## Recent Updates

### New Features:
- **Trip Type Selection**: Choose between Airport Trip (with flight number) or Standard Trip (with job/PO number)
- **Driver Reports**: Comprehensive reporting on driver performance, trips by airline, and statistics
- **Trip Reports**: Analytics on trips by status, airline, location, and driver
- **Calendar View**: Visual calendar showing trips by date
- **Filter Categories**: Create custom filters for better trip organization
- **Location Categories**: Categorize locations for better filtering and organization
- **GPS Location Tracking**: View GPS coordinates and reverse geocoded addresses for trips
- **Tier-Based Flight Status**: Premium tier uses API, standard tier uses FlightRadar24
- **Daily Assignment Email Selection**: Choose to send to all drivers or a specific driver
- **Improved Table Layouts**: Better desktop viewing without horizontal scrolling
- **Click to Edit**: Click on trip rows or "Trip Type" column to quickly edit trips

---

**Thank you for using the Onyx Transportation App!**

For additional support, contact your system administrator.
