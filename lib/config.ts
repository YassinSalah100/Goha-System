// Central configuration file for the application

// API configuration
export const API_CONFIG = {
  // Base URL for all API calls - use environment variable if available, otherwise use default
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://20.117.240.138:3000/api/v1",
  
  // Timeout in milliseconds for API requests
  TIMEOUT: 30000,
  
  // Default headers for all requests
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  }
};

// Other application-wide configuration can be added here
export const APP_CONFIG = {
  // App name
  APP_NAME: "Goha System",
  
  // Version
  VERSION: "1.0.0",
};
