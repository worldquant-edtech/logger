import ConsoleLogger from './ConsoleLogger';

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'];
const MIN_LEVEL = process.env.LOG_LEVEL || 'info';

const { SentryLogger: SentryWrapper } = require('@wqlearning/sentry-logger');

export default class SentryLogger extends ConsoleLogger {
  logger = null;
  constructor(options) {
    super(options);
    this.logger = new SentryWrapper({
      dsn: process.env.SENTRY_DSN || options?.dsn,
      env: process.env.ENV_NAME || options?.env || 'local',
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
    const fn = this.logger[level];
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
      this.logger.info(message, {
        'user.id': info.userId,
        latency: latency,
        size: size,
      });
    } else {
      this.logger.error(message, {
        'user.id': info.userId,
        latency: latency,
        size: size,
      });
    }
  }
}

function getMinLevel() {
  const minLevel = LOG_LEVELS.indexOf(MIN_LEVEL);
  if (minLevel === -1) {
    throw new Error(`Invalid log level. Must be one of ${LOG_LEVELS}`);
  }
  return minLevel;
}
