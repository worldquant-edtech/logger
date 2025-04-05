import { inspect } from 'util';

const DEFAULT_DEPTH = 2;

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

function dump(arg, depth) {
  if (typeof arg === 'object') {
    return inspect(arg, { depth });
  } else {
    return String(arg);
  }
}
