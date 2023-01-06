const logger = require('./logger');
const middleware = require('./middleware');
const tracing = require('./tracing');

function setupGoogleCloud() {
  tracing.useGoogleCloudTracing();
  logger.useGoogleCloud({
    getTracePayload: tracing.getTracePayload,
  });
}

module.exports = {
  setupGoogleCloud,
  middleware,
  ...logger,
};
