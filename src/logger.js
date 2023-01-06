const ConsoleLogger = require('./loggers/ConsoleLogger');
const GoogleCloudLogger = require('./loggers/GoogleCloudLogger');

let logger;

function delegate(level) {
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
  formatRequest: delegate('formatRequest'),
  trace: delegate('trace'),
  debug: delegate('debug'),
  info: delegate('info'),
  warn: delegate('warn'),
  error: delegate('error'),
};
