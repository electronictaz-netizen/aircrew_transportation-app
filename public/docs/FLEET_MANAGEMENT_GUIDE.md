# Fleet Management Guide - Onyx Transportation App

This guide will help you manage your vehicle fleet in the Onyx Transportation App. Fleet management allows you to track vehicle information, assign vehicles to trips, and manage your entire fleet from one central location.

## Table of Contents

1. [Overview](#overview)
2. [Accessing Fleet Management](#accessing-fleet-management)
3. [Adding a New Vehicle](#adding-a-new-vehicle)
4. [Editing Vehicle Information](#editing-vehicle-information)
5. [Deleting Vehicles](#deleting-vehicles)
6. [Assigning Vehicles to Trips](#assigning-vehicles-to-trips)
7. [Multiple Vehicle Assignment](#multiple-vehicle-assignment)
8. [Driver Vehicle Management](#driver-vehicle-management)
9. [Vehicle Status (Active/Inactive)](#vehicle-status-activeinactive)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Overview

Fleet Management helps you:
- **Track vehicle details** including make, model, year, license plates, and VIN numbers
- **Assign vehicles to trips** for better organization and tracking
- **Assign multiple vehicles** to a single trip for large groups or convoys
- **Manage vehicle availability** with active/inactive status
- **Organize your fleet** with clear naming and categorization

---

## Accessing Fleet Management

1. Log in to the Onyx Transportation App
2. Navigate to the **Management Dashboard**
3. Click the **"Data Management"** dropdown button in the top navigation
4. Select **"Manage Vehicles"** from the dropdown menu

The Vehicle Management modal will open, showing all your vehicles in a table format.

---

## Adding a New Vehicle

### Step 1: Open the Vehicle Form

1. In the Vehicle Management modal, click the **"+ Add Vehicle"** button
2. The vehicle form will appear at the top of the modal

### Step 2: Fill in Vehicle Information

**Required Fields:**
- **Vehicle Name*** - A unique identifier for the vehicle (e.g., "Van 1", "SUV-123", "Sedan A")

**Optional Fields:**
- **Make** - Vehicle manufacturer (e.g., "Ford", "Chevrolet", "Mercedes-Benz")
- **Model** - Vehicle model (e.g., "Transit", "Suburban", "S-Class")
- **Year** - Vehicle year (e.g., 2020, 2021)
- **License Plate** - License plate number (e.g., "ABC-1234")
- **VIN** - Vehicle Identification Number (17 characters)
- **Description** - Additional details or notes about the vehicle
- **Active Status** - Checkbox to mark vehicle as active (available for assignment)

### Step 3: Save the Vehicle

1. Review all entered information
2. Click the **"Create Vehicle"** button
3. A success message will confirm the vehicle was created
4. The vehicle will appear in the vehicles table

**Tips:**
- Use clear, consistent naming conventions (e.g., "Van 1", "Van 2" or "SUV-001", "SUV-002")
- Include make and model for easy identification
- Add license plate numbers for quick reference
- Use the description field for special features (e.g., "Wheelchair accessible", "Premium interior")

---

## Editing Vehicle Information

### Step 1: Find the Vehicle

1. In the Vehicle Management modal, locate the vehicle in the table
2. You can scroll through the list to find the vehicle

### Step 2: Open the Edit Form

1. Click the **✏️ (Edit)** button in the Actions column for the vehicle you want to edit
2. The form will populate with the vehicle's current information

### Step 3: Update Information

1. Modify any fields you want to change
2. All fields can be edited
3. Click the **"Update Vehicle"** button to save changes

**Note:** Changes are saved immediately and will be reflected in all trips assigned to this vehicle.

---

## Deleting Vehicles

### Single Vehicle Deletion

1. In the Vehicle Management modal, find the vehicle you want to delete
2. Click the **🗑️ (Delete)** button in the Actions column
3. A confirmation dialog will appear asking you to confirm the deletion
4. Click **"Confirm"** to delete the vehicle

**Warning:** Deleting a vehicle will remove it from the system. If the vehicle is assigned to any trips, those assignments will be removed. Consider marking the vehicle as inactive instead of deleting it.

### Bulk Deletion

1. Check the boxes next to multiple vehicles you want to delete
2. Or click the checkbox in the table header to select all vehicles
3. Click the **"Delete Selected"** button that appears
4. Confirm the deletion in the dialog

---

## Assigning Vehicles to Trips

### When Creating a New Trip

1. When creating a new trip, scroll down to the **"Vehicles Assigned"** section
2. You'll see a list of all active vehicles with checkboxes
3. Check the boxes next to the vehicles you want to assign to this trip
4. You can select one or multiple vehicles
5. The selected vehicles will be assigned when you save the trip

### When Editing an Existing Trip

1. Open the trip you want to edit
2. Scroll to the **"Vehicles Assigned"** section
3. Check or uncheck vehicles as needed
4. Save the trip to update vehicle assignments

**Note:** Vehicle assignment is optional. You can create trips without assigning vehicles.

---

## Multiple Vehicle Assignment

### Why Assign Multiple Vehicles?

Multiple vehicle assignment is useful for:
- **Large groups** that require multiple vehicles
- **Convoys** where vehicles travel together
- **Backup vehicles** in case of mechanical issues
- **Different vehicle types** for the same trip (e.g., one SUV and one van)

### How to Assign Multiple Vehicles

1. When creating or editing a trip, go to the **"Vehicles Assigned"** section
2. Check the boxes for all vehicles you want to assign
3. You can select as many vehicles as needed
4. All selected vehicles will be assigned to the trip

### Viewing Multiple Vehicle Assignments

- In the trip list, trips with multiple vehicles will show all assigned vehicles
- On the driver dashboard, drivers can see all vehicles assigned to their trips
- Drivers can confirm or change vehicle assignments before pickup

---

## Driver Vehicle Management

### Viewing Assigned Vehicles

1. Drivers can see all vehicles assigned to their trips on the **Driver Dashboard**
2. Each trip shows the assigned vehicles in the trip details
3. Vehicles are displayed with their name, make, and model (if available)

### Confirming Vehicle Assignment

1. Before starting a trip, drivers can review assigned vehicles
2. The vehicle information is displayed clearly
3. Drivers can proceed with the assigned vehicle or request a change

### Changing Vehicle Assignment (Before Pickup)

1. If a driver needs to use a different vehicle, they can change it before pickup
2. Click on the trip to view details
3. Select a different vehicle from the available options
4. The change will be saved and reflected in the trip

**Note:** Vehicle changes are only allowed before the trip pickup time. Once a trip is in progress, vehicle assignments are locked.

---

## Vehicle Status (Active/Inactive)

### Active Vehicles

- **Active vehicles** appear in the vehicle selection when creating or editing trips
- They are available for assignment
- Active vehicles are shown with a green "Active" status badge

### Inactive Vehicles

- **Inactive vehicles** do not appear in trip vehicle selection
- They remain in the system for historical reference
- Inactive vehicles are shown with a red "Inactive" status badge
- You can still view and edit inactive vehicles

### Changing Vehicle Status

1. Edit the vehicle (click the ✏️ button)
2. Check or uncheck the **"Active"** checkbox
3. Click **"Update Vehicle"** to save

**Use Cases:**
- Mark vehicles as inactive if they're out of service for maintenance
- Keep inactive vehicles for historical reporting
- Reactivate vehicles when they return to service
- Mark vehicles as inactive if they're sold or retired

---

## Best Practices

### 1. Consistent Naming

- Use clear, consistent naming conventions (e.g., "Van 1", "Van 2", "Van 3")
- Consider using prefixes for vehicle types (e.g., "SUV-001", "VAN-001", "SED-001")
- Avoid special characters that might cause confusion

### 2. Complete Information

- Fill in make, model, and year for easy identification
- Always include license plate numbers for quick reference
- Add VIN numbers for official records and tracking
- Use the description field for special features or notes

### 3. Regular Maintenance

- Review and update vehicle information periodically
- Mark vehicles as inactive when they're out of service
- Update information when vehicles are serviced or modified
- Remove or mark as inactive vehicles that are sold or retired

### 4. Using Vehicle Assignment

- Assign vehicles to all trips when possible for better tracking
- Use multiple vehicle assignment for large groups or special situations
- Review vehicle assignments regularly to ensure accuracy
- Communicate vehicle assignments to drivers clearly

### 5. Organization Tips

- Group similar vehicles with similar naming (e.g., all vans start with "VAN-")
- Use descriptions to note special features (wheelchair accessible, premium, etc.)
- Keep license plates and VINs up to date
- Document maintenance schedules or special requirements in the description field

---

## Troubleshooting

### Vehicle Not Appearing in Trip Assignment

**Problem:** A vehicle exists but doesn't appear when creating/editing trips.

**Solutions:**
- Check if the vehicle is marked as "Active" in Vehicle Management
- Only active vehicles appear in trip vehicle selection
- Edit the vehicle and ensure the "Active" checkbox is checked

### Can't Find a Vehicle

**Problem:** You know a vehicle exists but can't find it in the list.

**Solutions:**
- Check if it's marked as inactive (it'll still be in the table)
- Scroll through the entire vehicle list
- Use consistent search terms if there's a search feature

### Vehicle Information Not Updating

**Problem:** You edited a vehicle but the changes aren't showing.

**Solutions:**
- Refresh the page and check again
- Ensure you clicked "Update Vehicle" after making changes
- Check if you're looking at the correct vehicle record

### Multiple Vehicles Not Saving

**Problem:** You selected multiple vehicles but only one is assigned.

**Solutions:**
- Ensure you checked multiple boxes (not just one)
- Check that all selected vehicles are active
- Save the trip after selecting vehicles
- Refresh and check the trip again

### Driver Can't See Assigned Vehicles

**Problem:** A driver can't see vehicles assigned to their trip.

**Solutions:**
- Ensure vehicles were assigned when creating/editing the trip
- Check that the driver is viewing the correct trip
- Refresh the driver dashboard
- Verify the trip is assigned to that driver

### Can't Change Vehicle After Pickup

**Problem:** Driver needs to change vehicle but can't.

**Solutions:**
- Vehicle changes are only allowed before pickup time
- Once a trip is "In Progress" or "Completed", vehicle assignments are locked
- Contact a manager to make changes if absolutely necessary
- Document the change in trip notes if a different vehicle is used

---

## Additional Resources

- [Manager User Guide](./MANAGER_USER_GUIDE.md) - Complete guide to managing trips and operations
- [Customer Management Guide](./CUSTOMER_MANAGEMENT_GUIDE.md) - Guide to managing customers
- [Company Quick Start Guide](./COMPANY_QUICK_START.md) - Getting started with your company account

---

**Need Help?** Contact support at support@tazsoftware.biz
