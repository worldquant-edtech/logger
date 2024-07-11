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

function runRequest(ctx, config) {
  middleware(config)(ctx, () => {
    jest.advanceTimersByTime(100);
  });
  ctx.res.end();
}

function assertBodyRecorded(expected) {
  const [level, message] = getMessages()[0];
  expect(level).toBe('log');
  const parsed = JSON.parse(message);
  if (expected) {
    expect(parsed).toMatchObject({
      requestBody: expected,
    });
  } else {
    expect(parsed).not.toHaveProperty('requestBody');
  }
}

function assertQueryRecorded(expected) {
  const [level, message] = getMessages()[0];
  expect(level).toBe('log');
  const parsed = JSON.parse(message);
  if (expected) {
    expect(parsed).toMatchObject({
      requestQuery: expected,
    });
  } else {
    expect(parsed).not.toHaveProperty('requestQuery');
  }
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

  describe('request body recording', () => {
    it('should not record anything by default', () => {
      const ctx = createContext({
        status: 400,
        request: {
          body: {
            bar: 'baz',
          },
        },
      });
      runRequest(ctx);
      assertBodyRecorded(null);
    });

    it('should record all params', () => {
      const ctx = createContext({
        status: 400,
        request: {
          body: {
            bar: 'baz',
          },
        },
      });
      runRequest(ctx, {
        recordParams: true,
      });
      assertBodyRecorded({
        bar: 'baz',
      });
    });

    it('should match route by string', () => {
      const ctx = createContext({
        url: '/foo',
        status: 400,
        request: {
          body: {
            bar: 'baz',
          },
        },
      });
      runRequest(ctx, {
        recordParams: [
          {
            path: '/foo',
          },
        ],
      });
      assertBodyRecorded({
        bar: 'baz',
      });
    });

    it('should match route by regex', () => {
      const ctx = createContext({
        url: '/foo',
        status: 400,
        request: {
          body: {
            bar: 'baz',
          },
        },
      });
      runRequest(ctx, {
        recordParams: [
          {
            path: /\/foo/,
          },
        ],
      });
      assertBodyRecorded({
        bar: 'baz',
      });
    });

    it('should not log below 400 status by default', () => {
      const ctx = createContext({
        url: '/foo',
        status: 200,
        request: {
          body: {
            bar: 'baz',
          },
        },
      });
      runRequest(ctx, {
        recordParams: [
          {
            path: /\/foo/,
          },
        ],
      });
      assertBodyRecorded(null);
    });

    it('should match status below 400', () => {
      const ctx = createContext({
        url: '/foo',
        status: 200,
        request: {
          body: {
            bar: 'baz',
          },
        },
      });
      runRequest(ctx, {
        recordParams: [
          {
            status: 200,
            path: /\/foo/,
          },
        ],
      });
      assertBodyRecorded({
        bar: 'baz',
      });
    });

    it('should match only PATCH requests', () => {
      const ctx = createContext({
        url: '/foo',
        method: 'POST',
        status: 400,
        request: {
          body: {
            bar: 'baz',
          },
        },
      });
      runRequest(ctx, {
        recordParams: [
          {
            method: 'PATCH',
            path: '/foo',
          },
        ],
      });
      assertBodyRecorded(null);
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
      });
      runRequest(ctx, {
        recordParams: true,
      });
      assertQueryRecorded({
        bar: 'baz',
      });
    });

    it('should not expose sensitive fields in body', () => {
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
      });
      runRequest(ctx, {
        recordParams: true,
      });
      assertBodyRecorded({
        bar: 'baz',
        user: {
          bar: 'baz',
        },
      });
    });

    it('should allow customization of included fields', () => {
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

      runRequest(ctx, {
        recordParams: [
          {
            path: '/foo',
            include: ['bar', 'user.bar'],
          },
        ],
      });
      assertBodyRecorded({
        bar: 'baz',
        user: {
          bar: 'baz',
        },
      });
    });

    it('should allow exclusion of fields', () => {
      const ctx = createContext({
        url: '/foo',
        method: 'POST',
        status: 400,
        request: {
          body: {
            bar: 'baz',
            test1: 'test1',
            test2: 'test2',
            user: {
              bar: 'baz',
              test1: 'test1',
              test2: 'test2',
            },
          },
        },
        response: {
          headers: {
            'content-length': '2048',
          },
        },
      });

      runRequest(ctx, {
        recordParams: [
          {
            path: '/foo',
            exclude: ['bar', 'user.bar'],
          },
        ],
      });
      assertBodyRecorded({
        test1: 'test1',
        test2: 'test2',
      });
    });

    it('should not include field when excludes are set', () => {
      const ctx = createContext({
        url: '/foo',
        method: 'POST',
        status: 400,
        request: {
          body: {
            bar: 'baz',
            test1: 'test1',
            test2: 'test2',
            user: {
              bar: 'baz',
              test1: 'test1',
              test2: 'test2',
            },
          },
        },
        response: {
          headers: {
            'content-length': '2048',
          },
        },
      });

      runRequest(ctx, {
        recordParams: [
          {
            path: '/foo',
            include: ['bar'],
            exclude: ['test1'],
          },
        ],
      });
      assertBodyRecorded({
        bar: 'baz',
      });
    });

    it('should exclude nested', () => {
      const ctx = createContext({
        url: '/foo',
        method: 'POST',
        status: 400,
        request: {
          body: {
            bar: 'baz',
            test1: 'test1',
            test2: 'test2',
            user: {
              bar: 'baz',
              test1: 'test1',
              test2: 'test2',
            },
          },
        },
        response: {
          headers: {
            'content-length': '2048',
          },
        },
      });

      runRequest(ctx, {
        recordParams: [
          {
            path: '/foo',
            exclude: ['user.bar'],
          },
        ],
      });
      assertBodyRecorded({
        bar: 'baz',
        test1: 'test1',
        test2: 'test2',
        user: {
          test1: 'test1',
          test2: 'test2',
        },
      });
    });
  });
});
