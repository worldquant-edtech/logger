const logger = require('./logger');
const middleware = require('./middleware');
const tracing = require('./tracing');

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
    logger.useGoogleCloud({
      getTracePayload: tracing.getTracePayload,
    });
  }

  if (options.tracing) {
    tracing.useGoogleCloudTracing({
      ignoreIncomingPaths: options.tracing?.ignoreIncomingPaths,
    });
  }
}

module.exports = {
  setupGoogleCloud,
  middleware,
  ...logger,
};
