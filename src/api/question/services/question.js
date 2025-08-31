'use strict';

/**
 * question service
 */

'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::question.question', ({ strapi }) => ({
  async createQuestion(data, user) {
    // Check contestId
    if (!data.contest) {
      throw new Error("contestId is required");
    }

    const contest = await strapi.db.query("api::contest.contest").findOne({
      where: { id: data.contest },
    });

    if (!contest) {
      throw new Error("Contest not exist");
    }

    // Create question after validation
    const question = await strapi.entityService.create("api::question.question", {
      data: {
        ...data,
        contest: data.contest,
      },
    });

    return question;
  },
}));

