export default class BaseLogger {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * @returns {this}
   */
  context(metadata) {
    const clone = Object.create(this.constructor.prototype);
    clone.options = {
      ...this.options,
      metadata: {
        ...this.options.metadata,
        ...metadata,
      },
    };
    return clone;
  }
}
