/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Legacy single provider configuration
  readonly VITE_FLIGHT_API_KEY?: string;
  readonly VITE_FLIGHT_API_PROVIDER?: string;
  
  // Multiple provider configuration (recommended)
  readonly VITE_FLIGHT_API_PROVIDERS?: string; // Comma-separated list: 'aviationstack,flightaware'
  readonly VITE_FLIGHT_API_KEY_AVIATIONSTACK?: string;
  readonly VITE_FLIGHT_API_KEY_FLIGHTAWARE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
