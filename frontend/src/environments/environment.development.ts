export const environment = {
  production: false,
  apiUrl: '/api', // Use relative URL for Docker compatibility
  
  // Network configuration
  apiTimeout: 30000, // 30 seconds timeout
  retryAttempts: 3,
  retryDelay: 1000, // 1 second delay between retries
  
  // Error handling configuration
  enableErrorLogging: true,
  showNetworkErrors: true,
  
  // Health check configuration
  healthCheckInterval: 30000, // Check every 30 seconds in dev
  healthCheckEndpoint: '/api/health',
  
  // Development flags
  debugMode: true,
  logApiCalls: true,
  
  // Fallback URLs for development
  fallbackApiUrl: 'http://localhost:8080/api', // Direct backend access as fallback
  enableFallback: true
};
