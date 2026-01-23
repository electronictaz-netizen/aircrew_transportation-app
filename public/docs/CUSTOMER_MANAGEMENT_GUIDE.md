# Customer Management Guide - Onyx Transportation App

This guide will help you manage customers in the Onyx Transportation App. Customer management allows you to track customer information, assign customers to trips, and filter trips by customer for better organization and reporting.

## Table of Contents

1. [Overview](#overview)
2. [Accessing Customer Management](#accessing-customer-management)
3. [Adding a New Customer](#adding-a-new-customer)
4. [Editing Customer Information](#editing-customer-information)
5. [Deleting Customers](#deleting-customers)
6. [Assigning Customers to Trips](#assigning-customers-to-trips)
7. [Filtering Trips by Customer](#filtering-trips-by-customer)
8. [Customer Status (Active/Inactive)](#customer-status-activeinactive)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

Customer Management helps you:
- **Organize your trips** by tracking which customer each trip is for
- **Maintain customer records** with contact information and notes
- **Filter and search** trips by customer for quick access
- **Generate reports** based on customer activity
- **Track customer history** across all their trips

---

## Accessing Customer Management

1. Log in to the Onyx Transportation App
2. Navigate to the **Management Dashboard**
3. Click the **"Data Management"** dropdown button in the top navigation
4. Select **"Manage Customers"** from the dropdown menu

The Customer Management modal will open, showing all your customers in a table format.

---

## Adding a New Customer

### Step 1: Open the Customer Form

1. In the Customer Management modal, click the **"+ Add Customer"** button
2. The customer form will appear at the top of the modal

### Step 2: Fill in Customer Information

**Required Fields:**
- **Customer Name*** - The customer's full name (e.g., "John Smith" or "ABC Corporation")

**Optional Fields:**
- **Email** - Customer's email address (e.g., "customer@example.com")
- **Phone** - Customer's phone number (e.g., "(555) 123-4567")
- **Company/Organization** - If the customer represents a company (e.g., "ABC Corporation")
- **Notes** - Additional information about the customer (e.g., preferences, special instructions)
- **Active Status** - Checkbox to mark customer as active (available for selection)

### Step 3: Save the Customer

1. Review all entered information
2. Click the **"Create Customer"** button
3. A success message will confirm the customer was created
4. The customer will appear in the customers table

**Tips:**
- Use clear, consistent naming conventions for customer names
- Include company names in the "Company/Organization" field for business customers
- Add notes about customer preferences or special requirements

---

## Editing Customer Information

### Step 1: Find the Customer

1. In the Customer Management modal, locate the customer in the table
2. You can scroll through the list or use the table to find them

### Step 2: Open the Edit Form

1. Click the **✏️ (Edit)** button in the Actions column for the customer you want to edit
2. The form will populate with the customer's current information

### Step 3: Update Information

1. Modify any fields you want to change
2. All fields can be edited except the customer name (which can be changed)
3. Click the **"Update Customer"** button to save changes

**Note:** Changes are saved immediately and will be reflected in all trips assigned to this customer.

---

## Deleting Customers

### Single Customer Deletion

1. In the Customer Management modal, find the customer you want to delete
2. Click the **🗑️ (Delete)** button in the Actions column
3. A confirmation dialog will appear asking you to confirm the deletion
4. Click **"Confirm"** to delete the customer

**Warning:** Deleting a customer will remove them from the system, but trips that were assigned to this customer will retain the customer reference. The customer will no longer appear in dropdowns for new trips.

### Bulk Deletion

1. Check the boxes next to multiple customers you want to delete
2. Or click the checkbox in the table header to select all customers
3. Click the **"Delete Selected"** button that appears
4. Confirm the deletion in the dialog

---

## Assigning Customers to Trips

### When Creating a New Trip

1. When creating a new trip, you'll see a **"Customer"** dropdown field
2. The dropdown appears between the "Driver Assigned" and "Vehicles Assigned" fields
3. Click the dropdown to see all active customers
4. Select the customer for this trip
5. The customer name (and company name if applicable) will be displayed

### When Editing an Existing Trip

1. Open the trip you want to edit
2. Find the **"Customer"** dropdown field
3. Select a customer from the dropdown, or change the selection
4. Save the trip

**Note:** Customer assignment is optional. You can leave trips unassigned if needed.

---

## Filtering Trips by Customer

### Using the Customer Filter

1. In the Management Dashboard, locate the trip filters section
2. Click **"Show Advanced Filters"** if the filters are hidden
3. Find the **"Customer"** dropdown in the Advanced Filters section
4. Select a customer from the dropdown to filter trips
5. The trip list will update to show only trips for that customer

### Filter Options

- **All Customers** - Shows all trips regardless of customer
- **No Customer** - Shows only trips that don't have a customer assigned
- **[Customer Name]** - Shows only trips for the selected customer

### Combining Filters

You can combine the customer filter with other filters:
- Filter by customer AND status (e.g., "Completed trips for John Smith")
- Filter by customer AND date range
- Filter by customer AND driver

---

## Customer Status (Active/Inactive)

### Active Customers

- **Active customers** appear in dropdown menus when creating or editing trips
- They are available for selection and assignment
- Active customers are shown with a green "Active" status badge

### Inactive Customers

- **Inactive customers** do not appear in trip dropdown menus
- They remain in the system for historical reference
- Inactive customers are shown with a red "Inactive" status badge
- You can still view and edit inactive customers

### Changing Customer Status

1. Edit the customer (click the ✏️ button)
2. Check or uncheck the **"Active"** checkbox
3. Click **"Update Customer"** to save

**Use Cases:**
- Mark customers as inactive if they're no longer using your service
- Keep inactive customers for historical reporting
- Reactivate customers if they return

---

## Best Practices

### 1. Consistent Naming

- Use full names for individuals (e.g., "John Smith" not "John")
- Use company names for business customers
- Be consistent with formatting (e.g., always use "Inc." or always spell it out)

### 2. Complete Information

- Fill in email and phone when available for easy contact
- Use the Company/Organization field for business customers
- Add notes about preferences, special requirements, or important information

### 3. Regular Maintenance

- Review and update customer information periodically
- Mark inactive customers as inactive rather than deleting them
- Clean up duplicate entries if they occur

### 4. Using Customer Assignment

- Assign customers to all trips when possible for better organization
- Use customer filtering to quickly find all trips for a specific customer
- Generate reports filtered by customer for customer-specific insights

### 5. Notes Field

- Document customer preferences (e.g., "Prefers SUV", "Wheelchair accessible")
- Note special instructions (e.g., "Call 30 minutes before pickup")
- Record important information (e.g., "VIP customer", "Corporate account")

---

## Troubleshooting

### Customer Not Appearing in Dropdown

**Problem:** A customer exists but doesn't appear when creating/editing trips.

**Solutions:**
- Check if the customer is marked as "Active" in Customer Management
- Only active customers appear in trip dropdowns
- Edit the customer and ensure the "Active" checkbox is checked

### Can't Find a Customer

**Problem:** You know a customer exists but can't find them in the list.

**Solutions:**
- Check if they're marked as inactive (they'll still be in the table)
- Scroll through the entire customer list
- Use the search functionality in trip filters to find trips assigned to that customer

### Customer Information Not Updating

**Problem:** You edited a customer but the changes aren't showing.

**Solutions:**
- Refresh the page and check again
- Ensure you clicked "Update Customer" after making changes
- Check if you're looking at the correct customer record

### Bulk Delete Not Working

**Problem:** Selected customers aren't being deleted.

**Solutions:**
- Ensure you've selected at least one customer (checkbox is checked)
- Check that the "Delete Selected" button is visible
- Confirm the deletion in the dialog that appears
- Check for any error messages

### Customer Assigned to Trip But Not Showing

**Problem:** A trip has a customer assigned but it's not visible.

**Solutions:**
- Check the trip list - the Customer column should show the customer name
- If filtering by customer, ensure the correct customer is selected
- Refresh the page to ensure you're seeing the latest data

---

## Additional Resources

- [Manager User Guide](./MANAGER_USER_GUIDE.md) - Complete guide to managing trips and operations
- [Fleet Management Guide](./FLEET_MANAGEMENT_GUIDE.md) - Guide to managing vehicles and fleet
- [Company Quick Start Guide](./COMPANY_QUICK_START.md) - Getting started with your company account

---

**Need Help?** Contact support at support@tazsoftware.biz
