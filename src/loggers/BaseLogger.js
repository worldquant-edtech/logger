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
}
