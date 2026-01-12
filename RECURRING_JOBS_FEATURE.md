# Recurring Jobs Feature

## Overview
Added support for recurring job scheduling and improved driver view filtering.

## New Features

### 1. Recurring Job Scheduling
- **Checkbox**: Mark a job as recurring when creating/editing
- **Pattern Selection**: Choose from Daily, Weekly, or Monthly recurrence
- **End Date**: Specify when to stop creating recurring jobs
- **Automatic Generation**: System automatically creates future job instances

### 2. Driver View Filtering
- **Time Window**: Drivers only see jobs assigned to them for the next 2 days
- **Status Filter**: Only shows scheduled/assigned jobs (excludes completed)
- **Clear Messaging**: Empty state explains the 2-day filter

## Schema Changes

Added to `Trip` model:
- `isRecurring`: Boolean flag indicating if job is recurring
- `recurringPattern`: String enum ('daily', 'weekly', 'monthly')
- `recurringEndDate`: DateTime when recurring jobs should stop
- `parentTripId`: Reference to the original recurring trip
- `childTrips`: Relationship to generated child trips
- `parentTrip`: Relationship back to parent trip

## How It Works

### Creating Recurring Jobs

1. **Create a Trip** with recurring options:
   - Check "Recurring Job"
   - Select pattern (Daily/Weekly/Monthly)
   - Set end date

2. **System Creates**:
   - Parent trip (the original with recurring metadata)
   - Child trips (individual instances for each occurrence)

3. **Automatic Generation**:
   - On Management Dashboard load, system checks for recurring jobs
   - Generates upcoming trips up to 2 weeks ahead
   - Ensures jobs are always available for scheduling

### Driver View

- **Filtered Display**: Only shows:
  - Jobs assigned to the logged-in driver
  - Scheduled for the next 2 days
  - Status is not "Completed"

- **Empty State**: Clear message explaining the 2-day window

## Usage

### For Managers

1. **Create Recurring Job**:
   ```
   - Click "New Trip"
   - Fill in trip details
   - Check "Recurring Job"
   - Select pattern (e.g., Weekly)
   - Set end date (e.g., 3 months from now)
   - Assign driver (optional)
   - Save
   ```

2. **View Recurring Jobs**:
   - Recurring jobs show a 🔄 indicator in the trip list
   - Parent trip shows recurring metadata
   - Child trips are individual instances

### For Drivers

- **Automatic Filtering**: 
  - Only see assigned jobs for next 2 days
  - No action needed - filtering is automatic
  - Clear empty state if no jobs available

## Technical Details

### Recurring Job Generation

**File**: `src/utils/recurringJobs.ts`

- `generateRecurringTrips()`: Creates initial recurring job instances
- `generateUpcomingRecurringTrips()`: Generates future instances as needed

**Called From**:
- `ManagementDashboard`: On component load
- `TripForm`: When creating a new recurring trip

### Date Calculations

Uses `date-fns` for date manipulation:
- `addDays()`: Daily recurrence
- `addWeeks()`: Weekly recurrence
- `addMonths()`: Monthly recurrence
- `isBefore()`: Date comparisons
- `parseISO()`: Date parsing

## Future Enhancements

Potential improvements:
- Custom recurrence patterns (e.g., every 2 weeks, specific days of week)
- Recurrence editing (modify pattern without recreating)
- Bulk operations on recurring jobs
- Recurrence pause/resume
- Notification when recurring jobs are generated

## Notes

- Recurring jobs are generated up to 2 weeks in advance
- Child trips inherit driver assignment from parent
- Each child trip can be edited independently
- Deleting parent trip doesn't automatically delete children (by design)
- Recurring end date must be in the future
