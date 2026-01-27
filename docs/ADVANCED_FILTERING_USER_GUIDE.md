# Advanced Trip Filtering & Search User Guide

**Last Updated:** January 27, 2026

Advanced Filtering and Search help you find trips quickly and save your favorite filter combinations for instant access. Perfect for managing large numbers of trips efficiently!

---

## What Is Advanced Filtering?

Advanced Filtering includes:
- **Enhanced Search**: Search across multiple fields including notes
- **Saved Filter Presets**: Save and load common filter combinations
- **Multi-Criteria Filtering**: Combine multiple filters for precise results

---

## Access Requirements

- Available to all users
- No subscription tier restrictions
- Access via Trip List filters section

---

## Enhanced Search

### What It Searches
The search bar now searches across:
- ✅ Flight numbers
- ✅ Pickup locations
- ✅ Dropoff locations
- ✅ Customer names
- ✅ Customer company names
- ✅ **Trip notes** (new!)

### How to Use
1. Type in the search box at the top of the Trip List
2. Results filter in **real-time** as you type
3. Search is **case-insensitive**
4. Searches all fields simultaneously

### Search Examples

**Search by Flight:**
- Type: `AA1234`
- Finds: All trips with flight number containing "AA1234"

**Search by Location:**
- Type: `airport`
- Finds: All trips with "airport" in pickup or dropoff location

**Search by Customer:**
- Type: `John`
- Finds: All trips for customers named "John" or company "John's Corp"

**Search by Notes:**
- Type: `special`
- Finds: All trips with "special" in notes or trip notes

### Search Tips
- ✅ **Be Specific**: More specific terms = better results
- ✅ **Use Partial Words**: Search "buff" to find "Buffalo"
- ✅ **Combine with Filters**: Use search + other filters for precision
- ✅ **Clear Search**: Click "Clear All" or delete search text

---

## Saved Filter Presets

### What Are Filter Presets?
Saved combinations of filters that you can load with one click. Perfect for common views like "Today's Unassigned Trips" or "This Week's Completed Trips".

### Creating a Preset

#### Step 1: Set Up Your Filters
Configure all the filters you want to save:
- Status filter
- Driver filter
- Customer filter
- Date range
- Custom filters
- Search term
- Sort options

#### Step 2: Save the Preset
1. Click **"Save Preset"** button (appears when filters are active)
2. Enter a descriptive name:
   - ✅ Good: "Today's Unassigned", "This Week Completed"
   - ❌ Bad: "Filter 1", "Test"
3. Click **"Save Preset"**
4. Preset is saved and ready to use!

### Loading a Preset

#### Step 1: Open Preset Menu
1. Click **"Load Preset"** button
2. Dropdown shows all your saved presets

#### Step 2: Select Preset
1. Click on a preset name
2. All filters are automatically applied
3. Trip list updates instantly

### Managing Presets

#### Delete a Preset
1. Click **"Load Preset"**
2. Find the preset in the dropdown
3. Click delete icon (🗑️) next to preset
4. Confirm deletion
5. Preset is removed

#### Edit a Preset
1. Load the preset
2. Adjust filters as needed
3. Save with the same name (overwrites) or new name (creates new)

### Preset Storage
- **Location**: Stored in your browser (localStorage)
- **Scope**: Per company (each company has separate presets)
- **Limitation**: Only available on the device/browser where saved
- **Backup**: Not synced across devices (coming soon!)

---

## Filter Options

### Status Filter
Filter trips by status:
- All Statuses
- Unassigned
- Assigned
- In Progress
- Completed

### Driver Filter
Filter trips by driver:
- All Drivers
- Unassigned
- Specific driver

### Customer Filter
Filter trips by customer:
- All Customers
- No Customer
- Specific customer

### Date Filters

#### Quick Date Filters
- **All Trips**: No date restriction
- **Today**: Today's trips only
- **This Week**: Current week (Monday-Sunday)
- **Next Week**: Upcoming week
- **Custom Range**: Specify start and end dates

#### Custom Date Range
1. Select **"Custom Range"**
2. Choose **"From Date"**
3. Choose **"To Date"**
4. Trips within range are shown

### Recurring Filter
Filter by trip type:
- All Jobs
- Recurring Only
- One-Time Only

### Custom Filters
Additional filters based on your company's filter categories:
- Location categories
- Airport codes
- Custom fields (if configured)

### Sort Options
Sort trips by:
- Pickup Date (default)
- Flight Number
- Status
- Driver
- Ascending or Descending

---

## Combining Filters

### Multiple Filters
You can combine any filters:
- ✅ Status + Driver + Date
- ✅ Customer + Date Range + Search
- ✅ All filters together

### Filter Logic
- Filters work together (AND logic)
- All selected filters must match
- Example: "Unassigned" + "Today" = Unassigned trips today only

### Clearing Filters
- **Clear All**: Click "Clear All" button
- **Individual**: Change filter back to "All" or default
- **Search**: Delete search text

---

## Best Practices

### Creating Useful Presets
- ✅ **Descriptive Names**: Use clear, descriptive names
- ✅ **Common Views**: Save presets for views you use daily
- ✅ **Organize**: Use consistent naming (e.g., "Today - Unassigned")
- ✅ **Review**: Delete presets you no longer use

### Efficient Filtering
- ✅ **Start Broad**: Use quick filters first (Today, This Week)
- ✅ **Narrow Down**: Add specific filters as needed
- ✅ **Use Search**: Combine search with filters for precision
- ✅ **Save Common**: Save frequently used combinations

### Search Tips
- ✅ **Be Specific**: More specific = better results
- ✅ **Use Filters**: Combine search with filters
- ✅ **Clear When Done**: Clear search to see all trips
- ✅ **Notes Search**: Search note content for special instructions

---

## Workflow Examples

### Daily Morning Routine
1. Load preset: "Today's Unassigned"
2. Review unassigned trips
3. Assign drivers as needed

### Weekly Reporting
1. Load preset: "This Week Completed"
2. Export to CSV
3. Generate reports

### Finding Specific Trip
1. Use search: Type customer name or flight number
2. Results appear instantly
3. Open trip from results

### End of Day Cleanup
1. Filter: Today + "In Progress"
2. Select all
3. Bulk update to "Completed"
4. Save as preset: "End of Day - Complete"

---

## Troubleshooting

### Search Not Working
- **Check**: Are you typing in the search box?
- **Try**: Clear search and try again
- **Check**: Do trips match your search term?

### Preset Not Saving
- **Check**: Are filters active?
- **Check**: Did you enter a preset name?
- **Try**: Refresh page and try again

### Preset Not Loading
- **Check**: Is preset saved on this device/browser?
- **Note**: Presets are browser-specific
- **Try**: Refresh page

### Filters Not Applying
- **Check**: Are filters set correctly?
- **Try**: Clear all and start over
- **Check**: Do trips match filter criteria?

---

## FAQ

**Q: How many presets can I save?**  
A: There's no limit! Save as many as you need.

**Q: Can I share presets with other users?**  
A: Currently, presets are personal (browser-specific). Sharing coming soon!

**Q: Are presets synced across devices?**  
A: Not yet. Presets are stored in your browser. Cloud sync coming soon!

**Q: Can I search in trip notes?**  
A: Yes! The search bar searches both trip notes and the notes field.

**Q: Do filters persist when I refresh?**  
A: Currently, filters reset on refresh. Preset loading coming soon!

**Q: Can I export filtered results?**  
A: Yes! Use "Export All" to export filtered trips to CSV.

---

## Related Features

- **Bulk Operations**: Use filters before bulk actions
- **Trip Notes**: Search notes content with enhanced search
- **Trip Templates**: Filter trips created from templates (coming soon)

---

*Need more help? Contact support@tazsoftware.biz or visit our documentation.*
