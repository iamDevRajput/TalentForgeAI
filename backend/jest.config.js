/**
 * jest.config.js — Jest configuration for ESM backend
 *
 * WHY --experimental-vm-modules:
 *   The backend uses "type": "module" (ES Modules). Jest's native ESM support
 *   still requires this Node flag. Command in package.json:
 *   "node --experimental-vm-modules node_modules/.bin/jest"
 */

export default {
  testEnvironment: 'node',
  transform: {},              // No transform needed for native ESM
  testMatch: ['**/tests/**/*.test.js'],
  moduleDirectories: ['node_modules', '<rootDir>/../node_modules'],
  // Increase timeout for integration tests that hit a real (test) MongoDB
  testTimeout: 30000,
  // Show individual test names
  verbose: true,
  // Coverage (run with --coverage flag)
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',         // Entry point — not unit testable
    '!src/config/logger.js',  // Infrastructure
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
