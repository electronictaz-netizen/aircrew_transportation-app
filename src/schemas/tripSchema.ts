import { z } from 'zod';
import { MAX_LENGTHS } from '../utils/validation';

// Flight number pattern: 2-3 letters followed by 1-4 digits (e.g., AA1234, UAL123)
const FLIGHT_NUMBER_PATTERN = /^[A-Z]{2,3}\d{1,4}[A-Z]?$/i;

export const tripFormSchema = z.object({
  tripType: z.enum(['Airport Trip', 'Standard Trip']),
  primaryLocationCategory: z.string().optional(),
  pickupDate: z.string().min(1, 'Pickup date is required').refine(
    (date) => {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return false;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const dateOnly = new Date(dateObj);
      dateOnly.setHours(0, 0, 0, 0);
      return dateOnly >= now;
    },
    { message: 'Pickup date cannot be in the past' }
  ),
  flightNumber: z.string().optional(),
  standardTripIdentifier: z.string().optional(),
  pickupLocation: z.string().min(3, 'Pickup location must be at least 3 characters').max(MAX_LENGTHS.LOCATION, `Pickup location must be no more than ${MAX_LENGTHS.LOCATION} characters`),
  dropoffLocation: z.string().min(3, 'Dropoff location must be at least 3 characters').max(MAX_LENGTHS.LOCATION, `Dropoff location must be no more than ${MAX_LENGTHS.LOCATION} characters`),
  numberOfPassengers: z.coerce.number().int().min(1, 'Number of passengers must be at least 1').max(100, 'Number of passengers cannot exceed 100'),
  driverId: z.string().optional(),
  vehicleIds: z.array(z.string()).optional(),
  status: z.enum(['Unassigned', 'Assigned', 'In Progress', 'Completed', 'Cancelled']),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.enum(['daily', 'weekly', 'monthly']).optional(),
  recurringEndDate: z.string().optional(),
  tripRate: z.string().optional(),
  driverPayAmount: z.string().optional(),
  notes: z.string().max(1000, 'Notes must be no more than 1000 characters').optional(),
}).refine(
  (data) => {
    // If Airport Trip, flightNumber is required
    if (data.tripType === 'Airport Trip') {
      if (!data.flightNumber || data.flightNumber.trim() === '') {
        return false;
      }
      // Validate flight number format
      const sanitized = data.flightNumber.trim().toUpperCase();
      if (sanitized.length < 3 || sanitized.length > MAX_LENGTHS.FLIGHT_NUMBER) {
        return false;
      }
      return FLIGHT_NUMBER_PATTERN.test(sanitized);
    }
    // If Standard Trip, standardTripIdentifier is required
    if (data.tripType === 'Standard Trip') {
      return data.standardTripIdentifier && data.standardTripIdentifier.trim().length > 0;
    }
    return true;
  },
  {
    message: 'Flight number must be 2-3 letters followed by 1-4 digits (e.g., AA1234)',
    path: ['flightNumber'],
  }
).refine(
  (data) => {
    // If recurring, recurringEndDate is required and must be after pickupDate
    if (data.isRecurring) {
      if (!data.recurringEndDate || data.recurringEndDate.trim() === '') {
        return false;
      }
      const startDate = new Date(data.pickupDate);
      const endDate = new Date(data.recurringEndDate);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return false;
      }
      return endDate > startDate;
    }
    return true;
  },
  {
    message: 'Recurring end date must be after pickup date',
    path: ['recurringEndDate'],
  }
);

export type TripFormData = z.infer<typeof tripFormSchema>;
