const app = require('./app');
const { sequelize, testConnection } = require('./config/database');
const { logger } = require('./middleware/errorHandler');

const PORT = process.env.PORT || 5000;

// Test database connection and start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database models
    if (process.env.NODE_ENV === 'development') {
      try {
        // Try to sync with alter, but fall back to no-alter if it fails
        await sequelize.sync({ alter: true });
        logger.info('Database synchronized successfully');
      } catch (error) {
        // If we get "too many keys" error, sync without alter
        if (error.message && error.message.includes('Too many keys')) {
          logger.warn('⚠️  Too many keys detected. Syncing without alter mode.');
          logger.warn('💡 Consider cleaning up redundant indexes using: node scripts/cleanupIndexes.js');
          await sequelize.sync({ alter: false });
          logger.info('Database synchronized (without alter mode)');
        } else {
          throw error;
        }
      }
    }
    
    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API Base URL: http://localhost:${PORT}/api`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await sequelize.close();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during database closure:', error);
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

