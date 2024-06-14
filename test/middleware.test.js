import { mockConsole, unmockConsole, getMessages } from './mocks/console';
import { useFormatted, useGoogleCloud } from '../src/logger';
import middleware from '../src/middleware';

jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));

beforeEach(() => {
  mockConsole();
});

afterAll(() => {
  unmockConsole();
});

function createContext(obj) {
  let onFinish;
  return {
    ...obj,
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
      ...obj.request,
      headers: {
        ...obj.request?.headers,
      },
    },
    response: {
      ...obj.response,
      headers: {
        ...obj.response?.headers,
      },
    },
  };
}

describe('formatted middleware', () => {
  beforeAll(() => {
    useFormatted();
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
    expect(getMessages()).toEqual([
      ['info', '[2020-01-01T00:00:00]  INFO POST   200 /foo 100ms 2KB'],
    ]);
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
    expect(getMessages()).toEqual([]);
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
    expect(getMessages()).toEqual([]);
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
    expect(getMessages()).toEqual([]);
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
    expect(getMessages()).toEqual([]);
  });
});

describe('google cloud middleware', () => {
  beforeAll(() => {
    useGoogleCloud();
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
    const [level, message] = getMessages()[0];
    expect(level).toBe('log');
    expect(JSON.parse(message)).toEqual({
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

  it('should log body for errored POST request', () => {
    const ctx = createContext({
      url: '/foo',
      method: 'POST',
      status: 400,
      request: {
        body: {
          bar: 'baz',
        },
      },
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
    const [level, message] = getMessages()[0];
    expect(level).toBe('log');
    expect(JSON.parse(message)).toEqual({
      message: 'POST /foo 2KB - 100ms',
      severity: 'INFO',
      requestBody: {
        bar: 'baz',
      },
      httpRequest: {
        latency: '0.1s',
        requestMethod: 'POST',
        requestUrl: '/foo',
        responseSize: '2048',
        status: 400,
      },
    });
  });

  it('should log query for errored GET request', () => {
    const ctx = createContext({
      url: '/foo',
      method: 'GET',
      status: 400,
      request: {
        query: {
          bar: 'baz',
        },
      },
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
    const [level, message] = getMessages()[0];
    expect(level).toBe('log');
    expect(JSON.parse(message)).toEqual({
      message: 'GET /foo 2KB - 100ms',
      severity: 'INFO',
      requestQuery: {
        bar: 'baz',
      },
      httpRequest: {
        latency: '0.1s',
        requestMethod: 'GET',
        requestUrl: '/foo',
        responseSize: '2048',
        status: 400,
      },
    });
  });

  it('should not expose sensitive fields in logged body', () => {
    const ctx = createContext({
      url: '/foo',
      method: 'POST',
      status: 400,
      request: {
        body: {
          bar: 'baz',
          secret: 'BAD',
          token: 'BAD',
          password: 'BAD',
          mySecret: 'BAD',
          myToken: 'BAD',
          myPassword: 'BAD',
          user: {
            bar: 'baz',
            secret: 'BAD',
            token: 'BAD',
            password: 'BAD',
            mySecret: 'BAD',
            myToken: 'BAD',
            myPassword: 'BAD',
          },
        },
      },
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
    const [level, message] = getMessages()[0];
    expect(level).toBe('log');
    expect(JSON.parse(message)).toEqual({
      message: 'POST /foo 2KB - 100ms',
      severity: 'INFO',
      requestBody: {
        bar: 'baz',
        user: {
          bar: 'baz',
        },
      },
      httpRequest: {
        latency: '0.1s',
        requestMethod: 'POST',
        requestUrl: '/foo',
        responseSize: '2048',
        status: 400,
      },
    });
  });

  it('should allow customization of blacklisted fields', () => {
    const ctx = createContext({
      url: '/foo',
      method: 'POST',
      status: 400,
      request: {
        body: {
          bar: 'baz',
          test1: 'test1',
          test2: 'test2',
          sensitive: 'sensitive',
          user: {
            bar: 'baz',
            test1: 'test1',
            test2: 'test2',
            sensitive: 'sensitive',
          },
        },
      },
      response: {
        headers: {
          'content-length': '2048',
        },
      },
    });
    middleware({
      disallowedFields: ['sensitive', /test\d/],
    })(ctx, () => {
      jest.advanceTimersByTime(100);
    });
    ctx.res.end();
    const [level, message] = getMessages()[0];
    expect(level).toBe('log');
    expect(JSON.parse(message)).toEqual({
      message: 'POST /foo 2KB - 100ms',
      severity: 'INFO',
      requestBody: {
        bar: 'baz',
        user: {
          bar: 'baz',
        },
      },
      httpRequest: {
        latency: '0.1s',
        requestMethod: 'POST',
        requestUrl: '/foo',
        responseSize: '2048',
        status: 400,
      },
    });
  });

  it('should add a userId in labels for an authenticated user', () => {
    const ctx = createContext({
      url: '/foo',
      method: 'POST',
      status: 200,
      state: {
        authUser: {
          id: 'fake-id',
        },
      },
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
    const [level, message] = getMessages()[0];
    expect(level).toBe('log');
    expect(JSON.parse(message)).toEqual({
      message: 'POST /foo 2KB - 100ms',
      severity: 'INFO',
      userId: 'fake-id',
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
    expect(getMessages()).toEqual([]);
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
    expect(getMessages()).toEqual([]);
  });
});
