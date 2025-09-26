import ConsoleLogger from './ConsoleLogger';
import consoleAsync from '../utils/async-console';
import { isTTY } from '../utils/env';

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'];

const Sentry = require('@sentry/node');

export default class SentryLogger extends ConsoleLogger {
  constructor(options) {
    super(options);
    Sentry.init({
      dsn: process.env.SENTRY_DSN || options?.dsn,
      release: process.env.SENTRY_RELEASE || options?.release,
      environment: process.env.ENV_NAME || options?.environment || 'local',
      enableLogs: true,
    });
  }

  debug(...args) {
    return this.emit('debug', ...args);
  }

  info(...args) {
    return this.emit('info', ...args);
  }

  warn(...args) {
    return this.emit('warn', ...args);
  }

  error(...args) {
    return this.emit('error', ...args);
  }

  emit(level, ...args) {
    if (LOG_LEVELS.indexOf(level) >= getMinLevel()) {
      this.print(level, ...args);
    }
  }

  print(level, ...args) {
    const fn = Sentry.logger[level];
    let msg = `${this.getDateTag()} ${this.getLevelTag(level)}`;
    if (typeof args[0] === 'string') {
      const [first, ...rest] = args;
      msg += ` ${first}`;
      args = rest;
    }
    fn(msg, ...args);
  }

  getDateTag() {
    // Local date in ISO format, no ms.
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return `[${date.toISOString().slice(0, -5)}]`;
  }

  getLevelTag(level) {
    let tag = level.toUpperCase().padStart(5, ' ');
    return tag;
  }

  formatMeta(meta) {
    return meta;
  }

  formatRequest(info) {
    let { method, path, status, latency, size } = info;
    const message = `${method} ${path} ${size} - ${latency}ms`;
    if (status < 500) {
      Sentry.logger.info(message, {
        'user.id': info.userId,
        latency: latency,
        size: size,
      });
    } else {
      Sentry.logger.error(message, {
        'user.id': info.userId,
        latency: latency,
        size: size,
      });
    }
  }
}

// Wrap this to allow testing.
function log(msg) {
  const console = isTTY ? global.console : consoleAsync;
  console.log(msg);
}

function getMinLevel() {
  const minLevel = LOG_LEVELS.indexOf(process.env.LOG_LEVEL || 'info');
  if (minLevel === -1) {
    throw new Error(`Invalid log level. Must be one of ${LOG_LEVELS}`);
  }
  return minLevel;
}
