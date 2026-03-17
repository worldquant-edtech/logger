import {
  trace,
  debug,
  info,
  warn,
  error,
  formatRequest,
  useConsole,
  useFormatted,
  useGoogleCloud,
  useSentry,
  getLoggerType,
} from './logger';
import { isTTY, isCloudEnv } from './utils/env';
import middleware from './middleware';

const DEFAULT_OPTIONS = {
  logging: true,
};

/**
 * @param {Object} [options]
 * @param {boolean} [options.logging=true]
 */
function setupGoogleCloud(options) {
  options = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  if (options.logging) {
    useGoogleCloud();
  }
}

if (isCloudEnv() && !isTTY) {
  setupGoogleCloud();
} else {
  useFormatted();
}

function setupSentry(options) {
  options = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  if (options.logging) {
    useSentry(options);
  }
}

export {
  trace,
  debug,
  info,
  warn,
  error,
  formatRequest,
  middleware,
  useConsole,
  useFormatted,
  useGoogleCloud,
  useSentry,
  setupGoogleCloud,
  setupSentry,
  getLoggerType,
};

export default {
  trace,
  debug,
  info,
  warn,
  error,
  formatRequest,
  middleware,
  useConsole,
  useFormatted,
  useGoogleCloud,
  useSentry,
  setupGoogleCloud,
  setupSentry,
  getLoggerType,
};
