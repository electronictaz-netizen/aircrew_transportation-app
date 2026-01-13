/**
 * Utility to delete all trips from the database
 * WARNING: This will permanently delete ALL trips!
 * 
 * Usage in browser console:
 *   deleteAllTrips()
 *   deleteAllTrips(true) // Skip confirmation
 */

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export async function deleteAllTrips(skipConfirmation: boolean = false): Promise<void> {
  console.log('=== DELETE ALL TRIPS ===\n');
  
  try {
    // Load all trips
    const tripListResult = await client.models.Trip.list();
    const allTrips = tripListResult.data;
    const loadErrors = tripListResult.errors;
    
    if (loadErrors && loadErrors.length > 0) {
      console.error('❌ Errors loading trips:', loadErrors);
      return;
    }
    
    const tripCount = allTrips?.length || 0;
    console.log(`Found ${tripCount} trips in database`);
    
    if (tripCount === 0) {
      console.log('✅ No trips to delete. Database is already empty.');
      return;
    }
    
    // Show summary
    const parentTrips = allTrips?.filter((t: Schema['Trip']['type']) => t.isRecurring === true).length || 0;
    const childTrips = allTrips?.filter((t: Schema['Trip']['type']) => t.parentTripId).length || 0;
    const regularTrips = tripCount - parentTrips - childTrips;
    
    console.log('\nTrip breakdown:');
    console.log(`  - Parent recurring trips: ${parentTrips}`);
    console.log(`  - Child recurring trips: ${childTrips}`);
    console.log(`  - Regular trips: ${regularTrips}`);
    console.log(`  - Total: ${tripCount}`);
    
    // Confirmation
    if (!skipConfirmation) {
      const confirmMessage = `⚠️ WARNING: This will permanently delete ALL ${tripCount} trips!\n\n` +
        `This includes:\n` +
        `  - ${parentTrips} parent recurring trips\n` +
        `  - ${childTrips} child recurring trips\n` +
        `  - ${regularTrips} regular trips\n\n` +
        `This action CANNOT be undone!\n\n` +
        `Type "DELETE ALL" to confirm:`;
      
      const confirmation = prompt(confirmMessage);
      
      if (confirmation !== 'DELETE ALL') {
        console.log('❌ Deletion cancelled. Trips were not deleted.');
        return;
      }
    }
    
    console.log('\n🗑️ Starting deletion...');
    
    // Delete all trips
    let deletedCount = 0;
    let failedCount = 0;
    const deletionErrors: Array<{ tripId: string; error: any }> = [];
    
    for (const trip of allTrips || []) {
      try {
        await client.models.Trip.delete({ id: trip.id });
        deletedCount++;
        if (deletedCount % 10 === 0) {
          console.log(`  Deleted ${deletedCount}/${tripCount} trips...`);
        }
      } catch (error) {
        failedCount++;
        deletionErrors.push({ tripId: trip.id, error });
        console.error(`❌ Failed to delete trip ${trip.id}:`, error);
      }
    }
    
    console.log('\n=== DELETION SUMMARY ===');
    console.log(`Total trips: ${tripCount}`);
    console.log(`Successfully deleted: ${deletedCount}`);
    console.log(`Failed: ${failedCount}`);
    
    if (deletionErrors.length > 0) {
      console.error('\n❌ Errors occurred:');
      deletionErrors.forEach(({ tripId, error }) => {
        console.error(`  Trip ${tripId}:`, error);
      });
    }
    
    if (failedCount === 0) {
      console.log('\n✅ All trips deleted successfully!');
      console.log('Database is now empty and ready for fresh data.');
    } else {
      console.warn(`\n⚠️ Deletion completed with ${failedCount} errors.`);
      console.warn('Some trips may still exist. Check errors above.');
    }
    
    // Verify deletion
    console.log('\nVerifying deletion...');
    const { data: remainingTrips } = await client.models.Trip.list();
    const remainingCount = remainingTrips?.length || 0;
    
    if (remainingCount === 0) {
      console.log('✅ Verification: All trips deleted. Database is empty.');
    } else {
      console.warn(`⚠️ Verification: ${remainingCount} trips still remain in database.`);
      console.warn('Remaining trip IDs:', remainingTrips?.map((t: Schema['Trip']['type']) => t.id));
    }
    
  } catch (error: any) {
    console.error('❌ Error in deleteAllTrips:', error);
    console.error('Error details:', error?.message || error);
  }
  
  console.log('\n=== END DELETE ALL TRIPS ===');
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).deleteAllTrips = deleteAllTrips;
  console.log('💡 Delete all trips function available! Run deleteAllTrips() in the console.');
  console.log('   WARNING: This will delete ALL trips permanently!');
}
