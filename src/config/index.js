const config = require('./config');

// You can add environment-specific configurations here
const environment = process.env.NODE_ENV || 'development';

// Merge any environment-specific overrides with base config
const environmentConfig = {
  development: {
    debug: true,
    logLevel: 'debug'
  },
  production: {
    debug: false,
    logLevel: 'error'
  },
  test: {
    debug: true,
    logLevel: 'debug'
  }
}[environment] || {};

// Export the merged configuration
module.exports = {
  ...config,
  ...environmentConfig,
  
  // Environment helper methods
  isProd: environment === 'production',
  isDev: environment === 'development',
  isTest: environment === 'test',
  
  // Helper method to get environment
  getEnvironment: () => environment,

  // Method to validate required config values
  validateConfig: () => {
    const requiredKeys = [
      'botToken',
      'mongoUri',
      'btcPayServerUrl',
      'adminIds',
      'supportChat'
    ];

    const missingKeys = requiredKeys.filter(key => !config[key]);
    
    if (missingKeys.length > 0) {
      throw new Error(`Missing required configuration keys: ${missingKeys.join(', ')}`);
    }

    return true;
  }
};
