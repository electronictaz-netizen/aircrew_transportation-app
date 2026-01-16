import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

/**
 * Loads custom field values for trips
 */
export async function loadTripCustomFieldValues(
  tripIds: string[],
  companyId: string
): Promise<Map<string, Map<string, string>>> {
  // Map of tripId -> Map of customFieldId -> value
  const result = new Map<string, Map<string, string>>();
  
  if (tripIds.length === 0 || !companyId) return result;
  
  try {
    // Load all custom field values for this company and entity type, then filter in memory
    // (Amplify Data may not support 'in' operator, so we load all and filter)
    const { data: values } = await client.models.CustomFieldValue.list({
      filter: {
        companyId: { eq: companyId },
        entityType: { eq: 'Trip' },
      },
    });
    
    const tripIdSet = new Set(tripIds);
    (values || []).forEach((value) => {
      if (value.tripId && value.customFieldId && tripIdSet.has(value.tripId)) {
        if (!result.has(value.tripId)) {
          result.set(value.tripId, new Map());
        }
        const tripValues = result.get(value.tripId)!;
        tripValues.set(value.customFieldId, value.value || '');
      }
    });
  } catch (error) {
    console.error('Error loading trip custom field values:', error);
  }
  
  return result;
}

/**
 * Loads custom field values for drivers
 */
export async function loadDriverCustomFieldValues(
  driverIds: string[],
  companyId: string
): Promise<Map<string, Map<string, string>>> {
  // Map of driverId -> Map of customFieldId -> value
  const result = new Map<string, Map<string, string>>();
  
  if (driverIds.length === 0 || !companyId) return result;
  
  try {
    // Load all custom field values for this company and entity type, then filter in memory
    // (Amplify Data may not support 'in' operator, so we load all and filter)
    const { data: values } = await client.models.CustomFieldValue.list({
      filter: {
        companyId: { eq: companyId },
        entityType: { eq: 'Driver' },
      },
    });
    
    const driverIdSet = new Set(driverIds);
    (values || []).forEach((value) => {
      if (value.driverId && value.customFieldId && driverIdSet.has(value.driverId)) {
        if (!result.has(value.driverId)) {
          result.set(value.driverId, new Map());
        }
        const driverValues = result.get(value.driverId)!;
        driverValues.set(value.customFieldId, value.value || '');
      }
    });
  } catch (error) {
    console.error('Error loading driver custom field values:', error);
  }
  
  return result;
}

/**
 * Loads custom fields for a company and entity type
 */
export async function loadCustomFields(
  companyId: string,
  entityType: 'Trip' | 'Driver'
): Promise<Array<Schema['CustomField']['type']>> {
  if (!companyId) return [];
  
  try {
    const { data: fields } = await client.models.CustomField.list({
      filter: {
        companyId: { eq: companyId },
        entityType: { eq: entityType },
        isActive: { eq: true },
      },
    });
    
    return (fields || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  } catch (error) {
    console.error('Error loading custom fields:', error);
    return [];
  }
}

/**
 * Loads report configurations for a company and report type
 */
export async function loadReportConfigurations(
  companyId: string,
  reportType: 'Driver' | 'Trip'
): Promise<Array<Schema['ReportConfiguration']['type']>> {
  if (!companyId) return [];
  
  try {
    const { data: configs } = await client.models.ReportConfiguration.list({
      filter: {
        companyId: { eq: companyId },
        reportType: { eq: reportType },
        isActive: { eq: true },
      },
    });
    
    return (configs || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  } catch (error) {
    console.error('Error loading report configurations:', error);
    return [];
  }
}

/**
 * Gets the custom field value for a trip
 */
export function getTripCustomFieldValue(
  tripId: string,
  customFieldId: string,
  customFieldValues: Map<string, Map<string, string>>
): string {
  const tripValues = customFieldValues.get(tripId);
  if (!tripValues) return '';
  return tripValues.get(customFieldId) || '';
}

/**
 * Gets the custom field value for a driver
 */
export function getDriverCustomFieldValue(
  driverId: string,
  customFieldId: string,
  customFieldValues: Map<string, Map<string, string>>
): string {
  const driverValues = customFieldValues.get(driverId);
  if (!driverValues) return '';
  return driverValues.get(customFieldId) || '';
}

/**
 * Applies custom filters to trips
 */
export function applyCustomFilters(
  trips: Array<Schema['Trip']['type']>,
  filters: Array<{ field: string; operator: string; value: string }>
): Array<Schema['Trip']['type']> {
  let filtered = [...trips];
  
  for (const filter of filters) {
    if (!filter.field || !filter.operator || !filter.value) continue;
    
    filtered = filtered.filter((trip) => {
      const fieldValue = (trip as any)[filter.field];
      if (fieldValue === null || fieldValue === undefined) return false;
      
      const tripValue = String(fieldValue).toLowerCase();
      const filterValue = filter.value.toLowerCase();
      
      switch (filter.operator) {
        case 'eq':
          return tripValue === filterValue;
        case 'ne':
          return tripValue !== filterValue;
        case 'contains':
          return tripValue.includes(filterValue);
        case 'gt':
          return Number(tripValue) > Number(filterValue);
        case 'gte':
          return Number(tripValue) >= Number(filterValue);
        case 'lt':
          return Number(tripValue) < Number(filterValue);
        case 'lte':
          return Number(tripValue) <= Number(filterValue);
        default:
          return true;
      }
    });
  }
  
  return filtered;
}

/**
 * Applies custom filters to drivers
 */
export function applyCustomDriverFilters(
  drivers: Array<Schema['Driver']['type']>,
  filters: Array<{ field: string; operator: string; value: string }>
): Array<Schema['Driver']['type']> {
  let filtered = [...drivers];
  
  for (const filter of filters) {
    if (!filter.field || !filter.operator || !filter.value) continue;
    
    filtered = filtered.filter((driver) => {
      const fieldValue = (driver as any)[filter.field];
      if (fieldValue === null || fieldValue === undefined) return false;
      
      const driverValue = String(fieldValue).toLowerCase();
      const filterValue = filter.value.toLowerCase();
      
      switch (filter.operator) {
        case 'eq':
          return driverValue === filterValue;
        case 'ne':
          return driverValue !== filterValue;
        case 'contains':
          return driverValue.includes(filterValue);
        case 'gt':
          return Number(driverValue) > Number(filterValue);
        case 'gte':
          return Number(driverValue) >= Number(filterValue);
        case 'lt':
          return Number(driverValue) < Number(filterValue);
        case 'lte':
          return Number(driverValue) <= Number(filterValue);
        default:
          return true;
      }
    });
  }
  
  return filtered;
}
