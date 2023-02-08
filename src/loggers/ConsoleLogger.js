import console from 'console';

import { gray, yellow, red, cyan, green } from 'kleur';

const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error'];

export default class ConsoleLogger {
  debug(...args) {
    return this.print('debug', ...args);
  }

  info(...args) {
    return this.print('info', ...args);
  }

  warn(...args) {
    return this.print('warn', ...args);
  }

  error(...args) {
    return this.print('error', ...args);
  }

  print(level, ...args) {
    if (LOG_LEVELS.indexOf(level) < getMinLevel()) {
      return '';
    }

    const fn = console[level];

    let msg = `${getDateTag()} ${getLevelTag(level)}`;
    if (typeof args[0] === 'string') {
      const [first, ...rest] = args;
      msg += ` ${first}`;
      args = rest;
    }

    fn(msg, ...args);
  }

  formatRequest(info) {
    let { method, path, status, latency, size } = info;
    const level = status < 500 ? 'info' : 'error';
    method = method.padEnd(6, ' ');
    status = getStatusCode(status);
    const meta = gray(`${path} ${latency}ms ${size}`);
    const msg = `${method} ${status} ${meta}`;
    this[level](msg);
  }
}

function getMinLevel() {
  const minLevel = LOG_LEVELS.indexOf(process.env.LOG_LEVEL || 'info');
  if (minLevel === -1) {
    throw new Error(`Invalid log level. Must be one of ${LOG_LEVELS}`);
  }
  return minLevel;
}

function getLevelTag(level) {
  let tag = level.toUpperCase().padStart(5, ' ');
  if (level === 'error') {
    tag = red(tag);
  } else if (level === 'warn') {
    tag = yellow(tag);
  } else {
    tag = gray(tag);
  }
  return tag;
}

function getStatusCode(status) {
  if (status >= 500) {
    return red(status);
  } else if (status >= 400) {
    return yellow(status);
  } else if (status >= 300) {
    return cyan(status);
  } else {
    return green(status);
  }
}

function getDateTag() {
  // Local date in ISO format, no ms.
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return gray(`[${date.toISOString().slice(0, -5)}]`);
}
