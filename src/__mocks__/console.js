let lastArgs;

function delegate(...args) {
  lastArgs = args;
}

function getLast() {
  return lastArgs?.join(' ');
}

function getLastArgs() {
  return lastArgs;
}

function getLastParsed() {
  return JSON.parse(getLast());
}

function reset() {
  lastArgs = undefined;
}

module.exports = {
  reset,
  getLast,
  getLastArgs,
  getLastParsed,
  log: delegate,
  info: delegate,
  trace: delegate,
  debug: delegate,
  error: delegate,
  warn: delegate,
};
