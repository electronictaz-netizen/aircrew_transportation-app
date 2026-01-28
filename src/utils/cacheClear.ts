/**
 * Cache Clearing Utility
 * 
 * Provides functions to clear various caches when user signs out.
 * Clears service worker cache, browser cache, and local storage.
 */

/**
 * Clear all service worker caches
 */
async function clearServiceWorkerCaches(): Promise<void> {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('✅ Service worker caches cleared');
    }
  } catch (error) {
    console.error('Error clearing service worker caches:', error);
  }
}

/**
 * Unregister service worker
 */
async function unregisterServiceWorker(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
      console.log('✅ Service workers unregistered');
    }
  } catch (error) {
    console.error('Error unregistering service workers:', error);
  }
}

/**
 * Clear browser storage (localStorage and sessionStorage)
 */
function clearBrowserStorage(): void {
  try {
    // Clear localStorage (except for items you want to keep)
    const keysToKeep: string[] = []; // Add any keys you want to preserve
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    console.log('✅ Browser storage cleared');
  } catch (error) {
    console.error('Error clearing browser storage:', error);
  }
}

/**
 * Clear IndexedDB (if used by the app)
 */
async function clearIndexedDB(): Promise<void> {
  try {
    if ('indexedDB' in window) {
      // Note: This is a simplified approach. For production, you may want to
      // be more specific about which databases to clear.
      const databases = await indexedDB.databases();
      await Promise.all(
        databases.map(db => {
          return new Promise<void>((resolve, reject) => {
            const deleteReq = indexedDB.deleteDatabase(db.name || '');
            deleteReq.onsuccess = () => resolve();
            deleteReq.onerror = () => reject(deleteReq.error);
            deleteReq.onblocked = () => {
              console.warn(`Database ${db.name} deletion blocked`);
              resolve(); // Resolve anyway to continue
            };
          });
        })
      );
      console.log('✅ IndexedDB cleared');
    }
  } catch (error) {
    console.error('Error clearing IndexedDB:', error);
  }
}

/**
 * Clear all caches and storage
 * Call this before signing out to ensure clean state
 */
export async function clearAllCaches(): Promise<void> {
  console.log('🧹 Clearing all caches and storage...');
  
  try {
    // Clear service worker caches
    await clearServiceWorkerCaches();
    
    // Unregister service workers
    await unregisterServiceWorker();
    
    // Clear browser storage
    clearBrowserStorage();
    
    // Clear IndexedDB
    await clearIndexedDB();
    
    console.log('✅ All caches and storage cleared');
  } catch (error) {
    console.error('Error during cache clearing:', error);
    // Don't throw - we still want to proceed with sign out even if cache clearing fails
  }
}

/**
 * Enhanced sign out function: signs out immediately, then clears caches in the background.
 * Sign-out is never blocked by cache clearing (e.g. IndexedDB can hang in some browsers).
 */
export async function signOutWithCacheClear(
  signOutFn: () => void | Promise<void>
): Promise<void> {
  const doSignOut = typeof signOutFn === 'function' ? signOutFn : null;
  if (!doSignOut) {
    // No sign-out function: still clear caches and redirect
    clearAllCaches().catch((err) => console.error('Cache clear error:', err));
    window.location.href = window.location.origin;
    return;
  }

  try {
    // Sign out first so the UI updates immediately and is never blocked by cache clearing
    await Promise.resolve(doSignOut());
  } catch (error) {
    console.error('Error during sign out:', error);
  }

  // Redirect to show sign-in screen (Amplify may not always replace the view)
  window.location.href = window.location.origin;

  // Clear caches in the background so next load is clean
  clearAllCaches().catch((err) => console.error('Cache clear error:', err));
}
