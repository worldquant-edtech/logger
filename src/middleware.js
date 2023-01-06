const bytes = require('bytes');
const logger = require('./logger');

const IGNORE_UA_REG = /^(GoogleHC|kube-probe)/;

function middleware(ctx, next) {
  if (isAllowedRequest(ctx)) {
    const start = new Date();
    ctx.res.once('finish', () => {
      logger.formatRequest({
        ...getRequestInfo(ctx),
        latency: new Date() - start,
      });
    });
  }
  return next();
}

function isAllowedRequest(ctx) {
  return !IGNORE_UA_REG.test(ctx.request.headers['user-agent'] || '');
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

module.exports = middleware;
