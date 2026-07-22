/**
 * db.js — Mongoose connection manager
 *
 * WHY separate from server.js: testable in isolation, and the connection
 * lifecycle (connect, reconnect, disconnect) is cleanly encapsulated.
 */

import mongoose from 'mongoose';
import { env } from './env.js';
import logger from './logger.js';

const MONGOOSE_OPTS = {
  // Connection pool: max 10 concurrent connections to MongoDB.
  // Default is 5 — bumped slightly for the async job queue paths.
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000, // Fail fast if Mongo is unreachable
  socketTimeoutMS: 45000,
};

export async function connectDB() {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, MONGOOSE_OPTS);
    logger.info(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error(`❌  MongoDB connection failed: ${err.message}`);
    throw err; // Let server.js handle the process exit
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
}

// Re-emit Mongoose connection events so they appear in the log
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected — retrying...');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB error: ${err.message}`);
});
