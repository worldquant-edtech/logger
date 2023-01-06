const ConsoleLogger = require('./loggers/ConsoleLogger');
const GoogleCloudLogger = require('./loggers/GoogleCloudLogger');

let logger;

function wrapLogger(level) {
  return (...args) => {
    return logger[level](...args);
  };
}

function useGoogleCloud(options) {
  logger = new GoogleCloudLogger(options);
}

function useConsole() {
  logger = new ConsoleLogger();
}

// Default to console logger
useConsole();

module.exports = {
  useConsole,
  useGoogleCloud,
  formatRequest: wrapLogger('formatRequest'),
  trace: wrapLogger('trace'),
  debug: wrapLogger('debug'),
  info: wrapLogger('info'),
  warn: wrapLogger('warn'),
  error: wrapLogger('error'),
};
