export const environment = {
  production: true,
  apiUrl: '/api', // Use relative URL for nginx proxy in Docker
  
  // Network configuration
  apiTimeout: 30000, // 30 seconds timeout
  retryAttempts: 3,
  retryDelay: 1000, // 1 second delay between retries
  
  // Error handling configuration
  enableErrorLogging: true,
  showNetworkErrors: true,
  
  // Health check configuration
  healthCheckInterval: 60000, // Check every minute
  healthCheckEndpoint: '/api/health',
  
  // Development flags
  debugMode: false,
  logApiCalls: false
};
