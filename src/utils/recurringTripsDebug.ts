/**
 * Debug utility for recurring trips
 * Call this from the browser console to check recurring trips status
 */

import { client } from '../main';

export async function debugRecurringTrips() {
  console.log('=== RECURRING TRIPS DEBUG ===\n');
  
  try {
    // Load all trips
    const { data: allTrips, errors } = await client.models.Trip.list();
    
    if (errors && errors.length > 0) {
      console.error('❌ Errors loading trips:', errors);
      return;
    }
    
    console.log(`Total trips in database: ${allTrips?.length || 0}\n`);
    
    // Find parent trips (isRecurring = true)
    const parentTrips = allTrips?.filter(t => t.isRecurring === true) || [];
    console.log(`📋 Parent recurring trips: ${parentTrips.length}`);
    parentTrips.forEach((trip, idx) => {
      console.log(`  ${idx + 1}. ID: ${trip.id}`);
      console.log(`     Flight: ${trip.flightNumber}`);
      console.log(`     Date: ${trip.pickupDate}`);
      console.log(`     Pattern: ${trip.recurringPattern || 'N/A'}`);
      console.log(`     End Date: ${trip.recurringEndDate || 'N/A'}`);
      console.log('');
    });
    
    // Find child trips (has parentTripId)
    const childTrips = allTrips?.filter(t => t.parentTripId) || [];
    console.log(`\n📋 Child recurring trips: ${childTrips.length}`);
    
    if (childTrips.length > 0) {
      // Group by parent
      const byParent = new Map<string, typeof childTrips>();
      childTrips.forEach(trip => {
        if (trip.parentTripId) {
          const existing = byParent.get(trip.parentTripId) || [];
          existing.push(trip);
          byParent.set(trip.parentTripId, existing);
        }
      });
      
      byParent.forEach((children, parentId) => {
        console.log(`\n  Parent ID: ${parentId}`);
        console.log(`  Children: ${children.length}`);
        children.slice(0, 5).forEach((trip, idx) => {
          console.log(`    ${idx + 1}. Date: ${trip.pickupDate}, Flight: ${trip.flightNumber}`);
        });
        if (children.length > 5) {
          console.log(`    ... and ${children.length - 5} more`);
        }
      });
    } else {
      console.log('  ⚠️ No child trips found!');
    }
    
    // Check for orphaned trips (parentTripId but parent doesn't exist)
    const orphanedTrips = childTrips.filter(child => {
      const parentExists = parentTrips.some(p => p.id === child.parentTripId);
      return !parentExists;
    });
    
    if (orphanedTrips.length > 0) {
      console.log(`\n⚠️ Orphaned child trips (parent missing): ${orphanedTrips.length}`);
      orphanedTrips.forEach(trip => {
        console.log(`  - ID: ${trip.id}, Parent ID: ${trip.parentTripId}, Date: ${trip.pickupDate}`);
      });
    }
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total trips: ${allTrips?.length || 0}`);
    console.log(`Parent trips: ${parentTrips.length}`);
    console.log(`Child trips: ${childTrips.length}`);
    console.log(`Regular trips: ${(allTrips?.length || 0) - parentTrips.length - childTrips.length}`);
    console.log(`Orphaned trips: ${orphanedTrips.length}`);
    
    // Check if any parent trips should have children but don't
    const parentsWithoutChildren = parentTrips.filter(parent => {
      const hasChildren = childTrips.some(child => child.parentTripId === parent.id);
      return !hasChildren;
    });
    
    if (parentsWithoutChildren.length > 0) {
      console.log(`\n⚠️ Parent trips without children: ${parentsWithoutChildren.length}`);
      parentsWithoutChildren.forEach(trip => {
        console.log(`  - ID: ${trip.id}, Flight: ${trip.flightNumber}, Date: ${trip.pickupDate}`);
        console.log(`    Pattern: ${trip.recurringPattern}, End: ${trip.recurringEndDate}`);
      });
    }
    
  } catch (error: any) {
    console.error('❌ Error in debug:', error);
    console.error('Error details:', error?.message || error);
  }
  
  console.log('\n=== END DEBUG ===');
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).debugRecurringTrips = debugRecurringTrips;
  console.log('💡 Debug function available! Run debugRecurringTrips() in the console.');
}
