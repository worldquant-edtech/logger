let lastArgs;

export default {
  log: delegate,
  info: delegate,
  trace: delegate,
  debug: delegate,
  error: delegate,
  warn: delegate,
};

export function getLast() {
  return lastArgs?.join(' ');
}

export function getLastArgs() {
  return lastArgs;
}

export function getLastParsed() {
  return JSON.parse(getLast());
}

export function reset() {
  lastArgs = undefined;
}

function delegate(...args) {
  lastArgs = args;
}
