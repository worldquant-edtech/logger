const logger = require('../logger');
const middleware = require('../middleware');
const { getLast, getLastParsed, reset } = require('console');

jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));

jest.mock('kleur');
jest.mock('console');

afterEach(() => {
  reset();
});

function createContext(obj) {
  let onFinish;
  return {
    res: {
      once(event, fn) {
        if (event === 'finish') {
          onFinish = fn;
        }
      },
      end() {
        onFinish?.();
      },
    },
    request: {
      headers: {},
    },
    response: {
      headers: {},
    },
    ...obj,
  };
}

describe('console middleware', () => {
  beforeAll(() => {
    logger.useConsole();
  });

  it('should log a request', () => {
    const ctx = createContext({
      url: '/foo',
      method: 'POST',
      status: 200,
      response: {
        headers: {
          'content-length': '2048',
        },
      },
    });
    middleware()(ctx, () => {
      jest.advanceTimersByTime(100);
    });
    ctx.res.end();
    expect(getLast()).toBe('[2020-01-01T00:00:00]  INFO POST   200 /foo 100ms 2KB');
  });

  it('should ignore GCE health checks', () => {
    const ctx = createContext({
      url: '/foo',
      method: 'POST',
      status: 200,
      request: {
        headers: {
          'user-agent': 'GoogleHC/1.0',
        },
      },
    });
    middleware()(ctx, () => {});
    ctx.res.end();
    expect(getLast()).toBeUndefined();
  });

  it('should ignore kubernetes health checks', () => {
    const ctx = createContext({
      url: '/foo',
      method: 'POST',
      status: 200,
      request: {
        headers: {
          'user-agent': 'kube-probe/1.26',
        },
      },
    });
    middleware()(ctx, () => {});
    ctx.res.end();
    expect(getLast()).toBeUndefined();
  });

  it('should ignoring custom headers by string', () => {
    const options = {
      ignoreUserAgents: ['Foobar'],
    };
    const ctx = createContext({
      url: '/foo',
      method: 'POST',
      status: 200,
      request: {
        headers: {
          'user-agent': 'Foobar',
        },
      },
    });
    middleware(options)(ctx, () => {});
    ctx.res.end();
    expect(getLast()).toBeUndefined();
  });

  it('should ignoring custom headers by regex', () => {
    const options = {
      ignoreUserAgents: [/^foo/i],
    };
    const ctx = createContext({
      url: '/foo',
      method: 'POST',
      status: 200,
      request: {
        headers: {
          'user-agent': 'Foobar',
        },
      },
    });
    middleware(options)(ctx, () => {});
    ctx.res.end();
    expect(getLast()).toBeUndefined();
  });
});

describe('google cloud middleware', () => {
  beforeAll(() => {
    logger.useGoogleCloud();
  });

  it('should log a request', () => {
    const ctx = createContext({
      url: '/foo',
      method: 'POST',
      status: 200,
      response: {
        headers: {
          'content-length': '2048',
        },
      },
    });
    middleware()(ctx, () => {
      jest.advanceTimersByTime(100);
    });
    ctx.res.end();
    expect(getLastParsed()).toEqual({
      message: 'POST /foo 2KB - 100ms',
      severity: 'INFO',
      httpRequest: {
        latency: '0.1s',
        requestMethod: 'POST',
        requestUrl: '/foo',
        responseSize: '2048',
        status: 200,
      },
    });
  });

  it('should ignore GCE health checks', () => {
    const ctx = createContext({
      url: '/foo',
      method: 'POST',
      status: 200,
      request: {
        headers: {
          'user-agent': 'GoogleHC/1.0',
        },
      },
    });
    middleware()(ctx, () => {});
    ctx.res.end();
    expect(getLast()).toBeUndefined();
  });

  it('should ignore kubernetes health checks', () => {
    const ctx = createContext({
      url: '/foo',
      method: 'POST',
      status: 200,
      request: {
        headers: {
          'user-agent': 'kube-probe/1.26',
        },
      },
    });
    middleware()(ctx, () => {});
    ctx.res.end();
    expect(getLast()).toBeUndefined();
  });
});
