import { mockConsole, unmockConsole, getParsedMessages } from './mocks/console';
import GoogleCloudLogger from '../src/loggers/GoogleCloudLogger';

const logger = new GoogleCloudLogger();

beforeEach(() => {
  mockConsole();
});

afterAll(() => {
  unmockConsole();
});

describe('basic logging', () => {
  it('should log debug', async () => {
    logger.debug('msg');
    expect(getParsedMessages()).toEqual([
      [
        'log',
        {
          message: 'msg',
          severity: 'DEBUG',
        },
      ],
    ]);
  });

  it('should log info', async () => {
    logger.info('msg');
    expect(getParsedMessages()).toEqual([
      [
        'log',
        {
          message: 'msg',
          severity: 'INFO',
        },
      ],
    ]);
  });

  it('should log warn', async () => {
    logger.warn('msg');
    expect(getParsedMessages()).toEqual([
      [
        'log',
        {
          message: 'msg',
          severity: 'WARNING',
        },
      ],
    ]);
  });

  it('should log error', async () => {
    logger.error('msg');
    expect(getParsedMessages()).toEqual([
      [
        'log',
        {
          message: 'msg',
          severity: 'ERROR',
        },
      ],
    ]);
  });
});

describe('complex logging', () => {
  it('should concatenate multiple string arguments', async () => {
    logger.info('one', 'two');
    expect(getParsedMessages()).toEqual([
      [
        'log',
        {
          message: 'one two',
          severity: 'INFO',
        },
      ],
    ]);
  });

  it('should add an object to the JSON payload', async () => {
    logger.info({
      foo: {
        bar: 'baz',
      },
    });
    expect(getParsedMessages()).toEqual([
      [
        'log',
        {
          foo: {
            bar: 'baz',
          },
          severity: 'INFO',
        },
      ],
    ]);
  });

  it('should be able to mix a string and an object', async () => {
    logger.info('an object', {
      foo: {
        bar: 'baz',
      },
    });
    expect(getParsedMessages()).toEqual([
      [
        'log',
        {
          message: 'an object {"foo": {...}}',
          foo: {
            bar: 'baz',
          },
          severity: 'INFO',
        },
      ],
    ]);
  });

  it('should log array of strings as message', async () => {
    logger.info(['foo', 'bar']);
    expect(getParsedMessages()).toEqual([
      [
        'log',
        {
          severity: 'INFO',
          0: 'foo',
          1: 'bar',
        },
      ],
    ]);
  });

  it('should log complex array as payload', async () => {
    logger.info([{ foo: 'bar' }, { foo: 'bar' }]);
    expect(getParsedMessages()).toEqual([
      [
        'log',
        {
          0: { foo: 'bar' },
          1: { foo: 'bar' },
          severity: 'INFO',
        },
      ],
    ]);
  });

  it('should log multiple complex args', async () => {
    logger.info('a user', { name: 'Joe' }, 'and a shop', { name: 'Wendys' });
    expect(getParsedMessages()).toEqual([
      [
        'log',
        {
          message: 'a user {"name": "Joe"} and a shop {"name": "Wendys"}',
          args: [{ name: 'Joe' }, { name: 'Wendys' }],
          severity: 'INFO',
        },
      ],
    ]);
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

    expect(getParsedMessages()).toEqual([
      [
        'log',
        {
          message:
            'Reserved fields [message,severity,httpRequest,timestamp,time,log] stripped from message.',
          severity: 'WARNING',
        },
      ],
      [
        'log',
        {
          foo: 'bar',
          severity: 'INFO',
        },
      ],
    ]);
  });

  it('should truncate nested arrays in message', async () => {
    logger.info('an array', ['foo', ['bar', ['baz']]]);
    expect(getParsedMessages()).toEqual([
      [
        'log',
        {
          message: 'an array ["foo", [...]]',
          0: 'foo',
          1: ['bar', ['baz']],
          severity: 'INFO',
        },
      ],
    ]);
  });
});

describe('printf style logging', () => {
  it('should substitute a string', async () => {
    logger.info('%s -> %s', 'foo', 'bar');
    expect(getParsedMessages()).toEqual([
      [
        'log',
        {
          message: 'foo -> bar',
          severity: 'INFO',
        },
      ],
    ]);
  });

  it('should substitute a digit', async () => {
    logger.info('%s -> %d', 'foo', 1000);
    expect(getParsedMessages()).toEqual([
      [
        'log',
        {
          message: 'foo -> 1000',
          severity: 'INFO',
        },
      ],
    ]);
  });

  it('should substitute an integer', async () => {
    logger.info('%s -> %i', 'foo', 1000);
    expect(getParsedMessages()).toEqual([
      [
        'log',
        {
          message: 'foo -> 1000',
          severity: 'INFO',
        },
      ],
    ]);
  });
});
