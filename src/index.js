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
} from './logger';
import { isTTY, isCloudEnv } from './utils/env';
import middleware from './middleware';
import {
  useGoogleCloudTracing,
  getTracePayload,
  setCloudConfig,
} from './tracing';

const DEFAULT_OPTIONS = {
  logging: true,
  tracing: {
    ignoreIncomingPaths: ['/', /^\/1\/status\/*/],
  },
};

/**
 * @param {Object} [options]
 * @param {boolean} [options.logging=true]
 * @param {boolean|Object} [options.tracing=true]
 */
function setupGoogleCloud(options) {
  options = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  if (options.logging) {
    useGoogleCloud({
      getTracePayload,
    });
  }

  if (options.tracing) {
    useGoogleCloudTracing({
      ignoreIncomingPaths: options.tracing?.ignoreIncomingPaths,
    });
  }
}

if (isCloudEnv()) {
  setupGoogleCloud();
} else if (isTTY) {
  useFormatted();
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
  setCloudConfig,
  setupGoogleCloud,
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
  setCloudConfig,
  setupGoogleCloud,
};
