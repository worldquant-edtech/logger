import { mockConsole, unmockConsole, getMessages } from './mocks/console';

import FormattedLogger from '../src/loggers/FormattedLogger';

const logger = new FormattedLogger();

jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));

beforeEach(() => {
  mockConsole();
});

afterAll(() => {
  unmockConsole();
});

describe('FormattedLogger', () => {
  it('should not log debug by default', async () => {
    logger.debug('msg');
    expect(getMessages()).toEqual([]);
  });

  it('should log info', async () => {
    logger.info('msg');
    expect(getMessages()).toEqual([
      ['info', '[2020-01-01T00:00:00]  INFO msg'],
    ]);
  });

  it('should log warn', async () => {
    logger.warn('msg');
    expect(getMessages()).toEqual([
      ['warn', '[2020-01-01T00:00:00]  WARN msg'],
    ]);
  });

  it('should log debug when level set', async () => {
    process.env.LOG_LEVEL = 'debug';
    logger.debug('msg');
    expect(getMessages()).toEqual([
      ['debug', '[2020-01-01T00:00:00] DEBUG msg'],
    ]);
    process.env.LOG_LEVEL = 'info';
  });

  it('should only log error messages when level set', async () => {
    process.env.LOG_LEVEL = 'error';
    logger.debug('msg');
    logger.info('msg');
    logger.warn('msg');
    expect(getMessages()).toEqual([]);
    logger.error('msg');
    expect(getMessages()).toEqual([
      ['error', '[2020-01-01T00:00:00] ERROR msg'],
    ]);
    process.env.LOG_LEVEL = 'info';
  });
});
