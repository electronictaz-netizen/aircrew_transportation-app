import { z } from 'zod';
import { MAX_LENGTHS } from '../utils/validation';

// Email validation pattern
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation pattern (allows various formats)
const PHONE_PATTERN = /^[\d\s\-\(\)\+\.]+$/;

export const driverFormSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(MAX_LENGTHS.NAME, `Name must be no more than ${MAX_LENGTHS.NAME} characters`)
    .refine(
      (val) => val.trim().length >= 1,
      { message: 'Name cannot be empty or only whitespace' }
    ),
  email: z.string()
    .optional()
    .refine(
      (val) => !val || val.trim() === '' || EMAIL_PATTERN.test(val.trim()),
      { message: 'Invalid email format' }
    ),
  phone: z.string()
    .optional()
    .refine(
      (val) => !val || val.trim() === '' || PHONE_PATTERN.test(val.trim()),
      { message: 'Invalid phone number format' }
    ),
  licenseNumber: z.string()
    .max(MAX_LENGTHS.LICENSE_NUMBER, `License number must be no more than ${MAX_LENGTHS.LICENSE_NUMBER} characters`)
    .optional(),
  isActive: z.boolean().default(true),
  notificationPreference: z.enum(['email', 'both']).default('email'),
  payRatePerTrip: z.string()
    .optional()
    .refine(
      (val) => !val || val.trim() === '' || !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
      { message: 'Pay rate per trip must be a valid number' }
    ),
  payRatePerHour: z.string()
    .optional()
    .refine(
      (val) => !val || val.trim() === '' || !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
      { message: 'Pay rate per hour must be a valid number' }
    ),
});

export type DriverFormData = z.infer<typeof driverFormSchema>;
