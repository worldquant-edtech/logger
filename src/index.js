import {
  trace,
  debug,
  info,
  warn,
  error,
  formatRequest,
  useGoogleCloud,
} from './logger';
import middleware from './middleware';
import { useGoogleCloudTracing, getTracePayload } from './tracing';

const DEFAULT_OPTIONS = {
  logging: true,
  tracing: true,
};

function setupGoogleCloud(options) {
  options = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  if (options.logging) {
    useGoogleCloud({
      getTracePayload: getTracePayload,
    });
  }

  if (options.tracing) {
    useGoogleCloudTracing({
      ignoreIncomingPaths: options.tracing?.ignoreIncomingPaths,
    });
  }
}

export default {
  trace,
  debug,
  info,
  warn,
  error,
  setupGoogleCloud,
  formatRequest,
  middleware,
};
