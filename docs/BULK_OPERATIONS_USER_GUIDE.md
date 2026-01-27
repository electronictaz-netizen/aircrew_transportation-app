# Bulk Trip Operations User Guide

**Last Updated:** January 27, 2026

Bulk Operations allow you to manage multiple trips at once, saving time and improving efficiency. Perfect for end-of-day updates, weekly reports, and large-scale trip management!

---

## What Are Bulk Operations?

Bulk Operations let you select multiple trips and perform actions on all of them simultaneously. Instead of updating trips one by one, you can:
- Update status for multiple trips
- Assign multiple trips to a driver
- Delete multiple trips
- Export trip data to CSV

---

## Access Requirements

- Available to all users with trip management permissions
- Managers and Administrators have full access
- No subscription tier restrictions

---

## Selecting Trips

### Individual Selection
1. In the Trip List, check the checkbox next to each trip you want to select
2. Selected trips are highlighted
3. The selection count appears in the bulk actions toolbar

### Select All
1. Check the checkbox in the table header (next to "Category")
2. All visible trips are selected
3. **Note**: Only selects trips currently visible (respects filters)

### Deselect All
1. Uncheck the header checkbox, or
2. Click individual checkboxes to deselect

### Selection Tips
- ✅ Use filters first to narrow down trips
- ✅ "Select All" only selects filtered/visible trips
- ✅ Selection persists when scrolling
- ✅ Clear selection by clicking "Clear All" or refreshing

---

## Bulk Status Update

### What It Does
Change the status of multiple trips at once.

### When to Use
- End-of-day: Mark all completed trips as "Completed"
- Morning routine: Update overnight trips to "In Progress"
- Weekly cleanup: Update status for multiple trips
- Status corrections: Fix incorrect statuses in bulk

### How to Use
1. **Select Trips**: Check boxes next to trips you want to update
2. **Click "Update Status"**: Button appears in bulk actions toolbar
3. **Choose New Status**: Select from dropdown:
   - Unassigned
   - Assigned
   - In Progress
   - Completed
4. **Confirm**: Click "Update Status" to apply
5. **Result**: All selected trips are updated instantly

### Example Workflow
**End of Day Cleanup:**
1. Filter trips by date (today)
2. Filter by status ("In Progress")
3. Select all visible trips
4. Click "Update Status"
5. Choose "Completed"
6. All trips marked as completed!

---

## Bulk Export to CSV

### What It Does
Export trip data to a CSV file for reporting, backup, or analysis.

### Export Options

#### Export Selected Trips
1. Select trips using checkboxes
2. Click **"Export (N)"** where N is the number selected
3. CSV file downloads automatically

#### Export All Trips
1. Click **"Export All"** button (no selection needed)
2. All trips are exported to CSV
3. **Note**: Respects current filters (exports filtered results)

### CSV File Contents

The exported CSV includes:
- **Trip Information**:
  - Trip ID
  - Category/Airport
  - Pickup Date & Time
  - Flight/Job Number
  - Pickup Location
  - Dropoff Location
  - Number of Passengers

- **Assignment Information**:
  - Customer Name
  - Driver Name
  - Status
  - Actual Pickup Time
  - Actual Dropoff Time

- **Financial Information**:
  - Trip Rate
  - Driver Pay Amount

- **Additional Information**:
  - Notes
  - Recurring Status
  - Parent Trip ID (for recurring trips)

### Using Exported Data
- 📊 **Reporting**: Import into Excel/Google Sheets for analysis
- 💾 **Backup**: Keep records of trips
- 📈 **Analytics**: Analyze trends and patterns
- 📧 **Sharing**: Send to accountants, managers, or clients

### Export Tips
- ✅ Use filters before exporting to get specific data
- ✅ Export weekly/monthly for regular reporting
- ✅ CSV files open in Excel, Google Sheets, or any spreadsheet app
- ✅ File names include timestamp for easy organization

---

## Bulk Assign to Driver

### What It Does
Assign multiple trips to a single driver at once.

### When to Use
- Assigning a driver's daily route
- Reassigning trips when a driver calls out
- Balancing workload between drivers
- Quick assignment for new drivers

### How to Use
1. **Select Trips**: Check boxes next to trips to assign
2. **Click "Assign to Driver"**: Button in bulk actions toolbar
3. **Choose Driver**: Select from dropdown
4. **Confirm**: All selected trips are assigned

### Example Workflow
**Assigning Daily Route:**
1. Filter trips by date (today)
2. Filter by status ("Unassigned")
3. Select all visible trips
4. Click "Assign to Driver"
5. Choose driver
6. All trips assigned!

---

## Bulk Delete

### What It Does
Delete multiple trips at once.

### When to Use
- Remove test trips
- Clean up cancelled trips
- Delete duplicate entries
- End-of-month cleanup

### How to Use
1. **Select Trips**: Check boxes next to trips to delete
2. **Click "Delete Selected (N)"**: Button in bulk actions toolbar
3. **Confirm**: Review the confirmation dialog
4. **Confirm Deletion**: Click "Delete" to proceed
5. **Result**: All selected trips are deleted

### ⚠️ Warning
- **Cannot be undone**: Deleted trips are permanently removed
- **Use with caution**: Double-check your selection before confirming
- **Consider**: Use status updates instead if you want to keep records

---

## Best Practices

### Efficiency Tips
- ✅ **Filter First**: Use filters to narrow down trips before selecting
- ✅ **Select All**: Use "Select All" for quick bulk actions on filtered results
- ✅ **Regular Exports**: Export data weekly/monthly for reporting
- ✅ **Status Updates**: Use bulk status updates for end-of-day cleanup

### Safety Tips
- ⚠️ **Review Selection**: Always check selected trips before bulk actions
- ⚠️ **Test First**: Try on a small selection before bulk operations
- ⚠️ **Backup**: Export data before bulk deletes
- ⚠️ **Confirmation**: Read confirmation dialogs carefully

### Workflow Examples

#### Daily End-of-Day Routine
1. Filter: Today's date + "In Progress" status
2. Select all
3. Bulk update status to "Completed"
4. Export today's trips to CSV
5. Done in 30 seconds!

#### Weekly Reporting
1. Filter: Last 7 days
2. Export all to CSV
3. Open in Excel for analysis
4. Create reports and charts

#### Driver Assignment
1. Filter: Tomorrow's date + "Unassigned"
2. Select all
3. Bulk assign to driver
4. All trips assigned at once!

---

## Troubleshooting

### Selection Not Working
- **Check**: Are checkboxes visible?
- **Try**: Refresh the page
- **Check**: Do you have permission to manage trips?

### Export Not Downloading
- **Check**: Browser pop-up blocker settings
- **Try**: Right-click "Export" and "Save Link As"
- **Check**: Browser download settings

### Bulk Action Not Available
- **Check**: Are trips selected?
- **Check**: Do you have permission for the action?
- **Try**: Refresh the page

### Status Update Failed
- **Check**: Are all selected trips in valid state for update?
- **Try**: Update smaller batches
- **Contact**: Support if issue persists

---

## FAQ

**Q: How many trips can I select at once?**  
A: There's no limit! Select as many as you need.

**Q: Can I undo a bulk action?**  
A: Status updates can be reversed. Deletes cannot be undone.

**Q: Does "Select All" select filtered trips only?**  
A: Yes, it only selects trips currently visible (respects all filters).

**Q: Can I export specific trip fields?**  
A: Currently exports all fields. Custom field selection coming soon.

**Q: Are bulk operations available on mobile?**  
A: Yes, but selection may be easier on desktop.

---

## Related Features

- **Trip Templates**: Create multiple trips from templates
- **Advanced Filtering**: Filter trips before bulk operations
- **Trip Notes**: Add notes to trips after bulk updates

---

*Need more help? Contact support@tazsoftware.biz or visit our documentation.*
