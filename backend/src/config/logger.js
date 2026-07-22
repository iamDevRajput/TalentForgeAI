/**
 * logger.js — Winston logger singleton
 *
 * WHY: A centralised logger means all log output is consistent in format,
 * can be redirected to external sinks (e.g. Datadog) in one place, and
 * doesn't pollute the codebase with console.log calls.
 *
 * - Development: colourised, human-readable output
 * - Production:  JSON lines (machine-parseable by log aggregators)
 */

import winston from 'winston';
import { env } from './env.js';

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  }),
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
  ],
  // In production you would add a File or HTTP transport here
  // e.g. new winston.transports.Http({ host: 'logs.example.com' })
  exceptionHandlers: [new winston.transports.Console()],
  rejectionHandlers: [new winston.transports.Console()],
});

/**
 * Morgan-compatible HTTP request logger stream.
 * Mount via: app.use(morgan('combined', { stream: morganStream }))
 */
export const morganStream = {
  write: (message) => logger.http(message.trim()),
};

export default logger;
