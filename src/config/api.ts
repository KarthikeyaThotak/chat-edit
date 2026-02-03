// API Configuration
// These can be overridden via environment variables
export const API_CONFIG = {
  MAIN_API: import.meta.env.VITE_MAIN_API_URL || "https://api.drafft.tech",
  TRANSCRIPT_API: import.meta.env.VITE_TRANSCRIPT_API_URL || "https://transcript.drafft.tech",
};
