const GoogleCloudLogger = require('../loggers/GoogleCloudLogger');
const { getLastParsed, reset } = require('console');

const logger = new GoogleCloudLogger();

jest.mock('console');

afterEach(() => {
  reset();
});

describe('basic logging', () => {
  it('debug', async () => {
    logger.debug('msg');
    expect(getLastParsed()).toEqual({
      message: 'msg',
      severity: 'DEBUG',
    });
  });

  it('info', async () => {
    logger.info('msg');
    expect(getLastParsed()).toEqual({
      message: 'msg',
      severity: 'INFO',
    });
  });

  it('warn', async () => {
    logger.warn('msg');
    expect(getLastParsed()).toEqual({
      message: 'msg',
      severity: 'WARNING',
    });
  });

  it('error', async () => {
    logger.error('msg');
    expect(getLastParsed()).toEqual({
      message: 'msg',
      severity: 'ERROR',
    });
  });
});

describe('complex logging', () => {
  it('should concatenate multiple string arguments', async () => {
    logger.info('one', 'two');
    expect(getLastParsed()).toEqual({
      message: 'one two',
      severity: 'INFO',
    });
  });

  it('should add an object to the JSON payload', async () => {
    logger.info({
      foo: {
        bar: 'baz',
      },
    });
    expect(getLastParsed()).toEqual({
      foo: {
        bar: 'baz',
      },
      severity: 'INFO',
    });
  });

  it('should be able to mix a string and an object', async () => {
    logger.info('an object', {
      foo: {
        bar: 'baz',
      },
    });
    expect(getLastParsed()).toEqual({
      message: 'an object {"foo": {...}}',
      foo: {
        bar: 'baz',
      },
      severity: 'INFO',
    });
  });

  it('should log array of strings as message', async () => {
    logger.info(['foo', 'bar']);
    expect(getLastParsed()).toEqual({
      severity: 'INFO',
      0: 'foo',
      1: 'bar',
    });
  });

  it('should log complex array as payload', async () => {
    logger.info([{ foo: 'bar' }, { foo: 'bar' }]);
    expect(getLastParsed()).toEqual({
      0: { foo: 'bar' },
      1: { foo: 'bar' },
      severity: 'INFO',
    });
  });

  it('should log multiple complex args', async () => {
    logger.info('a user', { name: 'Joe' }, 'and a shop', { name: 'Wendys' });
    expect(getLastParsed()).toEqual({
      message: 'a user {"name": "Joe"} and a shop {"name": "Wendys"}',
      args: [{ name: 'Joe' }, { name: 'Wendys' }],
      severity: 'INFO',
    });
  });

  it('should not collide with other payload fields', async () => {
    logger.info({
      foo: 'bar',
      message: 'foo',
      severity: 'foo',
      httpRequest: 'foo',
      timestamp: 'foo',
      time: 'foo',
      log: 'foo',
    });

    expect(getLastParsed()).toEqual({
      foo: 'bar',
      severity: 'INFO',
    });
  });

  it('should truncate nested arrays in message', async () => {
    logger.info('an array', ['foo', ['bar', ['baz']]]);
    expect(getLastParsed()).toEqual({
      message: 'an array ["foo", [...]]',
      0: 'foo',
      1: ['bar', ['baz']],
      severity: 'INFO',
    });
  });
});

describe('printf style logging', () => {
  it('should substitute a string', async () => {
    logger.info('%s -> %s', 'foo', 'bar');
    expect(getLastParsed()).toEqual({
      message: 'foo -> bar',
      severity: 'INFO',
    });
  });

  it('should substitute a digit', async () => {
    logger.info('%s -> %d', 'foo', 1000);
    expect(getLastParsed()).toEqual({
      message: 'foo -> 1000',
      severity: 'INFO',
    });
  });

  it('should substitute an integer', async () => {
    logger.info('%s -> %i', 'foo', 1000);
    expect(getLastParsed()).toEqual({
      message: 'foo -> 1000',
      severity: 'INFO',
    });
  });
});
