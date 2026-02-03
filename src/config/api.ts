// API Configuration
// These can be overridden via environment variables
export const API_CONFIG = {
  MAIN_API: import.meta.env.VITE_MAIN_API_URL || "http://localhost:8000",
  TRANSCRIPT_API: import.meta.env.VITE_TRANSCRIPT_API_URL || "http://localhost:8001",
};
