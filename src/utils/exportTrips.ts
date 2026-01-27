import type { Schema } from '../../amplify/data/resource';
import { format } from 'date-fns';

/**
 * Export trips to CSV format
 */
export function exportTripsToCSV(
  trips: Array<Schema['Trip']['type']>,
  drivers: Array<Schema['Driver']['type']>,
  customers: Array<Schema['Customer']['type']>,
  filename: string = 'trips-export.csv'
): void {
  // Helper to get driver name
  const getDriverName = (driverId: string | null | undefined): string => {
    if (!driverId) return 'Unassigned';
    const driver = drivers.find((d) => d.id === driverId);
    return driver?.name || 'Unknown';
  };

  // Helper to get customer name
  const getCustomerName = (customerId: string | null | undefined): string => {
    if (!customerId) return '';
    const customer = customers.find((c) => c.id === customerId);
    return customer ? (customer.companyName ? `${customer.name} (${customer.companyName})` : customer.name) : '';
  };

  // CSV Headers
  const headers = [
    'Trip ID',
    'Category',
    'Pickup Date',
    'Pickup Time',
    'Flight/Job Number',
    'Pickup Location',
    'Dropoff Location',
    'Number of Passengers',
    'Customer',
    'Driver',
    'Status',
    'Actual Pickup Time',
    'Actual Dropoff Time',
    'Trip Rate',
    'Driver Pay Amount',
    'Notes',
    'Is Recurring',
    'Recurring Pattern',
  ];

  // Convert trips to CSV rows
  const rows = trips.map((trip) => {
    const pickupDate = trip.pickupDate ? new Date(trip.pickupDate) : null;
    
    return [
      trip.id,
      trip.primaryLocationCategory || trip.airport || '',
      pickupDate ? format(pickupDate, 'yyyy-MM-dd') : '',
      pickupDate ? format(pickupDate, 'HH:mm') : '',
      trip.flightNumber || '',
      trip.pickupLocation || '',
      trip.dropoffLocation || '',
      String(trip.numberOfPassengers || 1),
      getCustomerName(trip.customerId),
      getDriverName(trip.driverId),
      trip.status || 'Unassigned',
      trip.actualPickupTime ? format(new Date(trip.actualPickupTime), 'yyyy-MM-dd HH:mm') : '',
      trip.actualDropoffTime ? format(new Date(trip.actualDropoffTime), 'yyyy-MM-dd HH:mm') : '',
      trip.tripRate ? String(trip.tripRate) : '',
      trip.driverPayAmount ? String(trip.driverPayAmount) : '',
      trip.notes || '',
      trip.isRecurring ? 'Yes' : 'No',
      trip.recurringPattern || '',
    ];
  });

  // Escape CSV values (handle commas, quotes, newlines)
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  // Combine headers and rows
  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(cell => escapeCSV(String(cell || ''))).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
