import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { format } from 'date-fns';
import { useCompany } from '../contexts/CompanyContext';
import { useNotification } from './Notification';
import NotificationComponent from './Notification';
import { hasFeatureAccess } from '../utils/stripe';
import { validateFlightNumber, validateLocation, validatePassengers, MAX_LENGTHS } from '../utils/validation';
import { logger } from '../utils/logger';
import { formatCoordinates } from '../utils/gpsLocation';
import { reverseGeocode } from '../utils/reverseGeocoding';
import { renderCustomFieldInput, validateCustomFieldValue } from '../utils/customFields.tsx';
import { tripFormSchema, type TripFormData } from '../schemas/tripSchema';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import LoadingButton from './LoadingButton';
import { AddressAutocompleteInput } from './AddressAutocompleteInput';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Checkbox } from './ui/checkbox';
import './TripForm.css';

const client = generateClient<Schema>();

interface TripFormProps {
  trip?: Schema['Trip']['type'] | null;
  drivers: Array<Schema['Driver']['type']>;
  locations?: Array<Schema['Location']['type']>;
  vehicles?: Array<Schema['Vehicle']['type']>;
  customers?: Array<Schema['Customer']['type']>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

function TripForm({ trip, drivers, locations = [], vehicles = [], customers = [], onSubmit, onCancel }: TripFormProps) {
  const { companyId, company } = useCompany();
  const { notification, showError, hideNotification } = useNotification();
  
  // Filter locations to ensure only locations for the current company are shown
  const companyLocations = companyId ? locations.filter(l => l.companyId === companyId) : locations;
  
  // Filter vehicles to ensure only vehicles for the current company are shown
  const companyVehicles = companyId ? vehicles.filter(v => v.companyId === companyId) : vehicles;
  const activeVehicles = companyVehicles.filter(v => v.isActive !== false);
  
  // Filter customers to ensure only customers for the current company are shown
  const companyCustomers = companyId ? customers.filter(c => c.companyId === companyId) : customers;
  const activeCustomers = companyCustomers.filter(c => c.isActive !== false);
  
  // Get active locations grouped by category
  const activeLocations = companyLocations.filter(l => l.isActive !== false);
  const locationsByCategory = activeLocations.reduce((acc, loc) => {
    const category = loc.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(loc);
    return acc;
  }, {} as Record<string, typeof activeLocations>);

  // Determine trip type based on existing flight number format
  const getInitialTripType = (flightNumber: string | undefined): 'Airport Trip' | 'Standard Trip' => {
    if (!flightNumber) return 'Airport Trip';
    const flightNumberPattern = /^[A-Z]{2,3}\d{1,4}[A-Z]?$/i;
    return flightNumberPattern.test(flightNumber.trim()) ? 'Airport Trip' : 'Standard Trip';
  };

  const initialTripType = trip?.flightNumber ? getInitialTripType(trip.flightNumber) : 'Airport Trip';
  const isInitialAirportTrip = initialTripType === 'Airport Trip';

  // Initialize form with React Hook Form
  const form = useForm<TripFormData>({
    resolver: zodResolver(tripFormSchema) as any,
    defaultValues: {
      tripType: initialTripType,
      primaryLocationCategory: trip?.primaryLocationCategory || trip?.airport || '',
      pickupDate: trip?.pickupDate ? format(new Date(trip.pickupDate), "yyyy-MM-dd'T'HH:mm") : '',
      flightNumber: isInitialAirportTrip ? (trip?.flightNumber || '') : '',
      standardTripIdentifier: !isInitialAirportTrip ? (trip?.flightNumber || '') : '',
      pickupLocation: trip?.pickupLocation || '',
      dropoffLocation: trip?.dropoffLocation || '',
      numberOfPassengers: trip?.numberOfPassengers || 1,
      driverId: trip?.driverId || '',
      customerId: trip?.customerId || '',
      vehicleIds: [],
      status: (trip?.status as 'Unassigned' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled') || 'Unassigned',
      isRecurring: trip?.isRecurring || !!trip?.parentTripId || false,
      recurringPattern: (trip?.recurringPattern as 'daily' | 'weekly' | 'monthly') || 'weekly',
      recurringEndDate: trip?.recurringEndDate ? format(new Date(trip.recurringEndDate), "yyyy-MM-dd'T'HH:mm") : '',
      tripRate: trip?.tripRate !== null && trip?.tripRate !== undefined ? String(trip.tripRate) : '',
      driverPayAmount: trip?.driverPayAmount !== null && trip?.driverPayAmount !== undefined ? String(trip.driverPayAmount) : '',
      notes: trip?.notes || '',
    },
  });

  const [loading, setLoading] = useState(false);
  
  // Custom fields state
  const [customFields, setCustomFields] = useState<Array<Schema['CustomField']['type']>>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [loadingCustomFields, setLoadingCustomFields] = useState(true);
  
  // Trip vehicles loading state
  const [loadingTripVehicles, setLoadingTripVehicles] = useState(false);
  
  // GPS address states
  const [pickupAddress, setPickupAddress] = useState<string | null>(null);
  const [dropoffAddress, setDropoffAddress] = useState<string | null>(null);
  const [loadingPickupAddress, setLoadingPickupAddress] = useState(false);
  const [loadingDropoffAddress, setLoadingDropoffAddress] = useState(false);

  // Watch trip type to handle conditional fields
  const tripType = form.watch('tripType');
  const isRecurring = form.watch('isRecurring');

  // Initialize location modes based on whether current values match saved locations
  const getInitialLocationMode = (location: string): 'text' | 'location' => {
    const savedLocationNames = activeLocations.map(l => l.name);
    if (savedLocationNames.includes(location)) return 'location';
    return 'text';
  };
  
  const [pickupLocationMode, setPickupLocationMode] = useState<'text' | 'location'>(() => 
    getInitialLocationMode(form.getValues('pickupLocation'))
  );
  const [dropoffLocationMode, setDropoffLocationMode] = useState<'text' | 'location'>(() => 
    getInitialLocationMode(form.getValues('dropoffLocation'))
  );

  // Load custom fields for trips
  useEffect(() => {
    const loadCustomFields = async () => {
      if (!companyId) return;
      
      try {
        setLoadingCustomFields(true);
        const { data: fieldsData } = await client.models.CustomField.list({
          filter: {
            companyId: { eq: companyId },
            entityType: { eq: 'Trip' },
            isActive: { eq: true },
          },
        });
        const sortedFields = (fieldsData || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setCustomFields(sortedFields);
        
        // Initialize custom field values with defaults
        const initialValues: Record<string, string> = {};
        sortedFields.forEach((field) => {
          initialValues[field.id] = field.defaultValue || '';
        });
        setCustomFieldValues(initialValues);
      } catch (error) {
        logger.error('Error loading custom fields:', error);
      } finally {
        setLoadingCustomFields(false);
      }
    };
    
    loadCustomFields();
  }, [companyId]);

  // Load existing custom field values when editing a trip
  useEffect(() => {
    const loadExistingValues = async () => {
      if (!trip?.id || !companyId || customFields.length === 0) return;
      
      try {
        const { data: valuesData } = await client.models.CustomFieldValue.list({
          filter: {
            companyId: { eq: companyId },
            tripId: { eq: trip.id },
            entityType: { eq: 'Trip' },
          },
        });
        
        const existingValues: Record<string, string> = { ...customFieldValues };
        (valuesData || []).forEach((value) => {
          if (value.customFieldId) {
            existingValues[value.customFieldId] = value.value || '';
          }
        });
        setCustomFieldValues(existingValues);
      } catch (error) {
        logger.error('Error loading custom field values:', error);
      }
    };
    
    loadExistingValues();
  }, [trip?.id, companyId, customFields.length]);

  // Load existing trip vehicles when editing a trip
  useEffect(() => {
    const loadTripVehicles = async () => {
      if (!trip?.id || !companyId) {
        form.setValue('vehicleIds', []);
        return;
      }
      
      try {
        setLoadingTripVehicles(true);
        const { data: tripVehiclesData } = await client.models.TripVehicle.list({
          filter: {
            companyId: { eq: companyId },
            tripId: { eq: trip.id },
          },
        });
        
        const vehicles = (tripVehiclesData || []).map(tv => tv.vehicleId).filter(Boolean) as string[];
        form.setValue('vehicleIds', vehicles);
      } catch (error) {
        logger.error('Error loading trip vehicles:', error);
      } finally {
        setLoadingTripVehicles(false);
      }
    };
    
    loadTripVehicles();
  }, [trip?.id, companyId]);

  // Load addresses for GPS coordinates when trip is loaded or changes
  useEffect(() => {
    const loadAddresses = async () => {
      if (trip?.startLocationLat && trip?.startLocationLng) {
        setLoadingPickupAddress(true);
        const result = await reverseGeocode(trip.startLocationLat, trip.startLocationLng);
        if (result.success && result.address) {
          setPickupAddress(result.address);
        } else {
          setPickupAddress(null);
        }
        setLoadingPickupAddress(false);
      } else {
        setPickupAddress(null);
      }

      if (trip?.completeLocationLat && trip?.completeLocationLng) {
        setLoadingDropoffAddress(true);
        const result = await reverseGeocode(trip.completeLocationLat, trip.completeLocationLng);
        if (result.success && result.address) {
          setDropoffAddress(result.address);
        } else {
          setDropoffAddress(null);
        }
        setLoadingDropoffAddress(false);
      } else {
        setDropoffAddress(null);
      }
    };

    loadAddresses();
  }, [trip?.startLocationLat, trip?.startLocationLng, trip?.completeLocationLat, trip?.completeLocationLng]);

  // Handle form submission
  const onSubmitForm = async (values: TripFormData) => {
    // Validate custom fields
    const customFieldErrors: Record<string, string> = {};
    customFields.forEach((field) => {
      const value = customFieldValues[field.id] || '';
      const validation = validateCustomFieldValue(field, value);
      if (!validation.isValid) {
        customFieldErrors[`custom_${field.id}`] = validation.error || '';
      }
    });
    
    if (Object.keys(customFieldErrors).length > 0) {
      // Show custom field errors
      Object.entries(customFieldErrors).forEach(([key, error]) => {
        showError(`${key}: ${error}`);
      });
      return;
    }
    
    setLoading(true);

    try {
      // Determine primary location category from pickup location
      let primaryCategory = '';
      if (pickupLocationMode === 'location') {
        const selectedLocation = activeLocations.find(l => l.name === values.pickupLocation);
        primaryCategory = selectedLocation?.category || '';
      }
      
      // Sanitize inputs
      const pickupValidation = validateLocation(values.pickupLocation);
      const dropoffValidation = validateLocation(values.dropoffLocation);
      const passengerValidation = validatePassengers(values.numberOfPassengers);
      
      // Get the identifier value based on trip type
      let identifierValue: string;
      if (values.tripType === 'Airport Trip') {
        const flightValidation = validateFlightNumber(values.flightNumber || '');
        identifierValue = flightValidation.sanitized;
      } else {
        identifierValue = (values.standardTripIdentifier || '').trim();
      }
      
      const submitData: any = {
        primaryLocationCategory: primaryCategory || undefined,
        airport: primaryCategory || undefined,
        pickupDate: new Date(values.pickupDate).toISOString(),
        flightNumber: identifierValue,
        pickupLocation: pickupValidation.sanitized,
        dropoffLocation: dropoffValidation.sanitized,
        numberOfPassengers: passengerValidation.value,
        driverId: values.driverId || undefined,
        customerId: values.customerId || undefined,
        vehicleIds: values.vehicleIds || [],
        status: values.driverId ? 'Assigned' : 'Unassigned',
        isRecurring: values.isRecurring === true,
        tripRate: values.tripRate ? parseFloat(values.tripRate) : undefined,
        driverPayAmount: values.driverPayAmount ? parseFloat(values.driverPayAmount) : undefined,
        notes: values.notes?.trim() || undefined,
      };

      // Only include recurring fields if it's a recurring job
      if (values.isRecurring) {
        submitData.recurringPattern = values.recurringPattern;
        if (values.recurringEndDate) {
          submitData.recurringEndDate = new Date(values.recurringEndDate).toISOString();
        }
      } else {
        submitData.recurringPattern = undefined;
        submitData.recurringEndDate = undefined;
        submitData.parentTripId = undefined;
      }

      // Add custom field values to submit data
      submitData.customFieldValues = customFieldValues;
      
      logger.debug('TripForm submitting data:', submitData);
      await onSubmit(submitData);
    } catch (error) {
      logger.error('Error preparing trip data:', error);
      showError('Error preparing trip data. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle location mode change and update primary category
  const handlePickupLocationChange = (value: string) => {
    form.setValue('pickupLocation', value);
    if (pickupLocationMode === 'location') {
      const selectedLocation = activeLocations.find(l => l.name === value);
      if (selectedLocation?.category) {
        form.setValue('primaryLocationCategory', selectedLocation.category || '');
      }
    }
  };

  const handleDropoffLocationChange = (value: string) => {
    form.setValue('dropoffLocation', value);
  };

  // Handle trip type change - clear the other field
  const handleTripTypeChange = (newTripType: 'Airport Trip' | 'Standard Trip') => {
    form.setValue('tripType', newTripType);
    if (newTripType === 'Airport Trip') {
      form.setValue('standardTripIdentifier', '');
    } else {
      form.setValue('flightNumber', '');
    }
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onCancel}
    >
      <motion.div
        className="modal-content"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{trip ? 'Edit Trip' : 'Create New Trip'}</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-4">
            <FormField
              control={form.control}
              name="pickupDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup Date and Time *</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tripType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trip Type *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      handleTripTypeChange(value as 'Airport Trip' | 'Standard Trip');
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Airport Trip">Airport Trip</SelectItem>
                      <SelectItem value="Standard Trip">Standard Trip</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tripType === 'Airport Trip' ? (
              <FormField
                control={form.control}
                name="flightNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flight Number *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., AA1234"
                        maxLength={MAX_LENGTHS.FLIGHT_NUMBER}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value.toUpperCase());
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="standardTripIdentifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Number / PO Number / Identifier *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter job number, PO number, or any identifier"
                        maxLength={MAX_LENGTHS.FLIGHT_NUMBER}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="pickupLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup Location *</FormLabel>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    <Button
                      type="button"
                      variant={pickupLocationMode === 'location' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPickupLocationMode('location')}
                      disabled={activeLocations.length === 0}
                      title={activeLocations.length === 0 ? 'No saved locations available. Add locations in Manage Locations.' : 'Select from saved locations'}
                    >
                      Use Saved Location
                    </Button>
                    <Button
                      type="button"
                      variant={pickupLocationMode === 'text' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPickupLocationMode('text')}
                    >
                      Enter Text
                    </Button>
                  </div>
                  <FormControl>
                    {pickupLocationMode === 'location' ? (
                      <Select
                        value={field.value || undefined}
                        onValueChange={handlePickupLocationChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Saved Location" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(locationsByCategory).map(([category, locs]) => (
                            <div key={category}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                                {category || 'Uncategorized'}
                              </div>
                              {(locs as typeof activeLocations).map((location: Schema['Location']['type']) => (
                                <SelectItem key={location.id} value={location.name}>
                                  {location.name}{location.address ? ` - ${location.address}` : ''}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <AddressAutocompleteInput
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Enter pickup location"
                        maxLength={MAX_LENGTHS.LOCATION}
                        aria-label="Pickup location"
                        aria-describedby={form.formState.errors.pickupLocation ? 'pickup-location-error' : undefined}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dropoffLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dropoff Location *</FormLabel>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    <Button
                      type="button"
                      variant={dropoffLocationMode === 'location' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDropoffLocationMode('location')}
                      disabled={activeLocations.length === 0}
                      title={activeLocations.length === 0 ? 'No saved locations available. Add locations in Manage Locations.' : 'Select from saved locations'}
                    >
                      Use Saved Location
                    </Button>
                    <Button
                      type="button"
                      variant={dropoffLocationMode === 'text' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDropoffLocationMode('text')}
                    >
                      Enter Text
                    </Button>
                  </div>
                  <FormControl>
                    {dropoffLocationMode === 'location' ? (
                      <Select
                        value={field.value || undefined}
                        onValueChange={handleDropoffLocationChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Saved Location" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(locationsByCategory).map(([category, locs]) => (
                            <div key={category}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase">
                                {category || 'Uncategorized'}
                              </div>
                              {(locs as typeof activeLocations).map((location: Schema['Location']['type']) => (
                                <SelectItem key={location.id} value={location.name}>
                                  {location.name}{location.address ? ` - ${location.address}` : ''}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <AddressAutocompleteInput
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Enter dropoff location"
                        maxLength={MAX_LENGTHS.LOCATION}
                        aria-label="Dropoff location"
                        aria-describedby={form.formState.errors.dropoffLocation ? 'dropoff-location-error' : undefined}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numberOfPassengers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Passengers</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      {...field}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="driverId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driver Assigned</FormLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={(value) => field.onChange(value || undefined)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {drivers
                        .filter((d) => d.isActive)
                        .map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {!field.value && 'Leave unselected to keep trip unassigned'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select
                    value={field.value || undefined}
                    onValueChange={(value) => field.onChange(value || undefined)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="No customer assigned" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeCustomers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                          {customer.companyName ? ` (${customer.companyName})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {!field.value && 'Optional: Select a customer for this trip'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vehicleIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicles Assigned</FormLabel>
                  {loadingTripVehicles ? (
                    <p className="text-sm text-muted-foreground">Loading vehicles...</p>
                  ) : (
                    <div className="space-y-2">
                      {activeVehicles.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">
                          No active vehicles available. Add vehicles in Manage Vehicles.
                        </p>
                      ) : (
                        <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                          {activeVehicles.map((vehicle) => {
                            const isChecked = (field.value || []).includes(vehicle.id);
                            return (
                              <div key={vehicle.id} className="flex items-start space-x-2 py-2">
                                <FormControl>
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      const currentIds = field.value || [];
                                      if (checked) {
                                        field.onChange([...currentIds, vehicle.id]);
                                      } else {
                                        field.onChange(currentIds.filter(id => id !== vehicle.id));
                                      }
                                    }}
                                  />
                                </FormControl>
                                <div className="flex-1">
                                  <label
                                    htmlFor={`vehicle-${vehicle.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  >
                                    {vehicle.name}
                                    {vehicle.make || vehicle.model 
                                      ? ` (${[vehicle.make, vehicle.model].filter(Boolean).join(' ')})` 
                                      : ''}
                                  </label>
                                  {vehicle.licensePlate && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      Plate: {vehicle.licensePlate}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  <FormDescription>
                    Optional: Select one or more vehicles for this trip
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (!checked) {
                          form.setValue('recurringPattern', 'weekly');
                          form.setValue('recurringEndDate', '');
                        }
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Recurring Job</FormLabel>
                    {trip && (trip.isRecurring || trip.parentTripId) && (
                      <p className="text-sm text-destructive mt-1">
                        {trip.isRecurring 
                          ? '⚠️ Unchecking will delete all child trips'
                          : '⚠️ Unchecking will cancel recurrence and delete future trips'}
                      </p>
                    )}
                  </div>
                </FormItem>
              )}
            />

            {isRecurring && (
              <>
                <FormField
                  control={form.control}
                  name="recurringPattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurring Pattern</FormLabel>
                      <Select
                        value={field.value || 'weekly'}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recurringEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurring End Date *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormDescription>
                        Jobs will be automatically created until this date
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Financial Information */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="mb-4 text-base font-semibold text-foreground">Financial Information (for Billing & Payroll)</h4>
              
              <FormField
                control={form.control}
                name="tripRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trip Rate (Customer Charge)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Amount charged to customer/airline for this trip (optional, for billing verification)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="driverPayAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver Pay Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Fixed amount paid to driver for this trip (optional, will calculate from driver pay rate if not specified)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (for Billing/Payroll)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Additional notes for billing or payroll verification..."
                        maxLength={1000}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional notes for billing or payroll verification
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Custom Fields */}
            {hasFeatureAccess(company?.subscriptionTier, 'custom_fields') && customFields.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="mb-4 text-base font-semibold text-foreground">Additional Information</h4>
                {loadingCustomFields ? (
                  <p className="text-muted-foreground italic">Loading custom fields...</p>
                ) : (
                  customFields.map((field) => {
                    const fieldError = form.formState.errors[`custom_${field.id}` as keyof typeof form.formState.errors];
                    return (
                      <div key={field.id} className="mb-4">
                        {renderCustomFieldInput(
                          field,
                          customFieldValues[field.id] || '',
                          (value) => {
                            setCustomFieldValues((prev) => ({
                              ...prev,
                              [field.id]: value,
                            }));
                          },
                          fieldError ? String(fieldError) : undefined
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* GPS Location Information */}
            {trip && (trip.startLocationLat || trip.completeLocationLat) && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="mb-4 text-base font-semibold text-foreground">GPS Location Information</h4>
                
                {trip.startLocationLat && trip.startLocationLng && (
                  <div className="mb-4">
                    <label className="block mb-2 font-medium text-foreground">
                      Pickup Location GPS
                    </label>
                    <div className="text-sm text-muted-foreground mb-1">
                      📍 Coordinates: {formatCoordinates(trip.startLocationLat, trip.startLocationLng)}
                    </div>
                    {loadingPickupAddress ? (
                      <div className="text-sm text-muted-foreground italic">
                        Loading address...
                      </div>
                    ) : pickupAddress ? (
                      <div className="text-sm text-foreground mt-1">
                        🏠 Address: {pickupAddress}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        Address not available
                      </div>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${trip.startLocationLat},${trip.startLocationLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline mt-1 inline-block"
                    >
                      View on Map ↗
                    </a>
                  </div>
                )}

                {trip.completeLocationLat && trip.completeLocationLng && (
                  <div>
                    <label className="block mb-2 font-medium text-foreground">
                      Dropoff Location GPS
                    </label>
                    <div className="text-sm text-muted-foreground mb-1">
                      📍 Coordinates: {formatCoordinates(trip.completeLocationLat, trip.completeLocationLng)}
                    </div>
                    {loadingDropoffAddress ? (
                      <div className="text-sm text-muted-foreground italic">
                        Loading address...
                      </div>
                    ) : dropoffAddress ? (
                      <div className="text-sm text-foreground mt-1">
                        🏠 Address: {dropoffAddress}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        Address not available
                      </div>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${trip.completeLocationLat},${trip.completeLocationLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline mt-1 inline-block"
                    >
                      View on Map ↗
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <LoadingButton 
                type="submit" 
                isLoading={loading}
                loadingText="Saving..."
                disabled={loading}
              >
                {trip ? 'Update' : 'Create'} Trip
              </LoadingButton>
            </div>
          </form>
        </Form>
      </motion.div>
      {notification && <NotificationComponent notification={notification} onClose={hideNotification} />}
    </motion.div>
  );
}

export default TripForm;
