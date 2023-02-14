import ConsoleLogger from './loggers/ConsoleLogger';
import FormattedLogger from './loggers/FormattedLogger';
import GoogleCloudLogger from './loggers/GoogleCloudLogger';

let logger;

export function useGoogleCloud(options) {
  logger = new GoogleCloudLogger(options);
}

export function useFormatted() {
  logger = new FormattedLogger();
}

export function useConsole() {
  logger = new ConsoleLogger();
}

export function trace(...args) {
  return logger['trace'](...args);
}

export function debug(...args) {
  return logger['debug'](...args);
}

export function info(...args) {
  return logger['info'](...args);
}

export function warn(...args) {
  return logger['warn'](...args);
}

export function error(...args) {
  return logger['error'](...args);
}

/**
 * @param {Object} request
 * @param {string} request.method
 * @param {string} request.path
 * @param {number} request.status
 * @param {number} request.latency
 * @param {string} request.size
 *
 * Formats a log for a request object from Koa.
 */
export function formatRequest(request) {
  return logger['formatRequest'](request);
}

// Default to console logger
useConsole();
