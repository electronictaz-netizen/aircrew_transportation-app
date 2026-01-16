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

  // Fetch current manifest or create new one
  fetch('/manifest.json')
    .then(response => response.json())
    .then(manifest => {
      // Update manifest with company info
      if (companyName) {
        manifest.name = `${companyName} - Transportation Management`;
        manifest.short_name = companyName.length > 12 ? companyName.substring(0, 12) : companyName;
      }

      // Update icons if logo is provided
      if (logoUrl) {
        manifest.icons = [
          {
            src: logoUrl,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: logoUrl,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ];

        // Update shortcuts icons
        if (manifest.shortcuts) {
          manifest.shortcuts.forEach((shortcut: any) => {
            if (shortcut.icons) {
              shortcut.icons[0].src = logoUrl;
            }
          });
        }
      }

      // Create blob URL for updated manifest
      const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
        type: 'application/json'
      });
      const manifestUrl = URL.createObjectURL(manifestBlob);
      manifestLink.href = manifestUrl;
    })
    .catch(error => {
      console.error('Error updating manifest:', error);
      // Fall back to default manifest
      manifestLink.href = '/manifest.json';
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
