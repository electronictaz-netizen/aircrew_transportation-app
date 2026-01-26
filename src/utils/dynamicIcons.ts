/**
 * Utility functions for dynamically updating app icons and manifest
 * based on company logo
 */

/**
 * Updates the favicon and apple-touch-icon links in the document head
 */
export function updateFavicon(logoUrl: string | null | undefined) {
  if (!logoUrl) {
    // Reset to default icons
    updateFaviconLink('icon', '/vite.svg');
    updateFaviconLink('apple-touch-icon', '/apple-touch-icon.png');
    return;
  }

  // Update favicon
  updateFaviconLink('icon', logoUrl);
  
  // Update apple-touch-icon
  updateFaviconLink('apple-touch-icon', logoUrl);
}

function updateFaviconLink(rel: string, href: string) {
  // Remove existing links
  const existingLinks = document.querySelectorAll(`link[rel="${rel}"]`);
  existingLinks.forEach(link => link.remove());

  // Create new link
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  if (rel === 'apple-touch-icon') {
    link.setAttribute('sizes', '180x180');
  }
  document.head.appendChild(link);
}

/**
 * Updates the PWA manifest with company logo
 */
export function updateManifest(logoUrl: string | null | undefined, companyName?: string) {
  // Get or create manifest link
  let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
  if (!manifestLink) {
    manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    document.head.appendChild(manifestLink);
  }

  const applyManifest = (manifest: Record<string, unknown>) => {
    if (companyName) {
      manifest.name = `${companyName} - Transportation Management`;
      manifest.short_name = (companyName.length > 12 ? companyName.substring(0, 12) : companyName) as string;
    }
    if (logoUrl) {
      manifest.icons = [
        { src: logoUrl, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: logoUrl, sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
      ];
    }
    // Ensure all shortcuts have absolute URLs (required for blob: URL manifests)
    const shortcuts = manifest.shortcuts as Array<{ icons?: Array<{ src: string }>; url?: string }> | undefined;
    if (shortcuts?.length) {
      shortcuts.forEach((s) => {
        // Ensure url is absolute (required for blob: URL manifests)
        if (s.url) {
          try {
            s.url = new URL(s.url, window.location.origin).href;
          } catch {
            s.url = window.location.origin + (s.url.startsWith('/') ? s.url : '/' + s.url);
          }
        } else {
          s.url = window.location.origin + '/';
        }
        // Update shortcut icon if logoUrl is provided
        if (logoUrl && s.icons?.[0]) {
          s.icons[0].src = logoUrl;
        }
      });
    }
    // Convert start_url and scope to absolute URLs (required when manifest is loaded from blob: URL)
    if (manifest.start_url) {
      try {
        manifest.start_url = new URL(manifest.start_url as string, window.location.origin).href;
      } catch {
        manifest.start_url = window.location.origin + ((manifest.start_url as string).startsWith('/') 
          ? (manifest.start_url as string) 
          : '/' + (manifest.start_url as string));
      }
    } else {
      manifest.start_url = window.location.origin + '/?utm_source=pwa';
    }
    if (manifest.scope) {
      try {
        manifest.scope = new URL(manifest.scope as string, window.location.origin).href;
      } catch {
        manifest.scope = window.location.origin + ((manifest.scope as string).startsWith('/') 
          ? (manifest.scope as string) 
          : '/' + (manifest.scope as string));
      }
    } else {
      manifest.scope = window.location.origin + '/';
    }
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    manifestLink.href = URL.createObjectURL(blob);
  };

  const defaultManifest: Record<string, unknown> = {
    name: 'Onyx Transportation App',
    short_name: 'Onyx',
    description: 'Manage transportation trips and assignments',
    theme_color: '#3b82f6',
    background_color: '#ffffff',
    display: 'standalone',
    scope: window.location.origin + '/',
    start_url: window.location.origin + '/?utm_source=pwa',
    icons: [
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ],
    shortcuts: [
      { name: 'Management Dashboard', url: window.location.origin + '/management', icons: [{ src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }] },
      { name: 'Driver Dashboard', url: window.location.origin + '/driver', icons: [{ src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }] }
    ]
  };

  fetch('/manifest.json')
    .then((response) => {
      if (!response.ok) throw new Error(`manifest ${response.status}`);
      const ct = response.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('manifest not JSON');
      return response.json();
    })
    .then((manifest: Record<string, unknown>) => applyManifest(manifest))
    .catch(() => {
      applyManifest(defaultManifest);
    });
}

/**
 * Updates all app icons and manifest based on company logo
 */
export function updateAppIcons(logoUrl: string | null | undefined, companyName?: string) {
  updateFavicon(logoUrl);
  updateManifest(logoUrl, companyName);
  
  // Update theme color if needed (could be extracted from logo, but keeping default for now)
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', '#3b82f6'); // Keep default theme color
  }

  // Update apple-mobile-web-app-title
  const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitleMeta && companyName) {
    appleTitleMeta.setAttribute('content', companyName.length > 12 ? companyName.substring(0, 12) : companyName);
  }
}
