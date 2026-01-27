/**
 * Offline Storage Utility
 * Provides IndexedDB storage for offline access to trips and related data
 */

const DB_NAME = 'onyx-transportation-db';
const DB_VERSION = 1;

interface TripData {
  id: string;
  data: any;
  timestamp: number;
  companyId: string;
}

interface OfflineQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  model: string;
  data: any;
  timestamp: number;
}

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
export async function initOfflineStorage(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[OfflineStorage] Failed to open database');
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('[OfflineStorage] Database opened successfully');
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create object stores
      if (!database.objectStoreNames.contains('trips')) {
        const tripsStore = database.createObjectStore('trips', { keyPath: 'id' });
        tripsStore.createIndex('companyId', 'companyId', { unique: false });
        tripsStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!database.objectStoreNames.contains('drivers')) {
        const driversStore = database.createObjectStore('drivers', { keyPath: 'id' });
        driversStore.createIndex('companyId', 'companyId', { unique: false });
      }

      if (!database.objectStoreNames.contains('vehicles')) {
        const vehiclesStore = database.createObjectStore('vehicles', { keyPath: 'id' });
        vehiclesStore.createIndex('companyId', 'companyId', { unique: false });
      }

      if (!database.objectStoreNames.contains('customers')) {
        const customersStore = database.createObjectStore('customers', { keyPath: 'id' });
        customersStore.createIndex('companyId', 'companyId', { unique: false });
      }

      if (!database.objectStoreNames.contains('offlineQueue')) {
        const queueStore = database.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      console.log('[OfflineStorage] Database schema created');
    };
  });
}

/**
 * Store trips data for offline access
 */
export async function cacheTrips(trips: any[], companyId: string): Promise<void> {
  if (!db) {
    await initOfflineStorage();
  }

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction(['trips'], 'readwrite');
    const store = transaction.objectStore('trips');

    // Clear old trips for this company
    const index = store.index('companyId');
    const clearRequest = index.openCursor(IDBKeyRange.only(companyId));

    clearRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        // Now store new trips
        const promises = trips.map((trip) => {
          return new Promise<void>((resolve, reject) => {
            const tripData: TripData = {
              id: trip.id,
              data: trip,
              timestamp: Date.now(),
              companyId,
            };
            const request = store.put(tripData);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        });

        Promise.all(promises)
          .then(() => {
            console.log(`[OfflineStorage] Cached ${trips.length} trips`);
            resolve();
          })
          .catch(reject);
      }
    };

    clearRequest.onerror = () => reject(clearRequest.error);
  });
}

/**
 * Get cached trips for offline access
 */
export async function getCachedTrips(companyId: string): Promise<any[]> {
  if (!db) {
    await initOfflineStorage();
  }

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction(['trips'], 'readonly');
    const store = transaction.objectStore('trips');
    const index = store.index('companyId');
    const request = index.getAll(companyId);

    request.onsuccess = () => {
      const trips = request.result.map((item: TripData) => item.data);
      console.log(`[OfflineStorage] Retrieved ${trips.length} cached trips`);
      resolve(trips);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Cache drivers data
 */
export async function cacheDrivers(drivers: any[], companyId: string): Promise<void> {
  if (!db) {
    await initOfflineStorage();
  }

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction(['drivers'], 'readwrite');
    const store = transaction.objectStore('drivers');

    const promises = drivers.map((driver) => {
      return new Promise<void>((resolve, reject) => {
        const driverData = {
          id: driver.id,
          data: driver,
          companyId,
        };
        const request = store.put(driverData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    Promise.all(promises)
      .then(() => {
        console.log(`[OfflineStorage] Cached ${drivers.length} drivers`);
        resolve();
      })
      .catch(reject);
  });
}

/**
 * Get cached drivers
 */
export async function getCachedDrivers(companyId: string): Promise<any[]> {
  if (!db) {
    await initOfflineStorage();
  }

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction(['drivers'], 'readonly');
    const store = transaction.objectStore('drivers');
    const index = store.index('companyId');
    const request = index.getAll(companyId);

    request.onsuccess = () => {
      const drivers = request.result.map((item: any) => item.data);
      resolve(drivers);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Add item to offline queue for sync when online
 */
export async function addToOfflineQueue(
  type: 'create' | 'update' | 'delete',
  model: string,
  data: any
): Promise<void> {
  if (!db) {
    await initOfflineStorage();
  }

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction(['offlineQueue'], 'readwrite');
    const store = transaction.objectStore('offlineQueue');

    const queueItem: OfflineQueueItem = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      model,
      data,
      timestamp: Date.now(),
    };

    const request = store.add(queueItem);
    request.onsuccess = () => {
      console.log('[OfflineStorage] Added item to offline queue');
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get offline queue items
 */
export async function getOfflineQueue(): Promise<OfflineQueueItem[]> {
  if (!db) {
    await initOfflineStorage();
  }

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction(['offlineQueue'], 'readonly');
    const store = transaction.objectStore('offlineQueue');
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear offline queue item
 */
export async function clearOfflineQueueItem(id: string): Promise<void> {
  if (!db) {
    await initOfflineStorage();
  }

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction(['offlineQueue'], 'readwrite');
    const store = transaction.objectStore('offlineQueue');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if we're online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}
