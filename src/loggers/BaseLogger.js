const DEFAULT_DEPTH = 3;

export default class BaseLogger {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * @returns {this}
   */
  context(fields) {
    const clone = Object.create(this.constructor.prototype);
    clone.options = {
      ...this.options,
      context: {
        ...this.options.context,
        ...fields,
      },
    };
    return clone;
  }

  /**
   * Sets the depth to which complex objects will be
   * output when logged. The default depth is `3` which
   * matches console.log.
   *
   * @param {number} depth
   */
  setInspectDepth(depth) {
    this.options.depth = depth;
  }

  getMessage(args) {
    const { depth = DEFAULT_DEPTH } = this.options;
    args = printf(args);
    return args.map((arg) => dump(arg, depth)).join(' ');
  }
}

const PRINTF_REG = /%(s|d|i)/g;

function printf(args) {
  let [first] = args;
  if (typeof first === 'string') {
    first = first.replace(PRINTF_REG, (all, op) => {
      let inject = args.splice(1, 1)[0];
      if (op === 'd' || op === 'i') {
        inject = Number(inject);
      }
      return inject;
    });
    args[0] = first;
  }
  return args;
}

function dump(arg, depth, level = 0) {
  if (!depth) {
    return JSON.stringify(arg, null, 2);
  }
  if (Array.isArray(arg)) {
    if (level < depth) {
      const str = arg.map((el) => dump(el, depth, level + 1)).join(', ');
      return `[${str}]`;
    } else {
      return `[Array]`;
    }
  } else if (arg instanceof Error) {
    return arg.stack;
  } else if (!isPrimitive(arg)) {
    if (level < depth) {
      const keys = Object.keys(arg);
      const str = keys
        .map((key) => {
          return `${key}: ${dump(arg[key], depth, level + 1)}`;
        })
        .join(', ');
      return `{ ${str} }`;
    } else {
      return '[Object]';
    }
  } else {
    return level > 0 ? JSON.stringify(arg) : arg;
  }
}

function isPrimitive(arg) {
  return arg !== Object(arg);
}
