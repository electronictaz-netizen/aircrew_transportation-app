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
        console.log('Creating recurring trip');
        try {
          await generateRecurringTrips({
            tripData: tripWithStatus,
            isRecurring: true,
            recurringPattern: tripData.recurringPattern,
            recurringEndDate: tripData.recurringEndDate,
          });
        } catch (recurringError) {
          console.error('Error creating recurring trips, falling back to single trip:', recurringError);
          // Fallback: create as regular trip if recurring creation fails
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

      // Reload trips after creation
      console.log('Reloading trips...');
      await loadTrips();
      console.log('Trips reloaded');
      
      setShowTripForm(false);
      setEditingTrip(null);
      
      // Show success message
      alert('Trip created successfully!');
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
      await client.models.Trip.update({ id: tripId, ...tripData });
      await loadTrips();
      setShowTripForm(false);
      setEditingTrip(null);
    } catch (error) {
      console.error('Error updating trip:', error);
      alert('Failed to update trip. Please try again.');
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;
    try {
      await client.models.Trip.delete({ id: tripId });
      await loadTrips();
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
