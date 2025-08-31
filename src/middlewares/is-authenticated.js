'use strict';

const jwt = require('jsonwebtoken');

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    console.log("is-authenticated middleware running");

    const authHeader = ctx.request.header.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ctx.unauthorized("Unauthorized: You must be logged in");
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, strapi.config.get('plugin.users-permissions.jwtSecret'));
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: decoded.id },
        populate: ['role'],
      });

      if (!user) {
        return ctx.unauthorized("User not found");
      }

      ctx.state.user = user; 
      console.log("Enhanced user data:", ctx.state.user);
    } catch (error) {
      strapi.log.error('Error verifying JWT:', error);
      return ctx.unauthorized("Invalid or expired token");
    }

    await next();
  };
};
