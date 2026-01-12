/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FLIGHT_API_KEY?: string;
  readonly VITE_FLIGHT_API_PROVIDER?: string;
  // Add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
