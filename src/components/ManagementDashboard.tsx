import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import TripForm from './TripForm';
import DriverManagement from './DriverManagement';
import TripList from './TripList';
import { generateRecurringTrips, generateUpcomingRecurringTrips } from '../utils/recurringJobs';
import { deleteAllTrips } from '../utils/deleteAllTrips';
import './ManagementDashboard.css';

const client = generateClient<Schema>();

function ManagementDashboard() {
  const [trips, setTrips] = useState<Array<Schema['Trip']['type']>>([]);
  const [drivers, setDrivers] = useState<Array<Schema['Driver']['type']>>([]);
  const [showTripForm, setShowTripForm] = useState(false);
  const [showDriverManagement, setShowDriverManagement] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Schema['Trip']['type'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrips();
    loadDrivers();
    // Generate upcoming recurring trips on load
    generateUpcomingRecurringTrips().then(() => {
      loadTrips(); // Reload trips after generating recurring ones
    });
  }, []);

  const loadTrips = async (forceRefresh: boolean = false) => {
    try {
      console.log('Loading trips...', forceRefresh ? '(force refresh)' : '');
      // Add a small delay to ensure database consistency
      if (forceRefresh) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      const { data: tripsData, errors } = await client.models.Trip.list();
      
      if (errors && errors.length > 0) {
        console.error('Errors loading trips:', errors);
      }
      
      console.log('Loaded trips:', tripsData?.length || 0);
      setTrips(tripsData as Array<Schema['Trip']['type']>);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      const { data: driversData } = await client.models.Driver.list();
      setDrivers(driversData as Array<Schema['Driver']['type']>);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const handleCreateTrip = async (tripData: any) => {
    try {
      console.log('Creating trip with data:', tripData);
      
      // Check for duplicate trips (same flight number on the same day)
      if (tripData.pickupDate && tripData.flightNumber) {
        const newTripDate = new Date(tripData.pickupDate);
        const newTripDateStart = new Date(newTripDate.getFullYear(), newTripDate.getMonth(), newTripDate.getDate());
        const flightNumber = tripData.flightNumber.trim().toUpperCase();
        
        // Get all existing trips
        const { data: allTrips } = await client.models.Trip.list();
        
        // Check for duplicates: same flight number on the same day
        const duplicateTrips = allTrips?.filter((t: Schema['Trip']['type']) => {
          if (!t.pickupDate || !t.flightNumber) return false;
          
          const existingFlightNumber = t.flightNumber.trim().toUpperCase();
          if (existingFlightNumber !== flightNumber) return false;
          
          const existingDate = new Date(t.pickupDate);
          const existingDateStart = new Date(existingDate.getFullYear(), existingDate.getMonth(), existingDate.getDate());
          
          // Check if dates are on the same day
          return existingDateStart.getTime() === newTripDateStart.getTime();
        }) || [];
        
        if (duplicateTrips.length > 0) {
          const duplicateDate = newTripDateStart.toLocaleDateString();
          const duplicateInfo = duplicateTrips.map((t: Schema['Trip']['type']) => {
            const date = t.pickupDate ? new Date(t.pickupDate).toLocaleString() : 'N/A';
            return `  - Trip ID: ${t.id}, Date: ${date}, Status: ${t.status || 'N/A'}`;
          }).join('\n');
          
          alert(
            `❌ Duplicate trip detected!\n\n` +
            `A trip with flight number "${flightNumber}" already exists on ${duplicateDate}.\n\n` +
            `Existing trip(s):\n${duplicateInfo}\n\n` +
            `Please use a different flight number or date, or edit the existing trip instead.`
          );
          return; // Prevent creation
        }
      }
      
      // Ensure status is set (default to 'Unassigned' if not provided)
      const tripWithStatus: any = {
        pickupDate: tripData.pickupDate,
        flightNumber: tripData.flightNumber,
        pickupLocation: tripData.pickupLocation,
        dropoffLocation: tripData.dropoffLocation,
        numberOfPassengers: tripData.numberOfPassengers || 1,
        status: tripData.status || 'Unassigned',
      };

      // Add airport if provided
      if (tripData.airport) {
        tripWithStatus.airport = tripData.airport;
      }

      // Add optional fields only if they have values
      if (tripData.driverId) {
        tripWithStatus.driverId = tripData.driverId;
      }
      
      if (tripData.isRecurring) {
        tripWithStatus.isRecurring = true;
        if (tripData.recurringPattern) {
          tripWithStatus.recurringPattern = tripData.recurringPattern;
        }
        if (tripData.recurringEndDate) {
          tripWithStatus.recurringEndDate = tripData.recurringEndDate;
        }
      } else {
        tripWithStatus.isRecurring = false;
      }

      // If it's a recurring job, generate the recurring trips
      if (tripData.isRecurring && tripData.recurringPattern && tripData.recurringEndDate) {
        console.log('Creating recurring trip with config:', {
          isRecurring: tripData.isRecurring,
          pattern: tripData.recurringPattern,
          endDate: tripData.recurringEndDate,
          tripData: tripWithStatus,
        });
        
        try {
          const result = await generateRecurringTrips({
            tripData: tripWithStatus,
            isRecurring: true,
            recurringPattern: tripData.recurringPattern,
            recurringEndDate: tripData.recurringEndDate,
          });
          if (result) {
            console.log('Recurring trips generation completed:', result);
            console.log(`Created ${result.childCount} child trips from parent ${result.parentId}`);
          } else {
            console.warn('Recurring trips generation returned no result');
          }
        } catch (recurringError) {
          console.error('Error creating recurring trips:', recurringError);
          console.error('Error details:', JSON.stringify(recurringError, null, 2));
          // Fallback: create as regular trip if recurring creation fails
          console.log('Falling back to creating single trip');
          await client.models.Trip.create(tripWithStatus);
        }
      } else {
        // Regular one-time trip
        console.log('Creating one-time trip with data:', tripWithStatus);
        
        // Ensure isRecurring is explicitly false for non-recurring trips
        const oneTimeTripData = {
          ...tripWithStatus,
          isRecurring: false,
        };
        
        // Remove undefined recurring fields
        delete oneTimeTripData.recurringPattern;
        delete oneTimeTripData.recurringEndDate;
        delete oneTimeTripData.parentTripId;
        
        console.log('Final trip data being sent:', oneTimeTripData);
        
        try {
          const result = await client.models.Trip.create(oneTimeTripData);
          console.log('Trip creation result:', result);
          
          if (result.errors && result.errors.length > 0) {
            console.error('Trip creation errors:', result.errors);
            throw new Error(result.errors.map((e: any) => e.message || JSON.stringify(e)).join(', '));
          }
          
          if (!result.data) {
            throw new Error('No data returned from trip creation');
          }
          
          console.log('Trip successfully created with ID:', result.data.id);
        } catch (createError: any) {
          console.error('Detailed create error:', createError);
          throw createError;
        }
      }

      // Wait a moment for database to sync, then reload trips
      console.log('Waiting for database sync...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds for better sync
      
      console.log('Reloading trips...');
      await loadTrips();
      console.log('Trips reloaded');
      
      // Verify trips were created
      const { data: allTrips } = await client.models.Trip.list();
      const totalTrips = allTrips?.length || 0;
      const parentTrips = allTrips?.filter((t: Schema['Trip']['type']) => t.isRecurring === true).length || 0;
      const childTrips = allTrips?.filter((t: Schema['Trip']['type']) => t.parentTripId).length || 0;
      const todayTrips = allTrips?.filter((t: Schema['Trip']['type']) => {
        if (!t.pickupDate) return false;
        const tripDate = new Date(t.pickupDate);
        const today = new Date();
        return tripDate.toDateString() === today.toDateString();
      }).length || 0;
      
      console.log('Trip creation summary:', {
        totalTrips,
        parentTrips,
        childTrips,
        todayTrips,
        allTripDates: allTrips?.map((t: Schema['Trip']['type']) => ({ id: t.id, date: t.pickupDate, isRecurring: t.isRecurring, parentId: t.parentTripId }))
      });
      
      setShowTripForm(false);
      setEditingTrip(null);
      
      // Show success message with detailed count
      const message = `Trip created successfully!\n\nTotal trips: ${totalTrips}\nParent trips: ${parentTrips}\nChild trips: ${childTrips}\nToday's trips: ${todayTrips}`;
      alert(message);
    } catch (error: any) {
      console.error('Error creating trip:', error);
      console.error('Error type:', typeof error);
      console.error('Error details:', error);
      
      let errorMessage = 'Failed to create trip. ';
      if (error?.message) {
        errorMessage += error.message;
      } else if (error?.errors && Array.isArray(error.errors)) {
        errorMessage += error.errors.map((e: any) => e.message || JSON.stringify(e)).join(', ');
      } else if (typeof error === 'string') {
        errorMessage += error;
      } else {
        errorMessage += 'Unknown error occurred. Please check the browser console for details.';
      }
      
      alert(errorMessage);
    }
  };

  const handleUpdateTrip = async (tripId: string, tripData: any) => {
    try {
      const trip = trips.find((t: Schema['Trip']['type']) => t.id === tripId);
      const isParentRecurring = trip?.isRecurring === true;
      const isChildRecurring = !!trip?.parentTripId;
      const wasRecurring = isParentRecurring || isChildRecurring;
      
      // Check if recurrence is being removed - explicitly check for false or undefined when it was previously recurring
      const isRemovingRecurrence = wasRecurring && (
        tripData.isRecurring === false || 
        tripData.isRecurring === undefined ||
        (tripData.isRecurring !== true && wasRecurring)
      );
      
      console.log('Update trip check:', {
        tripId,
        isParentRecurring,
        isChildRecurring,
        wasRecurring,
        newIsRecurring: tripData.isRecurring,
        isRemovingRecurrence
      });
      
      // If removing recurrence from a parent trip, delete ALL child trips (past and future)
      if (isParentRecurring && isRemovingRecurrence) {
        const { data: allTrips } = await client.models.Trip.list();
        const parentFlightNumber = trip.flightNumber;
        
        // Filter child trips by both parentTripId AND flight number to ensure we get the right ones
        // Get ALL child trips regardless of date
        const childTrips = allTrips?.filter((t: Schema['Trip']['type']) => 
          t.parentTripId === tripId && 
          t.flightNumber === parentFlightNumber &&
          t.id !== tripId // Don't include the parent trip itself
        ) || [];
        
        console.log(`Found ${childTrips.length} child trips with parent ID ${tripId} and flight number ${parentFlightNumber}`);
        console.log('Child trips:', childTrips.map((t: Schema['Trip']['type']) => ({ id: t.id, date: t.pickupDate, flight: t.flightNumber })));
        
        if (childTrips.length > 0) {
          const confirmMessage = `Removing recurrence will delete ALL ${childTrips.length} child trip${childTrips.length > 1 ? 's' : ''} with flight number ${parentFlightNumber}.\n\nAre you sure you want to continue?`;
          if (!confirm(confirmMessage)) {
            return; // User cancelled
          }
          
          // Delete ALL child trips (past and future)
          let deletedCount = 0;
          let failedCount = 0;
          for (const childTrip of childTrips) {
            try {
              await client.models.Trip.delete({ id: childTrip.id });
              deletedCount++;
              console.log(`✅ Deleted child trip ${childTrip.id} (Flight: ${childTrip.flightNumber}, Date: ${childTrip.pickupDate})`);
            } catch (error) {
              failedCount++;
              console.error(`❌ Error deleting child trip ${childTrip.id}:`, error);
            }
          }
          console.log(`Deletion complete: ${deletedCount} deleted, ${failedCount} failed out of ${childTrips.length} total`);
          
          if (failedCount > 0) {
            alert(`Deleted ${deletedCount} trips, but ${failedCount} failed. Check console for details.`);
          }
        }
        
        // Remove recurring fields from parent trip
        tripData.isRecurring = false;
        tripData.recurringPattern = undefined;
        tripData.recurringEndDate = undefined;
      }
      
      // If canceling recurrence from a child trip, delete all future child trips
      if (isChildRecurring && isRemovingRecurrence) {
        const parentTripId = trip.parentTripId!;
        const currentFlightNumber = trip.flightNumber;
        const { data: allTrips } = await client.models.Trip.list();
        
        // Filter by both parentTripId AND flight number to ensure we get the right trips
        const allChildTrips = allTrips?.filter((t: Schema['Trip']['type']) => 
          t.parentTripId === parentTripId && 
          t.flightNumber === currentFlightNumber
        ) || [];
        
        const currentTripDate = trip.pickupDate ? new Date(trip.pickupDate) : null;
        const now = new Date();
        
        // Find ALL future child trips - delete everything that is today or in the future
        // Match by both date AND flight number
        console.log(`Checking ${allChildTrips.length} child trips for deletion...`);
        const futureChildTrips = allChildTrips.filter((t: Schema['Trip']['type']) => {
          if (t.id === tripId) {
            console.log(`Skipping trip ${t.id} - this is the current trip being edited`);
            return false; // Don't delete the current trip being edited
          }
          
          if (!t.pickupDate) {
            console.log(`Skipping trip ${t.id} - no pickup date`);
            return false;
          }
          
          if (t.flightNumber !== currentFlightNumber) {
            console.log(`Skipping trip ${t.id} - flight number mismatch: ${t.flightNumber} !== ${currentFlightNumber}`);
            return false; // Must match flight number
          }
          
          const childDate = new Date(t.pickupDate);
          // Delete ALL trips that are today or in the future (not in the past)
          // Use start of today for comparison to include all trips today
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const childDateStart = new Date(childDate.getFullYear(), childDate.getMonth(), childDate.getDate());
          
          // Delete if the trip date is today or in the future
          const shouldDelete = childDateStart >= todayStart;
          if (!shouldDelete) {
            console.log(`Skipping trip ${t.id} - date is in the past: ${childDateStart.toISOString()} < ${todayStart.toISOString()}`);
          } else {
            console.log(`✅ Will delete trip ${t.id} - date is today or future: ${childDateStart.toISOString()}`);
          }
          return shouldDelete;
        });
        
        console.log(`Found ${futureChildTrips.length} future child trips to delete (Flight: ${currentFlightNumber}, current trip date: ${currentTripDate?.toISOString()}, now: ${now.toISOString()})`);
        
        if (futureChildTrips.length > 0) {
          const confirmMessage = `Canceling recurrence will delete ${futureChildTrips.length} future trip${futureChildTrips.length > 1 ? 's' : ''} with flight number ${currentFlightNumber}.\n\nAre you sure you want to continue?`;
          if (!confirm(confirmMessage)) {
            return; // User cancelled
          }
          
          // Delete ALL future child trips
          let deletedCount = 0;
          let failedCount = 0;
          for (const futureTrip of futureChildTrips) {
            try {
              await client.models.Trip.delete({ id: futureTrip.id });
              deletedCount++;
              console.log(`✅ Deleted future child trip ${futureTrip.id} (Flight: ${futureTrip.flightNumber}, Date: ${futureTrip.pickupDate})`);
            } catch (error) {
              failedCount++;
              console.error(`❌ Error deleting future child trip ${futureTrip.id}:`, error);
            }
          }
          console.log(`Deletion complete: ${deletedCount} deleted, ${failedCount} failed out of ${futureChildTrips.length} total`);
          
          if (failedCount > 0) {
            alert(`Deleted ${deletedCount} trips, but ${failedCount} failed. Check console for details.`);
          }
          
          // Verify deletion by checking again
          const { data: verifyTrips } = await client.models.Trip.list();
          const remainingTrips = verifyTrips?.filter((t: Schema['Trip']['type']) => 
            t.parentTripId === parentTripId && 
            t.flightNumber === currentFlightNumber &&
            t.id !== tripId
          ) || [];
          const remainingFuture = remainingTrips.filter((t: Schema['Trip']['type']) => {
            if (!t.pickupDate) return false;
            const childDate = new Date(t.pickupDate);
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const childDateStart = new Date(childDate.getFullYear(), childDate.getMonth(), childDate.getDate());
            return childDateStart >= todayStart;
          });
          
          if (remainingFuture.length > 0) {
            console.warn(`⚠️ WARNING: ${remainingFuture.length} future trips still remain after deletion!`);
            console.warn('Remaining trips:', remainingFuture.map((t: Schema['Trip']['type']) => ({ id: t.id, date: t.pickupDate, flight: t.flightNumber })));
          } else {
            console.log(`✅ Verified: All future trips deleted successfully`);
          }
        }
        
        // Also cancel recurrence on the parent trip
        try {
          await client.models.Trip.update({
            id: parentTripId,
            isRecurring: false,
            recurringPattern: undefined,
            recurringEndDate: undefined,
          });
          console.log(`Cancelled recurrence on parent trip ${parentTripId}`);
        } catch (error) {
          console.error('Error updating parent trip:', error);
        }
        
        // Remove recurring fields from current trip
        tripData.isRecurring = false;
        tripData.parentTripId = undefined;
        tripData.recurringPattern = undefined;
        tripData.recurringEndDate = undefined;
      }
      
      // If editing a parent recurring trip (and not removing recurrence), ask what to update
      if (isParentRecurring && !isRemovingRecurrence && !tripData.updateScope) {
        const updateScope = prompt(
          'This is a recurring trip. What would you like to update?\n\n' +
          '1 - Update only this parent trip\n' +
          '2 - Update this trip and all future child trips\n' +
          '3 - Update all existing and future trips\n\n' +
          'Enter 1, 2, or 3:'
        );
        
        if (!updateScope || !['1', '2', '3'].includes(updateScope)) {
          return; // User cancelled
        }
        
        tripData.updateScope = updateScope;
      }
      
      // Update the trip
      await client.models.Trip.update({ id: tripId, ...tripData });
      
      // Check if trip is no longer recurring after update (parent was changed to non-recurring)
      // If so, delete all future child trips - this is a fallback in case isRemovingRecurrence wasn't detected
      if (tripData.isRecurring === false && (isParentRecurring || isChildRecurring) && !isRemovingRecurrence) {
        console.log('Fallback: Detected recurrence removal that wasn\'t caught earlier');
        const { data: allTrips } = await client.models.Trip.list();
        let tripsToDelete: Array<Schema['Trip']['type']> = [];
        const flightNumber = trip.flightNumber;
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (isParentRecurring) {
          // If parent is no longer recurring, delete all child trips with matching flight number
          tripsToDelete = allTrips?.filter((t: Schema['Trip']['type']) => 
            t.parentTripId === tripId && 
            t.flightNumber === flightNumber
          ) || [];
          console.log(`Fallback: Found ${tripsToDelete.length} child trips to delete for parent ${tripId}`);
        } else if (isChildRecurring) {
          // If child trip is being updated and is no longer recurring, delete all future child trips
          const parentTripId = trip.parentTripId!;
          const allChildTrips = allTrips?.filter((t: Schema['Trip']['type']) => 
            t.parentTripId === parentTripId && 
            t.flightNumber === flightNumber
          ) || [];
          
          tripsToDelete = allChildTrips.filter((t: Schema['Trip']['type']) => {
            if (!t.pickupDate || t.id === tripId) return false; // Don't delete the current trip
            const childDate = new Date(t.pickupDate);
            const childDateStart = new Date(childDate.getFullYear(), childDate.getMonth(), childDate.getDate());
            // Delete all trips that are today or in the future
            return childDateStart >= todayStart;
          });
          console.log(`Fallback: Found ${tripsToDelete.length} future child trips to delete`);
        }
        
        if (tripsToDelete.length > 0) {
          console.log(`Fallback: Deleting ${tripsToDelete.length} trips because trip is no longer recurring`);
          let deletedCount = 0;
          for (const tripToDelete of tripsToDelete) {
            try {
              await client.models.Trip.delete({ id: tripToDelete.id });
              deletedCount++;
              console.log(`Fallback: Deleted trip ${tripToDelete.id} (Flight: ${tripToDelete.flightNumber}, Date: ${tripToDelete.pickupDate})`);
            } catch (error) {
              console.error(`Fallback: Error deleting trip ${tripToDelete.id}:`, error);
            }
          }
          console.log(`Fallback: Successfully deleted ${deletedCount} of ${tripsToDelete.length} trips`);
        }
      }
      
      // If updating a parent recurring trip with scope 2 or 3, update future child trips
      // BUT only if the trip is still recurring
      if (isParentRecurring && !isRemovingRecurrence && tripData.isRecurring !== false && tripData.updateScope && ['2', '3'].includes(tripData.updateScope)) {
        const { data: allTrips } = await client.models.Trip.list();
        const childTrips = allTrips?.filter((t: Schema['Trip']['type']) => t.parentTripId === tripId) || [];
        const now = new Date();
        
        for (const childTrip of childTrips) {
          const childDate = childTrip.pickupDate ? new Date(childTrip.pickupDate) : null;
          
          // Scope 2: Only update future trips
          // Scope 3: Update all trips
          if (childDate && (tripData.updateScope === '3' || childDate > now)) {
            const updateData: any = {};
            
            // Update fields that were changed
            if (tripData.flightNumber !== undefined) updateData.flightNumber = tripData.flightNumber;
            if (tripData.pickupLocation !== undefined) updateData.pickupLocation = tripData.pickupLocation;
            if (tripData.dropoffLocation !== undefined) updateData.dropoffLocation = tripData.dropoffLocation;
            if (tripData.numberOfPassengers !== undefined) updateData.numberOfPassengers = tripData.numberOfPassengers;
            if (tripData.driverId !== undefined) updateData.driverId = tripData.driverId;
            if (tripData.status !== undefined) updateData.status = tripData.status;
            
            if (Object.keys(updateData).length > 0) {
              await client.models.Trip.update({ id: childTrip.id, ...updateData });
            }
          }
        }
      }
      
      await loadTrips(true); // Force refresh after update
      setShowTripForm(false);
      setEditingTrip(null);
      alert('Trip updated successfully!');
    } catch (error) {
      console.error('Error updating trip:', error);
      alert('Failed to update trip. Please try again.');
    }
  };

  const handleDeleteAllTrips = async () => {
    const confirmation = confirm(
      '⚠️ WARNING: This will permanently delete ALL trips in the database!\n\n' +
      'This action CANNOT be undone!\n\n' +
      'Are you sure you want to delete all trips?'
    );
    
    if (!confirmation) {
      return;
    }
    
    try {
      await deleteAllTrips(true); // Skip the internal confirmation since we already asked
      // Wait for database to sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadTrips(true); // Force refresh after deletion
      alert('All trips have been deleted successfully.');
    } catch (error: any) {
      console.error('Error deleting all trips:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      alert(`Failed to delete all trips: ${errorMessage}. Check console for details.`);
    }
  };

  const handleDeleteMultipleTrips = async (tripIds: string[]) => {
    if (tripIds.length === 0) return;
    
    const count = tripIds.length;
    if (!confirm(`Are you sure you want to delete ${count} trip${count > 1 ? 's' : ''}?`)) return;
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const tripId of tripIds) {
        try {
          await client.models.Trip.delete({ id: tripId });
          successCount++;
        } catch (error) {
          console.error(`Error deleting trip ${tripId}:`, error);
          failCount++;
        }
      }
      
      // Wait a moment for database to sync, then force refresh
      await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay for better sync
      await loadTrips(true);
      
      if (failCount > 0) {
        alert(`Deleted ${successCount} trip${successCount > 1 ? 's' : ''}. ${failCount} failed.`);
      } else {
        alert(`Successfully deleted ${successCount} trip${successCount > 1 ? 's' : ''}.`);
      }
    } catch (error: any) {
      console.error('Error deleting trips:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      alert(`Failed to delete trips: ${errorMessage}. Please try again.`);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    const trip = trips.find(t => t.id === tripId);
    const isParentRecurring = trip?.isRecurring === true;
    const isChildRecurring = !!trip?.parentTripId;
    
    let confirmMessage = 'Are you sure you want to delete this trip?';
    let deleteScope = 'single';
    
    if (isParentRecurring) {
      const { data: allTrips } = await client.models.Trip.list();
      const childTrips = allTrips?.filter((t: Schema['Trip']['type']) => t.parentTripId === tripId) || [];
      const futureChildTrips = childTrips.filter((t: Schema['Trip']['type']) => {
        if (!t.pickupDate) return false;
        return new Date(t.pickupDate) > new Date();
      });
      
      confirmMessage = `This is a recurring trip with ${childTrips.length} child trips (${futureChildTrips.length} future).\n\n` +
        'What would you like to delete?\n\n' +
        '1 - Delete only this parent trip (child trips will remain)\n' +
        '2 - Delete this parent trip and all future child trips\n' +
        '3 - Delete this parent trip and ALL child trips (past and future)\n\n' +
        'Enter 1, 2, or 3:';
      
      const scope = prompt(confirmMessage);
      if (!scope || !['1', '2', '3'].includes(scope)) {
        return; // User cancelled
      }
      deleteScope = scope;
    } else if (isChildRecurring) {
      confirmMessage = 'Are you sure you want to delete this recurring trip instance?\n\n' +
        'This will only delete this specific occurrence, not the entire recurring series.';
      if (!confirm(confirmMessage)) return;
    } else {
      if (!confirm(confirmMessage)) return;
    }
    
    try {
      if (isParentRecurring && deleteScope !== 'single') {
        const { data: allTrips } = await client.models.Trip.list();
        const childTrips = allTrips?.filter((t: Schema['Trip']['type']) => t.parentTripId === tripId) || [];
        const now = new Date();
        
        // Delete child trips based on scope
        for (const childTrip of childTrips) {
          const shouldDelete = deleteScope === '3' || // Delete all
            (deleteScope === '2' && childTrip.pickupDate && new Date(childTrip.pickupDate) > now); // Delete future only
          
          if (shouldDelete) {
            try {
              await client.models.Trip.delete({ id: childTrip.id });
              console.log(`Deleted child trip ${childTrip.id}`);
            } catch (error) {
              console.error(`Error deleting child trip ${childTrip.id}:`, error);
            }
          }
        }
      }
      
      // Delete the trip itself
      const deleteResult = await client.models.Trip.delete({ id: tripId });
      
      if (deleteResult.errors && deleteResult.errors.length > 0) {
        console.error('Delete errors:', deleteResult.errors);
        throw new Error(deleteResult.errors.map((e: any) => e.message || JSON.stringify(e)).join(', '));
      }
      
      console.log('Trip deleted successfully:', tripId);
      
      // Wait a moment for database to sync, then force refresh
      await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay for better sync
      await loadTrips(true);
      
      const message = isParentRecurring 
        ? `Recurring trip deleted successfully!`
        : 'Trip deleted successfully!';
      alert(message);
    } catch (error: any) {
      console.error('Error deleting trip:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      alert(`Failed to delete trip: ${errorMessage}. Please try again.`);
    }
  };

  const handleEditTrip = (trip: Schema['Trip']['type']) => {
    setEditingTrip(trip);
    setShowTripForm(true);
  };

  const handleDriverUpdate = () => {
    loadDrivers();
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="management-dashboard">
      <div className="dashboard-header">
        <h2>Management Dashboard</h2>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingTrip(null);
              setShowTripForm(true);
            }}
          >
            + New Trip
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowDriverManagement(true)}
          >
            Manage Drivers
          </button>
          <button
            className="btn btn-danger"
            onClick={handleDeleteAllTrips}
            title="Delete all trips from the database"
          >
            Delete All Trips
          </button>
        </div>
      </div>

      {showTripForm && (
        <TripForm
          trip={editingTrip}
          drivers={drivers}
          onSubmit={editingTrip ? (data) => handleUpdateTrip(editingTrip.id, data) : handleCreateTrip}
          onCancel={() => {
            setShowTripForm(false);
            setEditingTrip(null);
          }}
        />
      )}

      {showDriverManagement && (
        <DriverManagement
          drivers={drivers}
          onClose={() => setShowDriverManagement(false)}
          onUpdate={handleDriverUpdate}
        />
      )}

      <TripList
        trips={trips}
        drivers={drivers}
        onEdit={handleEditTrip}
        onDelete={handleDeleteTrip}
        onDeleteMultiple={handleDeleteMultipleTrips}
        onUpdate={loadTrips}
      />
    </div>
  );
}

export default ManagementDashboard;
