import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import TripForm from './TripForm';
import DriverManagement from './DriverManagement';
import TripList from './TripList';
import { generateRecurringTrips, generateUpcomingRecurringTrips } from '../utils/recurringJobs';
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

  const loadTrips = async () => {
    try {
      console.log('Loading trips...');
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
      
      // Ensure status is set (default to 'Unassigned' if not provided)
      const tripWithStatus: any = {
        pickupDate: tripData.pickupDate,
        flightNumber: tripData.flightNumber,
        pickupLocation: tripData.pickupLocation,
        dropoffLocation: tripData.dropoffLocation,
        numberOfPassengers: tripData.numberOfPassengers || 1,
        status: tripData.status || 'Unassigned',
      };

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
            throw new Error(result.errors.map(e => e.message || JSON.stringify(e)).join(', '));
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
      const parentTrips = allTrips?.filter(t => t.isRecurring === true).length || 0;
      const childTrips = allTrips?.filter(t => t.parentTripId).length || 0;
      const todayTrips = allTrips?.filter(t => {
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
        allTripDates: allTrips?.map(t => ({ id: t.id, date: t.pickupDate, isRecurring: t.isRecurring, parentId: t.parentTripId }))
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
      const trip = trips.find(t => t.id === tripId);
      const isParentRecurring = trip?.isRecurring === true;
      const isChildRecurring = !!trip?.parentTripId;
      
      // If editing a parent recurring trip, ask what to update
      if (isParentRecurring && !tripData.updateScope) {
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
      
      // If updating a parent recurring trip with scope 2 or 3, update future child trips
      if (isParentRecurring && tripData.updateScope && ['2', '3'].includes(tripData.updateScope)) {
        const { data: allTrips } = await client.models.Trip.list();
        const childTrips = allTrips?.filter(t => t.parentTripId === tripId) || [];
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
      
      await loadTrips();
      setShowTripForm(false);
      setEditingTrip(null);
      alert('Trip updated successfully!');
    } catch (error) {
      console.error('Error updating trip:', error);
      alert('Failed to update trip. Please try again.');
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
      const childTrips = allTrips?.filter(t => t.parentTripId === tripId) || [];
      const futureChildTrips = childTrips.filter(t => {
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
        const childTrips = allTrips?.filter(t => t.parentTripId === tripId) || [];
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
      await client.models.Trip.delete({ id: tripId });
      await loadTrips();
      
      const message = isParentRecurring 
        ? `Recurring trip deleted successfully!`
        : 'Trip deleted successfully!';
      alert(message);
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Failed to delete trip. Please try again.');
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
        onUpdate={loadTrips}
      />
    </div>
  );
}

export default ManagementDashboard;
