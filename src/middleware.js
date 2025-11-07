import bytes from 'bytes';

import { formatRequest } from './logger';

const IGNORE_UA_REG = /^(GoogleHC|kube-probe)/;

/**
 * @param {Object} [options]
 * @param {boolean|Object[]} [options.recordParams] A flag or
 * configuration to allow request params to be recorded.
 * @param {RegExp[]|string[]} [options.ignoreUserAgents] An array of
 * strings or regexes to test against.
 */
export default function middleware(options) {
  options = normalizeOptions(options);
  return (ctx, next) => {
    if (isAllowedRequest(ctx, options)) {
      const start = new Date();
      ctx.res.once('finish', () => {
        formatRequest({
          ...getRequestInfo(ctx),
          ...getRequestParams(ctx, options),
          // @ts-ignore
          latency: new Date() - start,
        });
      });
    }
    return next();
  };
}

function normalizeOptions(options = {}) {
  let { recordParams } = options;
  if (recordParams === true) {
    recordParams = [
      {
        path: /.+/,
      },
    ];
  } else if (recordParams) {
    recordParams = recordParams.map((config) => {
      return {
        ...config,
        include: normalizeParamList(config.include),
      };
    });
  }
  return {
    ...options,
    recordParams,
  };
}

function normalizeParamList(arr) {
  if (!arr) {
    return;
  }
  // Include bases for deep arguments. For example
  // if the include param is "user.foo" this should
  // include both "user" and "user.foo". Note that
  // excludes don't need this as if "user.foo" is
  // excluded then "user" will already be included.
  return arr.flatMap((arg) => {
    if (typeof arg === 'string') {
      const parts = arg.split('.');
      return parts.map((part, i) => {
        return parts.slice(0, i + 1).join('.');
      });
    }
    return arg;
  });
}

function isAllowedRequest(ctx, options = {}) {
  const { ignoreUserAgents = [IGNORE_UA_REG] } = options;
  const ua = ctx.request.headers['user-agent'] || '';
  return ignoreUserAgents.some((test) => {
    return !ua.match(test);
  });
}

function getRequestInfo(ctx) {
  const { headers } = ctx.request;
  const level = ctx.status < 500 ? 'info' : 'error';
  const requestLength = ctx.request.headers['content-length'];
  const responseLength = ctx.response.headers['content-length'];
  const size = bytes(Number(responseLength || 0));
  const userId = ctx.state?.authUser?.id;

  const referer = headers['referer'];
  const userAgent = headers['user-agent'];
  const protocol = headers['x-forwarded-proto'] || ctx.protocol;
  const remoteIp = headers['x-forwarded-for'];
  const serverIp = ctx.ip;

  const path = ctx.url || '';
  let fileExt = path.split('.').pop();
  if (fileExt.length > 5) {
    fileExt = '';
  }

  return {
    level,
    userId,
    url: ctx.href,
    path: ctx.url,
    fileExt,
    method: ctx.method,
    status: ctx.status,
    requestLength,
    responseLength,
    referer,
    remoteIp,
    serverIp,
    protocol,
    userAgent,
    headers,
    size,
  };
}

const BLACKLIST = /token|password|secret|hash|jwt/i;

function getRequestParams(ctx, options) {
  const config = getRecordConfig(ctx, options);
  if (config) {
    const { body, query } = ctx.request;
    return {
      requestBody: strip(body, config),
      requestQuery: strip(query, config),
    };
  }
}

function getRecordConfig(ctx, options) {
  const { recordParams = [] } = options;
  return recordParams.find((config) => {
    const { status = 400, method, path } = config;
    if (ctx.status < status) {
      return false;
    } else if (method && method !== ctx.method) {
      return false;
    }
    return getRegExp(path).test(ctx.url);
  });
}

function strip(arg, config, path = []) {
  if (!arg || typeof arg !== 'object') {
    return arg;
  }

  const result = {};
  for (let [key, value] of Object.entries(arg)) {
    const p = [...path, key];
    const fullKey = p.join('.');
    if (canRecordParam(fullKey, config)) {
      result[key] = strip(value, config, p);
    }
  }
  return result;
}

function canRecordParam(key, config) {
  let { include, exclude = [] } = config;
  exclude = [BLACKLIST, ...exclude];

  if (hasParam(key, include)) {
    // Param is explicitly included.
    return true;
  } else {
    // Param is not explicitly excluded
    // and no includes exist.
    return !include && !hasParam(key, exclude);
  }
}

function hasParam(key, arr) {
  if (!arr) {
    return false;
  }
  return arr.some((arg) => {
    return getRegExp(arg).test(key);
  });
}

function getRegExp(arg) {
  if (arg instanceof RegExp) {
    return arg;
  } else {
    return RegExp(`^${arg}$`, 'i');
  }
}
