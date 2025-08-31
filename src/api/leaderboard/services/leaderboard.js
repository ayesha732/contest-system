'use strict';

/**
 * leaderboard service
 */


module.exports = {
  async getLeaderboardByContest(contestId) {
    return await strapi.db.query("api::leaderboard.leaderboard").findMany({
      where: { contest: contestId },
      populate: { user: true },
      orderBy: { score: 'desc' },
    });
  }
};
