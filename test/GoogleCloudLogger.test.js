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
          severity: 'INFO',
          metadata: {
            foo: {
              bar: 'baz',
            },
          },
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
          severity: 'INFO',
          message: 'an object {"foo": {...}}',
          metadata: {
            foo: {
              bar: 'baz',
            },
          },
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
          metadata: {
            arguments: [['foo', 'bar']],
          },
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
          severity: 'INFO',
          metadata: {
            arguments: [[{ foo: 'bar' }, { foo: 'bar' }]],
          },
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
          severity: 'INFO',
          message: 'a user {"name": "Joe"} and a shop {"name": "Wendys"}',
          metadata: {
            arguments: [
              {
                name: 'Joe',
              },
              {
                name: 'Wendys',
              },
            ],
          },
        },
      ],
    ]);
  });

  it('should allow payload fields as metadata', async () => {
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
          severity: 'INFO',
          metadata: {
            foo: 'bar',
            message: 'foo',
            severity: 'foo',
            httpRequest: 'foo',
            timestamp: 'foo',
            time: 'foo',
            log: 'foo',
          },
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
          severity: 'INFO',
          message: 'an array ["foo", [...]]',
          metadata: {
            arguments: [['foo', ['bar', ['baz']]]],
          },
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

describe('contexts', () => {
  it('should allow passing up metadata fields with a new context', async () => {
    logger.context({ foo: 'bar' }).info('msg');
    expect(getParsedMessages()).toEqual([
      [
        'log',
        {
          severity: 'INFO',
          message: 'msg',
          metadata: {
            foo: 'bar',
          },
        },
      ],
    ]);
  });

  it('should merge metadata from context passed', async () => {
    logger.context({ foo: 'foo' }).info('msg', { bar: 'bar' });
    expect(getParsedMessages()).toEqual([
      [
        'log',
        {
          severity: 'INFO',
          message: 'msg {"bar": "bar"}',
          metadata: {
            foo: 'foo',
            bar: 'bar',
          },
        },
      ],
    ]);
  });

  it('should handle context metadata with multiple arguments', async () => {
    logger.context({ foo: 'foo' }).info('msg', { bar: 'bar' }, { baz: 'baz' });
    expect(getParsedMessages()).toEqual([
      [
        'log',
        {
          severity: 'INFO',
          message: 'msg {"bar": "bar"} {"baz": "baz"}',
          metadata: {
            foo: 'foo',
            arguments: [
              {
                bar: 'bar',
              },
              {
                baz: 'baz',
              },
            ],
          },
        },
      ],
    ]);
  });
});
