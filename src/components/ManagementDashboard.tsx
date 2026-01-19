import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useCompany } from '../contexts/CompanyContext';
import { useAdminAccess } from '../utils/adminAccess';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Suspense, lazy } from 'react';
import TripForm from './TripForm';
import DriverSelectionDialog from './DriverSelectionDialog';

// Lazy load heavy components for code splitting
const LocationManagement = lazy(() => import('./LocationManagement'));
const FilterCategoryManagement = lazy(() => import('./FilterCategoryManagement'));
const CustomFieldManagement = lazy(() => import('./CustomFieldManagement'));
const ReportConfigurationManagement = lazy(() => import('./ReportConfigurationManagement'));
const CompanyManagement = lazy(() => import('./CompanyManagement'));
const SubscriptionManagement = lazy(() => import('./SubscriptionManagement'));
const TripList = lazy(() => import('./TripList'));
const TripCalendar = lazy(() => import('./TripCalendar'));
const DriverReports = lazy(() => import('./DriverReports'));
const TripReports = lazy(() => import('./TripReports'));

import { PageSkeleton, TripListSkeleton, TripCalendarSkeleton } from './ui/skeleton-loaders';

// Loading component for Suspense fallback
const ComponentLoadingFallback = <PageSkeleton />;
import { generateRecurringTrips, generateUpcomingRecurringTrips } from '../utils/recurringJobs';
import { deleteAllTrips } from '../utils/deleteAllTrips';
import { notifyDriver, notifyPreviousDriver } from '../utils/driverNotifications';
import { useKeyboardShortcuts, COMMON_SHORTCUTS } from '../hooks/useKeyboardShortcuts';
import { sendDailyAssignmentEmailsToAllDrivers, sendDailyAssignmentToDriver } from '../utils/dailyAssignmentEmail';
import './ManagementDashboard.css';

const client = generateClient<Schema>();

function ManagementDashboard() {
  const { companyId, loading: companyLoading, company, isAdminOverride } = useCompany();
  const hasAdminAccess = useAdminAccess();
  const [trips, setTrips] = useState<Array<Schema['Trip']['type']>>([]);
  const [drivers, setDrivers] = useState<Array<Schema['Driver']['type']>>([]);
  const [locations, setLocations] = useState<Array<Schema['Location']['type']>>([]);
  const [showTripForm, setShowTripForm] = useState(false);
  const [showLocationManagement, setShowLocationManagement] = useState(false);
  const [showFilterCategoryManagement, setShowFilterCategoryManagement] = useState(false);
  const [showCustomFieldManagement, setShowCustomFieldManagement] = useState(false);
  const [showReportConfigurationManagement, setShowReportConfigurationManagement] = useState(false);
  const [showCompanyManagement, setShowCompanyManagement] = useState(false);
  const [showSubscriptionManagement, setShowSubscriptionManagement] = useState(false);
  const [showDriverReports, setShowDriverReports] = useState(false);
  const [showTripReports, setShowTripReports] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Schema['Trip']['type'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDriverDialog, setShowDriverDialog] = useState(false);
  const [tripsToAssign, setTripsToAssign] = useState<string[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [showEmailDriverDialog, setShowEmailDriverDialog] = useState(false);
  const [selectedEmailDriverId, setSelectedEmailDriverId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDateTrips, setSelectedDateTrips] = useState<{ date: Date; trips: Array<Schema['Trip']['type']> } | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...COMMON_SHORTCUTS.NEW_TRIP,
      action: () => {
        setEditingTrip(null);
        setShowTripForm(true);
      },
    },
  ]);

  useEffect(() => {
    if (companyId) {
      loadTrips();
      loadDrivers();
      loadLocations();
      // Generate upcoming recurring trips on load
      generateUpcomingRecurringTrips(companyId || undefined).then(() => {
        loadTrips(); // Reload trips after generating recurring ones
      });
    }
  }, [companyId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    
    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDropdown]);

      const loadTrips = async (forceRefresh: boolean = false) => {
    if (!companyId) return;
    
    try {
      console.log('Loading trips...', forceRefresh ? '(force refresh)' : '');
      // Add a small delay to ensure database consistency
      if (forceRefresh) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      const { data: tripsData, errors } = await client.models.Trip.list({
        filter: { companyId: { eq: companyId! } }
      });
      
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
    if (!companyId) return;
    
    try {
      const { data: driversData } = await client.models.Driver.list({
        filter: { companyId: { eq: companyId! } }
      });
      setDrivers(driversData as Array<Schema['Driver']['type']>);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const loadLocations = async () => {
    if (!companyId) return;
    
    try {
      const { data: locationsData } = await client.models.Location.list({
        filter: { companyId: { eq: companyId! } }
      });
      setLocations(locationsData as Array<Schema['Location']['type']>);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  // Helper function to save custom field values
  const saveCustomFieldValues = async (
    entityId: string,
    customFieldValues: Record<string, string>,
    entityType: 'Trip' | 'Driver'
  ) => {
    if (!companyId) return;
    
    try {
      // Get existing custom field values for this entity
      const filter: any = {
        companyId: { eq: companyId },
        entityType: { eq: entityType },
      };
      
      if (entityType === 'Trip') {
        filter.tripId = { eq: entityId };
      } else {
        filter.driverId = { eq: entityId };
      }
      
      const { data: existingValues } = await client.models.CustomFieldValue.list({ filter });
      
      // Get custom fields for this entity type
      const { data: fieldsData } = await client.models.CustomField.list({
        filter: {
          companyId: { eq: companyId },
          entityType: { eq: entityType },
          isActive: { eq: true },
        },
      });
      
      // Create a map of existing values by customFieldId
      const existingMap = new Map<string, Schema['CustomFieldValue']['type']>();
      (existingValues || []).forEach((val) => {
        if (val.customFieldId) {
          existingMap.set(val.customFieldId, val);
        }
      });
      
      // Save or update custom field values
      for (const field of fieldsData || []) {
        const value = customFieldValues[field.id] || '';
        const stringValue = value.trim();
        
        const existing = existingMap.get(field.id);
        
        if (stringValue || field.isRequired) {
          const valueData: any = {
            companyId: companyId!,
            customFieldId: field.id,
            entityType: entityType,
            value: stringValue,
          };
          
          if (entityType === 'Trip') {
            valueData.tripId = entityId;
          } else {
            valueData.driverId = entityId;
          }
          
          if (existing) {
            // Update existing value
            await client.models.CustomFieldValue.update({
              id: existing.id,
              value: stringValue,
            });
          } else {
            // Create new value
            await client.models.CustomFieldValue.create(valueData);
          }
        } else if (existing) {
          // Delete empty optional values
          await client.models.CustomFieldValue.delete({ id: existing.id });
        }
      }
    } catch (error) {
      console.error('Error saving custom field values:', error);
      // Don't throw - this is a non-critical operation
    }
  };

  const [isCreatingTrip, setIsCreatingTrip] = useState(false);

  const handleCreateTrip = async (tripData: any) => {
    if (!companyId) {
      alert('Company not found. Please contact support.');
      return;
    }

    // Prevent double submission
    if (isCreatingTrip) {
      console.warn('Trip creation already in progress, ignoring duplicate request');
      return;
    }

    setIsCreatingTrip(true);
    try {
      console.log('Creating trip with data:', tripData);
      
      // Check for duplicate trips (same flight number on the same day)
      if (tripData.pickupDate && tripData.flightNumber) {
        const newTripDate = new Date(tripData.pickupDate);
        const newTripDateStart = new Date(newTripDate.getFullYear(), newTripDate.getMonth(), newTripDate.getDate());
        const flightNumber = tripData.flightNumber.trim().toUpperCase();
        
        // Get all existing trips for this company
        const { data: allTrips } = await client.models.Trip.list({
          filter: { companyId: { eq: companyId! } }
        });
        
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

      // Add companyId
      tripWithStatus.companyId = companyId!;

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
            companyId: companyId || undefined,
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
          // Don't create a fallback trip - the parent may have already been created
          // If parent was created, it will show up. If not, user can retry.
          alert(`Failed to create recurring trips: ${recurringError instanceof Error ? recurringError.message : 'Unknown error'}\n\nPlease check if a parent trip was created and try again if needed.`);
          throw recurringError; // Re-throw to prevent showing success message
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
          const result = await client.models.Trip.create({
            ...oneTimeTripData,
            companyId: companyId,
          });
          console.log('Trip creation result:', result);
          
          if (result.errors && result.errors.length > 0) {
            console.error('Trip creation errors:', result.errors);
            throw new Error(result.errors.map((e: any) => e.message || JSON.stringify(e)).join(', '));
          }
          
          if (!result.data) {
            throw new Error('No data returned from trip creation');
          }
          
          console.log('Trip successfully created with ID:', result.data.id);
          
          // Send notification to driver if assigned
          // Respect driver's notification preference
          if (tripData.driverId && result.data) {
            const assignedDriver = drivers.find(d => d.id === tripData.driverId);
            if (assignedDriver) {
              const preference = assignedDriver.notificationPreference || 'email';
              await notifyDriver({
                trip: result.data,
                driver: assignedDriver,
                isReassignment: false,
              }, {
                email: preference === 'email' || preference === 'both',
                inApp: true,
              });
            }
          }
          
          // Save custom field values if provided
          if (tripData.customFieldValues && result.data) {
            await saveCustomFieldValues(result.data.id, tripData.customFieldValues, 'Trip');
          }
          
          // Return the created trip for custom field saving in TripForm
          return result.data;
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
      const { data: allTrips } = await client.models.Trip.list({
        filter: { companyId: { eq: companyId! } }
      });
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
    } finally {
      setIsCreatingTrip(false);
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
        const { data: allTrips } = await client.models.Trip.list({
          filter: { companyId: { eq: companyId! } }
        });
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
        const { data: allTrips } = await client.models.Trip.list({
          filter: { companyId: { eq: companyId! } }
        });
        
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
          const { data: verifyTrips } = await client.models.Trip.list({
            filter: { companyId: { eq: companyId! } }
          });
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
      
      // Check for driver reassignment before updating
      if (!trip) {
        throw new Error('Trip not found');
      }
      
      const previousDriverId = trip.driverId;
      // Check if driverId is explicitly in tripData (even if undefined/empty)
      const hasDriverIdField = 'driverId' in tripData;
      const newDriverId = tripData.driverId;
      // Unassigning: previous driver exists AND (no driverId field OR empty/undefined value)
      const isUnassigning = previousDriverId && (hasDriverIdField && (!newDriverId || newDriverId === '' || newDriverId === undefined));
      const isDriverReassignment = previousDriverId && newDriverId && previousDriverId !== newDriverId;
      const isNewAssignment = !previousDriverId && newDriverId;
      
      // Update the trip - ensure companyId is preserved and never changed
      const updateData = { ...tripData };
      // Never allow companyId to be changed - always use the trip's existing companyId
      delete updateData.companyId;
      
      // Explicitly handle unassignment: set driverId to null and status to Unassigned
      if (isUnassigning) {
        updateData.driverId = null;
        updateData.status = 'Unassigned';
      } else if (newDriverId && !previousDriverId) {
        // New assignment: ensure status is Assigned
        updateData.status = 'Assigned';
      } else if (newDriverId && previousDriverId && newDriverId !== previousDriverId) {
        // Reassignment: ensure status is Assigned
        updateData.status = 'Assigned';
      } else if (hasDriverIdField && newDriverId && previousDriverId === newDriverId) {
        // Driver unchanged but field was explicitly set - ensure status is Assigned
        updateData.status = 'Assigned';
      }
      
      const updateResult = await client.models.Trip.update({ id: tripId, ...updateData });
      
      // Send notifications for driver assignment changes
      // Respect each driver's notification preference
      if (updateResult.data) {
        // Notify new driver if assigned or reassigned
        if ((isNewAssignment || isDriverReassignment) && newDriverId) {
          const newDriver = drivers.find(d => d.id === newDriverId);
          if (newDriver) {
            const preference = newDriver.notificationPreference || 'email';
            await notifyDriver({
              trip: updateResult.data,
              driver: newDriver,
              isReassignment: isDriverReassignment,
              previousDriver: previousDriverId ? drivers.find(d => d.id === previousDriverId) || null : null,
            }, {
              email: preference === 'email' || preference === 'both',
              inApp: true,
            });
          }
        }
        
        // Notify previous driver if reassigned or unassigned
        if ((isDriverReassignment || isUnassigning) && previousDriverId) {
          const previousDriver = drivers.find(d => d.id === previousDriverId);
          if (previousDriver) {
            await notifyPreviousDriver(previousDriver, updateResult.data);
          }
        }
      }
      
      // Check if trip is no longer recurring after update (parent was changed to non-recurring)
      // If so, delete all future child trips - this is a fallback in case isRemovingRecurrence wasn't detected
      if (tripData.isRecurring === false && (isParentRecurring || isChildRecurring) && !isRemovingRecurrence) {
        console.log('Fallback: Detected recurrence removal that wasn\'t caught earlier');
        const { data: allTrips } = await client.models.Trip.list({
          filter: { companyId: { eq: companyId! } }
        });
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
        const { data: allTrips } = await client.models.Trip.list({
          filter: { companyId: { eq: companyId! } }
        });
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
            // Handle driver assignment/unassignment for child trips
            if (tripData.driverId !== undefined) {
              if (!tripData.driverId || tripData.driverId === '') {
                // Unassigning: set to null and status to Unassigned
                updateData.driverId = null;
                updateData.status = 'Unassigned';
              } else {
                // Assigning: set driverId and status to Assigned
                updateData.driverId = tripData.driverId;
                updateData.status = 'Assigned';
              }
            }
            if (tripData.status !== undefined && tripData.driverId === undefined) {
              // Only update status if driverId wasn't changed (to avoid conflicts)
              updateData.status = tripData.status;
            }
            
            if (Object.keys(updateData).length > 0) {
              await client.models.Trip.update({ id: childTrip.id, ...updateData });
            }
          }
        }
      }
      
      // Save custom field values if provided
      if (tripData.customFieldValues && updateResult.data) {
        await saveCustomFieldValues(updateResult.data.id, tripData.customFieldValues, 'Trip');
      }
      
      await loadTrips(true); // Force refresh after update
      setShowTripForm(false);
      setEditingTrip(null);
      alert('Trip updated successfully!');
      
      // Return the updated trip for custom field saving in TripForm
      return updateResult.data;
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
      await deleteAllTrips(true, companyId || undefined); // Skip the internal confirmation since we already asked
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

  const handleAssignMultipleTrips = (tripIds: string[]) => {
    if (tripIds.length === 0) return;
    setTripsToAssign(tripIds);
    setSelectedDriverId(null);
    setShowDriverDialog(true);
  };

  const handleConfirmAssignment = async () => {
    if (tripsToAssign.length === 0) {
      setShowDriverDialog(false);
      return;
    }

    try {
      const driverId = selectedDriverId || undefined;
      const driver = driverId ? drivers.find(d => d.id === driverId) : null;
      let successCount = 0;
      let failCount = 0;
      const previousDrivers = new Map<string, Schema['Driver']['type'] | null>();

      // Get previous drivers for notification purposes
      for (const tripId of tripsToAssign) {
        const trip = trips.find(t => t.id === tripId);
        if (trip?.driverId) {
          const prevDriver = drivers.find(d => d.id === trip.driverId);
          if (prevDriver) {
            previousDrivers.set(tripId, prevDriver);
          }
        }
      }

      // Assign trips
      for (const tripId of tripsToAssign) {
        try {
          const statusValue: 'Assigned' | 'Unassigned' = driverId ? 'Assigned' : 'Unassigned';
          const updateResult = await client.models.Trip.update({
            id: tripId,
            driverId: driverId || undefined,
            status: statusValue,
          });

          if (updateResult.data) {
            successCount++;

            // Send notifications
            const trip = trips.find(t => t.id === tripId);
            const previousDriver = previousDrivers.get(tripId);
            const isReassignment: boolean = !!previousDriver && !!driverId && previousDriver.id !== driverId;
            const isNewAssignment: boolean = !previousDriver && !!driverId;

            // Notify new driver if assigned
            if (driver && updateResult.data && (isNewAssignment || isReassignment)) {
              const preference = driver.notificationPreference || 'email';
              await notifyDriver(
                {
                  trip: updateResult.data,
                  driver: driver,
                  isReassignment: isReassignment,
                },
                {
                  email: preference === 'email' || preference === 'both',
                  inApp: true,
                }
              );
            }

            // Notify previous driver if reassigned
            if (previousDriver && driverId && previousDriver.id !== driverId && trip) {
              await notifyPreviousDriver(previousDriver, trip);
            }
          }
        } catch (error) {
          console.error(`Error assigning trip ${tripId}:`, error);
          failCount++;
        }
      }

      // Wait for database sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadTrips(true);

      // Show confirmation
      const driverName = driver?.name || 'Unassigned';
      if (failCount > 0) {
        alert(
          `Assigned ${successCount} trip${successCount > 1 ? 's' : ''} to ${driverName}.\n` +
          `${failCount} trip${failCount > 1 ? 's' : ''} failed to assign.`
        );
      } else {
        alert(
          `Successfully assigned ${successCount} trip${successCount > 1 ? 's' : ''} to ${driverName}.`
        );
      }

      setShowDriverDialog(false);
      setTripsToAssign([]);
      setSelectedDriverId(null);
    } catch (error: any) {
      console.error('Error assigning trips:', error);
      alert('Failed to assign trips. Please check the console for details.');
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
        const { data: allTrips } = await client.models.Trip.list({
          filter: { companyId: { eq: companyId! } }
        });
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


  const handleLocationUpdate = () => {
    loadLocations();
  };

  const handleSendDailyAssignmentEmails = () => {
    // Ask if user wants to send to all drivers or a specific driver
    const sendToAll = confirm(
      'Send daily assignment emails?\n\n' +
      'Click OK to send to ALL drivers, or Cancel to select a specific driver.'
    );
    
    if (sendToAll) {
      handleSendToAllDrivers();
    } else {
      setShowEmailDriverDialog(true);
      setSelectedEmailDriverId(null);
    }
  };

  const handleSendToAllDrivers = async () => {
    // Confirm sending emails to all drivers
    const confirmMessage = 
      `This will send daily assignment emails to all active drivers with trips scheduled for tomorrow.\n\n` +
      `Each driver will receive an email based on their notification preference.\n` +
      `Email clients will open for each driver. Make sure pop-ups are allowed.\n\n` +
      `Continue?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      const result = await sendDailyAssignmentEmailsToAllDrivers(undefined, {
        email: true,
      }, companyId || undefined);
      
      let message = `Daily assignment emails processed:\n\n`;
      message += `📧 Email:\n`;
      message += `  ✅ Sent: ${result.sent.email}\n`;
      message += `  ❌ Failed: ${result.failed.email}\n\n`;
      message += `⏭️ Skipped: ${result.skipped} (no trips scheduled or preference mismatch)\n\n`;
      message += `Note: Emails sent based on each driver's preference setting.`;
      
      alert(message);
    } catch (error) {
      console.error('Error sending daily assignment emails:', error);
      alert('Failed to send daily assignment emails. Please check the console for details.');
    }
  };

  const handleConfirmEmailDriver = async () => {
    if (!selectedEmailDriverId) {
      alert('Please select a driver.');
      return;
    }

    const driver = drivers.find(d => d.id === selectedEmailDriverId);
    if (!driver) {
      alert('Driver not found.');
      return;
    }

    // Confirm sending email
    if (!confirm(
      `Send daily assignment email to ${driver.name}?\n\n` +
      `Note: ${driver.email ? 'Driver has email address.' : 'Driver has no email address - email will be skipped.'}`
    )) {
      return;
    }

    try {
      const result = await sendDailyAssignmentToDriver(
        selectedEmailDriverId,
        undefined,
        {
          email: true,
        },
        companyId || undefined
      );

      let message = `Daily assignment email for ${driver.name}:\n\n`;
      
      if (result.email) {
        message += `📧 Email: ✅ Sent\n`;
      } else {
        message += `📧 Email: ❌ Failed (${driver.email ? 'error occurred' : 'no email address'})\n`;
      }

      if (!result.email) {
        message += `\nNote: Driver may have no trips scheduled for tomorrow, or missing email address.`;
      }

      alert(message);
      setShowEmailDriverDialog(false);
      setSelectedEmailDriverId(null);
    } catch (error) {
      console.error('Error sending daily assignment email:', error);
      alert('Failed to send daily assignment email. Please check the console for details.');
    }
  };

  if (companyLoading) {
    return <PageSkeleton />;
  }

  if (!companyId) {
    return (
      <div className="management-dashboard">
        <div className="error-state">
          <h2>No Company Assigned</h2>
          {hasAdminAccess ? (
            <>
              <p>As a system admin, you can work with any company. Please select a company to manage:</p>
              <Link 
                to="/admin" 
                className="btn btn-primary"
                style={{ marginTop: '1rem', display: 'inline-block' }}
              >
                Go to Admin Dashboard to Select Company
              </Link>
              <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                In the Admin Dashboard, click "Work As" next to any company to manage it.
              </p>
            </>
          ) : (
            <>
              <p>Your account is not associated with a company. Please check the following:</p>
              <ul style={{ textAlign: 'left', display: 'inline-block', marginTop: '1rem' }}>
                <li>Check the browser console for detailed error messages</li>
                <li>Ensure the schema has been deployed (Company model must exist)</li>
                <li>Try refreshing the page</li>
                <li>If the issue persists, run the migration script: <code>npx ts-node scripts/migrateToMultiTenant.ts</code></li>
                <li>Contact your administrator to be added to a company</li>
              </ul>
              <button 
                className="btn btn-primary" 
                onClick={() => window.location.reload()}
                style={{ marginTop: '1rem' }}
              >
                Refresh Page
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="management-dashboard">
        <div className="dashboard-header">
          <h2>Management Dashboard</h2>
        </div>
        {viewMode === 'list' ? <TripListSkeleton /> : <TripCalendarSkeleton />}
      </div>
    );
  }

  return (
    <div className="management-dashboard" id="main-content" role="main" aria-label="Management Dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Management Dashboard</h2>
          {isAdminOverride && (
            <div style={{ 
              marginTop: '0.5rem', 
              fontSize: '0.875rem', 
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <strong>Admin Mode:</strong> Working as "{company?.name}"
              <Link 
                to="/admin" 
                style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}
              >
                (Change Company)
              </Link>
            </div>
          )}
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingTrip(null);
              setShowTripForm(true);
            }}
            aria-label="Create new trip"
          >
            + New Trip
          </button>
          
          {/* Data Management Dropdown */}
          <div className="dropdown-container">
            <button
              className="btn btn-secondary dropdown-toggle"
              onClick={() => setOpenDropdown(openDropdown === 'data' ? null : 'data')}
              aria-expanded={openDropdown === 'data'}
              aria-haspopup="true"
              aria-label="Data Management menu"
            >
              Data Management
            </button>
            <AnimatePresence>
              {openDropdown === 'data' && (
                <motion.div
                  className="dropdown-menu"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                <Link
                  to="/drivers"
                  className="dropdown-item"
                  onClick={() => setOpenDropdown(null)}
                >
                  Manage Drivers
                </Link>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowLocationManagement(true);
                    setOpenDropdown(null);
                  }}
                >
                  Manage Locations
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowFilterCategoryManagement(true);
                    setOpenDropdown(null);
                  }}
                >
                  Filter Categories
                </button>
              </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Configuration Dropdown */}
          <div className="dropdown-container">
            <button
              className="btn btn-secondary dropdown-toggle"
              onClick={() => setOpenDropdown(openDropdown === 'config' ? null : 'config')}
              aria-expanded={openDropdown === 'config'}
              aria-haspopup="true"
              aria-label="Configuration menu"
            >
              Configuration
            </button>
            <AnimatePresence>
              {openDropdown === 'config' && (
                <motion.div
                  className="dropdown-menu"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowCustomFieldManagement(true);
                    setOpenDropdown(null);
                  }}
                >
                  Custom Fields
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowReportConfigurationManagement(true);
                    setOpenDropdown(null);
                  }}
                >
                  Report Configuration
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowCompanyManagement(true);
                    setOpenDropdown(null);
                  }}
                >
                  Company Settings
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowSubscriptionManagement(true);
                    setOpenDropdown(null);
                  }}
                >
                  Subscription Management
                </button>
              </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Reports Dropdown */}
          <div className="dropdown-container">
            <button
              className="btn btn-secondary dropdown-toggle"
              onClick={() => setOpenDropdown(openDropdown === 'reports' ? null : 'reports')}
              aria-expanded={openDropdown === 'reports'}
              aria-haspopup="true"
              aria-label="Reports menu"
            >
              Reports
            </button>
            <AnimatePresence>
              {openDropdown === 'reports' && (
                <motion.div
                  className="dropdown-menu"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowDriverReports(true);
                    setOpenDropdown(null);
                  }}
                  title="View driver reports and statistics"
                >
                  📊 Driver Reports
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setShowTripReports(true);
                    setOpenDropdown(null);
                  }}
                  title="View trip reports and statistics"
                >
                  📋 Trip Reports
                </button>
              </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions Dropdown */}
          <div className="dropdown-container">
            <button
              className="btn btn-secondary dropdown-toggle"
              onClick={() => setOpenDropdown(openDropdown === 'actions' ? null : 'actions')}
              aria-expanded={openDropdown === 'actions'}
              aria-haspopup="true"
              aria-label="Actions menu"
            >
              Actions
            </button>
            <AnimatePresence>
              {openDropdown === 'actions' && (
                <motion.div
                  className="dropdown-menu"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                <button
                  className="dropdown-item"
                  onClick={() => {
                    handleSendDailyAssignmentEmails();
                    setOpenDropdown(null);
                  }}
                  title="Send daily assignment emails to all drivers for tomorrow"
                >
                  Send Daily Assignment Emails
                </button>
                <button
                  className="dropdown-item dropdown-item-danger"
                  onClick={() => {
                    handleDeleteAllTrips();
                    setOpenDropdown(null);
                  }}
                  title="Delete all trips from the database"
                >
                  Delete All Trips
                </button>
              </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* View Toggle */}
        <div className="view-toggle-container">
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              📋 List
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
              title="Calendar View"
            >
              📅 Calendar
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showTripForm && (
          <TripForm
            trip={editingTrip}
            drivers={drivers}
            locations={locations}
            onSubmit={editingTrip ? (data) => handleUpdateTrip(editingTrip.id, data) : handleCreateTrip}
            onCancel={() => {
              setShowTripForm(false);
              setEditingTrip(null);
            }}
          />
        )}
      </AnimatePresence>


      <Suspense fallback={ComponentLoadingFallback}>
        {showLocationManagement && (
          <LocationManagement
            locations={locations}
            onClose={() => setShowLocationManagement(false)}
            onUpdate={handleLocationUpdate}
          />
        )}

        {showFilterCategoryManagement && (
          <FilterCategoryManagement
            locations={locations}
            trips={trips}
            onClose={() => setShowFilterCategoryManagement(false)}
            onUpdate={() => {
              // Refresh filters if needed
              window.location.reload();
            }}
          />
        )}

        {showCustomFieldManagement && (
          <CustomFieldManagement
            onClose={() => setShowCustomFieldManagement(false)}
          />
        )}

        {showReportConfigurationManagement && (
          <ReportConfigurationManagement
            onClose={() => setShowReportConfigurationManagement(false)}
          />
        )}

        {showCompanyManagement && (
          <CompanyManagement
            onClose={() => setShowCompanyManagement(false)}
            onUpdate={() => {
              // Refresh company context
              window.location.reload();
            }}
          />
        )}

        {showSubscriptionManagement && (
          <SubscriptionManagement
            onClose={() => setShowSubscriptionManagement(false)}
          />
        )}

        {showDriverReports && (
          <DriverReports
            trips={trips}
            drivers={drivers}
            onClose={() => setShowDriverReports(false)}
            onEdit={(trip) => {
              setEditingTrip(trip);
              setShowTripForm(true);
              setShowDriverReports(false);
            }}
          />
        )}

        {showTripReports && (
          <TripReports
            trips={trips}
            drivers={drivers}
            locations={locations}
            onClose={() => setShowTripReports(false)}
            onEdit={(trip) => {
              setEditingTrip(trip);
              setShowTripForm(true);
              setShowTripReports(false);
            }}
          />
        )}
      </Suspense>

      <Suspense fallback={ComponentLoadingFallback}>
        {viewMode === 'list' ? (
          <TripList
            trips={trips}
            drivers={drivers}
            locations={locations}
            onEdit={handleEditTrip}
            onDelete={handleDeleteTrip}
            onDeleteMultiple={handleDeleteMultipleTrips}
            onAssignMultiple={handleAssignMultipleTrips}
            onUpdate={loadTrips}
          />
        ) : (
          <TripCalendar
            trips={trips}
            onDateClick={(date, dateTrips) => {
              setSelectedDateTrips({ date, trips: dateTrips });
            }}
          />
        )}
      </Suspense>

      {/* Date Trips Modal */}
      {selectedDateTrips && (
        <div className="modal-overlay" onClick={() => setSelectedDateTrips(null)}>
          <div className="modal-content date-trips-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Trips on {format(selectedDateTrips.date, 'MMMM d, yyyy')}</h3>
              <button className="close-btn" onClick={() => setSelectedDateTrips(null)}>×</button>
            </div>
            <div className="date-trips-list">
              {selectedDateTrips.trips.length === 0 ? (
                <p className="empty-message">No trips scheduled for this date.</p>
              ) : (
                <div className="trips-list">
                  {selectedDateTrips.trips.map((trip) => {
                    const driver = drivers.find(d => d.id === trip.driverId);
                    return (
                      <div key={trip.id} className="trip-card">
                        <div className="trip-card-header">
                          <div className="trip-flight">
                            <strong>{trip.flightNumber}</strong>
                            {trip.primaryLocationCategory && (
                              <span className="trip-location-category">{trip.primaryLocationCategory}</span>
                            )}
                          </div>
                          <span className={`status-badge ${trip.status === 'Completed' ? 'status-completed' : trip.status === 'Assigned' ? 'status-assigned' : trip.status === 'InProgress' ? 'status-in-progress' : 'status-unassigned'}`}>
                            {trip.status}
                          </span>
                        </div>
                        <div className="trip-card-details">
                          <div className="trip-detail">
                            <span className="detail-label">Time:</span>
                            <span>{trip.pickupDate ? format(new Date(trip.pickupDate), 'h:mm a') : 'TBD'}</span>
                          </div>
                          <div className="trip-detail">
                            <span className="detail-label">Pickup:</span>
                            <span>{trip.pickupLocation || 'TBD'}</span>
                          </div>
                          <div className="trip-detail">
                            <span className="detail-label">Dropoff:</span>
                            <span>{trip.dropoffLocation || 'TBD'}</span>
                          </div>
                          <div className="trip-detail">
                            <span className="detail-label">Driver:</span>
                            <span>{driver?.name || 'Unassigned'}</span>
                          </div>
                          <div className="trip-detail">
                            <span className="detail-label">Passengers:</span>
                            <span>{trip.numberOfPassengers || 1}</span>
                          </div>
                        </div>
                        <div className="trip-card-actions">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              handleEditTrip(trip);
                              setSelectedDateTrips(null);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this trip?')) {
                                handleDeleteTrip(trip.id);
                                setSelectedDateTrips(null);
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <DriverSelectionDialog
        isOpen={showDriverDialog}
        drivers={drivers}
        selectedDriverId={selectedDriverId}
        onSelectDriver={setSelectedDriverId}
        onConfirm={handleConfirmAssignment}
        onCancel={() => {
          setShowDriverDialog(false);
          setTripsToAssign([]);
          setSelectedDriverId(null);
        }}
        tripCount={tripsToAssign.length}
      />

      <DriverSelectionDialog
        isOpen={showEmailDriverDialog}
        drivers={drivers}
        selectedDriverId={selectedEmailDriverId}
        onSelectDriver={setSelectedEmailDriverId}
        onConfirm={handleConfirmEmailDriver}
        onCancel={() => {
          setShowEmailDriverDialog(false);
          setSelectedEmailDriverId(null);
        }}
        title="Select Driver for Daily Assignment Email"
        confirmText="Continue"
        description="Select a driver to send daily assignment notifications to:"
        allowUnassigned={false}
      />
    </div>
  );
}

export default ManagementDashboard;
