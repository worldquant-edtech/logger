import bytes from 'bytes';

import { formatRequest } from './logger';

const IGNORE_UA_REG = /^(GoogleHC|kube-probe)/;

export default function middleware(options) {
  return (ctx, next) => {
    if (isAllowedRequest(ctx, options)) {
      const start = new Date();
      ctx.res.once('finish', () => {
        formatRequest({
          ...getRequestInfo(ctx),
          latency: new Date() - start,
        });
      });
    }
    return next();
  };
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

  const referer = headers['referer'];
  const userAgent = headers['user-agent'];
  const protocol = headers['x-forwarded-proto'] || ctx.protocol;
  const remoteIp = headers['x-forwarded-for'];
  const serverIp = ctx.ip;

  return {
    level,
    url: ctx.href,
    path: ctx.url,
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
