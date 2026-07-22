/**
 * server.js — Application entry point
 *
 * Startup sequence:
 *   1. Validate environment (env.js — fails fast if config is broken)
 *   2. Connect MongoDB
 *   3. Connect Redis
 *   4. Start HTTP server
 *
 * Shutdown sequence (on SIGTERM / SIGINT):
 *   1. Stop accepting new connections
 *   2. Disconnect MongoDB
 *   3. Disconnect Redis
 *   4. Exit cleanly
 *
 * WHY graceful shutdown: Kubernetes (and Docker Compose) send SIGTERM before
 * killing a container. Without a handler, in-flight requests are aborted.
 */

import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import logger from './config/logger.js';

let server;

async function startServer() {
  try {
    // 1. Connect to data stores
    await connectDB();
    await connectRedis();

    // 2. Bind HTTP server
    server = app.listen(env.PORT, () => {
      logger.info(`🚀  TalentForgeAI API running on port ${env.PORT} [${env.NODE_ENV}]`);
      logger.info(`📡  Health check: http://localhost:${env.PORT}/api/health`);
    });

    server.on('error', (err) => {
      logger.error(`HTTP server error: ${err.message}`);
      process.exit(1);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

async function shutdown(signal) {
  logger.info(`${signal} received. Initiating graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      try {
        await disconnectDB();
        await disconnectRedis();
        logger.info('✅  Graceful shutdown complete');
        process.exit(0);
      } catch (err) {
        logger.error(`Error during shutdown: ${err.message}`);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
}

// ── Signal handlers ───────────────────────────────────────────────────────────
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch-all for unhandled rejections — log and exit.
// The Winston rejectionHandler also catches these for logging, but this ensures
// we always exit (unhandled rejections indicate a programming error).
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Promise Rejection: ${reason}`);
  shutdown('unhandledRejection');
});

startServer();
