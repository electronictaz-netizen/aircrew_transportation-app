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
 * Enhanced sign out function that clears caches before signing out
 */
export async function signOutWithCacheClear(
  signOutFn: () => void | Promise<void>
): Promise<void> {
  try {
    // Clear all caches first
    await clearAllCaches();
    
    // Wait a moment to ensure cache clearing completes
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Call the original sign out function
    if (typeof signOutFn === 'function') {
      await signOutFn();
    }
    
    // After sign out, force a hard reload to ensure clean state
    // Note: This may not execute if signOut redirects, but it's a safety measure
    setTimeout(() => {
      if (window.location.href.includes('sign-in') || !document.querySelector('[data-amplify-authenticator]')) {
        // If we're on sign-in page or authenticator is gone, do a hard reload
        window.location.href = window.location.origin;
      }
    }, 1000);
  } catch (error) {
    console.error('Error during sign out with cache clear:', error);
    // Still try to sign out even if cache clearing failed
    if (typeof signOutFn === 'function') {
      await signOutFn();
    }
  }
}
