import { getLast, getLastArgs, reset } from 'console';

import ConsoleLogger from '../src/loggers/ConsoleLogger';

const logger = new ConsoleLogger();

jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));

afterEach(() => {
  reset();
});

describe('basic logging', () => {
  it('info', async () => {
    logger.info('msg');
    expect(getLast()).toBe('[2020-01-01T00:00:00]  INFO msg');
  });

  it('warn', async () => {
    logger.warn('msg');
    expect(getLast()).toBe('[2020-01-01T00:00:00]  WARN msg');
  });

  it('error', async () => {
    logger.error('msg');
    expect(getLast()).toBe('[2020-01-01T00:00:00] ERROR msg');
  });

  it('should be able to use interpolation', async () => {
    logger.info('%s -> %s', 'foo', 'bar');
    expect(getLastArgs()).toEqual([
      '[2020-01-01T00:00:00]  INFO %s -> %s',
      'foo',
      'bar',
    ]);
  });
});

describe('min level', () => {
  it('should not log debug by default', async () => {
    logger.debug('msg');
    expect(getLast()).toBeUndefined();
  });

  it('should log debug when min level set', async () => {
    process.env.LOG_LEVEL = 'debug';
    logger.debug('msg');
    expect(getLast()).toBe('[2020-01-01T00:00:00] DEBUG msg');
    process.env.LOG_LEVEL = 'info';
  });

  it('should only log error messages', async () => {
    process.env.LOG_LEVEL = 'error';
    logger.debug('msg');
    logger.info('msg');
    logger.warn('msg');
    expect(getLast()).toBeUndefined();
    logger.error('msg');
    expect(getLast()).toBe('[2020-01-01T00:00:00] ERROR msg');
    process.env.LOG_LEVEL = 'info';
  });
});
