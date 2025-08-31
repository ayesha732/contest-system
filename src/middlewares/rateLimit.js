'use strict';

const ratelimit = require('koa-ratelimit');
const db = new Map();

module.exports = (config, { strapi }) => {
  const limiter = ratelimit({
    driver: 'memory',
    db: db,
    duration: 60000,
    errorMessage: 'Too many requests, please try again later.',
    id: (ctx) => ctx.ip,
    max: 10,
    disableHeader: false,
  });

  return async (ctx, next) => {
    const path = ctx.path;
    if (
      path.startsWith('/admin') ||
      path.startsWith('/content-manager') ||
      path.startsWith('/users-permissions') ||
      path.startsWith('/upload') ||
      path.startsWith('/i18n') ||
      path.startsWith('/_health')
    ) {
      return next();
    }
    return limiter(ctx, next);
  };
};
