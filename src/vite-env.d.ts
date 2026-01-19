/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Legacy single provider configuration
  readonly VITE_FLIGHT_API_KEY?: string;
  readonly VITE_FLIGHT_API_PROVIDER?: string;
  
  // Multiple provider configuration (recommended)
  readonly VITE_FLIGHT_API_PROVIDERS?: string; // Comma-separated list: 'aviationstack,flightaware'
  readonly VITE_FLIGHT_API_KEY_AVIATIONSTACK?: string;
  readonly VITE_FLIGHT_API_KEY_FLIGHTAWARE?: string;
  
  // Stripe configuration
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  readonly VITE_STRIPE_PRICE_ID_BASIC?: string;
  readonly VITE_STRIPE_PRICE_ID_PREMIUM?: string;
  readonly VITE_STRIPE_CHECKOUT_URL?: string; // Lambda Function URL for checkout
  readonly VITE_STRIPE_PORTAL_URL?: string; // Lambda Function URL for customer portal
  readonly VITE_SERVICE_PROVIDER_NAME?: string; // Service provider company name for login screen
  readonly VITE_SERVICE_PROVIDER_LOGO?: string; // Service provider logo URL for login screen
  readonly VITE_SERVICE_PROVIDER_TAGLINE?: string; // Service provider tagline for login screen
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
