'use strict';

/**
 * contest service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::contest.contest', ({ strapi }) => ({
  async findActiveContests() {
    const now = new Date().toISOString();
    return await strapi.db.query('api::contest.contest').findMany({
      where: {
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
    });
  },
}));
