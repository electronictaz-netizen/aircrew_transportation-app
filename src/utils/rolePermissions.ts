/**
 * Role-Based Permissions Utility
 * 
 * Defines what each role can do in the system
 */

export type UserRole = 'admin' | 'manager' | 'driver';

/**
 * Check if a role has permission to access management features
 * Managers and admins can access management, drivers cannot
 */
export function canAccessManagement(role?: UserRole | null): boolean {
  return role === 'admin' || role === 'manager';
}

/**
 * Check if a role has permission to access driver view
 * All roles can access driver view
 */
export function canAccessDriverView(_role?: UserRole | null): boolean {
  return true; // All roles can see driver view
}

/**
 * Check if a role can create/edit/delete trips
 * Only managers and admins can manage trips
 */
export function canManageTrips(role?: UserRole | null): boolean {
  return role === 'admin' || role === 'manager';
}

/**
 * Check if a role can manage drivers
 * Only managers and admins can manage drivers
 */
export function canManageDrivers(role?: UserRole | null): boolean {
  return role === 'admin' || role === 'manager';
}

/**
 * Check if a role can manage locations
 * Only managers and admins can manage locations
 */
export function canManageLocations(role?: UserRole | null): boolean {
  return role === 'admin' || role === 'manager';
}

/**
 * Check if a role can view/edit all trips (not just assigned ones)
 * Only managers and admins can see all trips
 */
export function canViewAllTrips(role?: UserRole | null): boolean {
  return role === 'admin' || role === 'manager';
}

/**
 * Check if a role can start/complete trips
 * Drivers can only start/complete their assigned trips
 * Managers and admins can start/complete any trip
 */
export function canStartCompleteTrip(_role?: UserRole | null): boolean {
  return true; // All roles can start/complete trips (with restrictions on which trips)
}

/**
 * Check if a role can access reports
 * Only managers and admins can access reports
 */
export function canAccessReports(role?: UserRole | null): boolean {
  return role === 'admin' || role === 'manager';
}

/**
 * Check if a role can manage company settings
 * Only managers and admins can manage company settings
 */
export function canManageCompanySettings(role?: UserRole | null): boolean {
  return role === 'admin' || role === 'manager';
}

/**
 * Get the default route for a role
 * Drivers should go to driver view, others to management
 */
export function getDefaultRoute(role?: UserRole | null): string {
  if (role === 'driver') {
    return '/driver';
  }
  return '/management';
}
