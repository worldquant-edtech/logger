import ConsoleLogger from './loggers/ConsoleLogger';
import GoogleCloudLogger from './loggers/GoogleCloudLogger';

let logger;

export function useGoogleCloud(options) {
  logger = new GoogleCloudLogger(options);
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

export function formatRequest(...args) {
  return logger['formatRequest'](...args);
}

// Default to console logger
useConsole();
