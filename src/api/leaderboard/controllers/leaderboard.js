'use strict';

/**
 * A set of functions called "actions" for `leaderboard`
 */



const { sanitizeEntity } = require('@strapi/utils');

async function getLeaderboard(ctx) {
  try {
    const { contestId } = ctx.params;
    const user = ctx.state.user;

    if (!user) return ctx.unauthorized();

    const contest = await strapi.entityService.findOne('api::contest.contest', contestId);

    if (!contest) return ctx.notFound("Contest not found");
    if (contest.accessLevel === 'vip' && !['admin', 'vip'].includes(user.role.type)) {
      return ctx.forbidden("You don't have access to this contest leaderboard");
    }
    if (contest.accessLevel === 'authenticated' && !['admin', 'vip', 'authenticated'].includes(user.role.type)) {
      return ctx.forbidden("You don't have access to this contest leaderboard");
    }

    const leaderboardEntries = await strapi.db.query("api::leaderboard.leaderboard").findMany({
      where: { contest: { id: contestId } }, 
      populate: { user: true },
      orderBy: { score: 'desc' },
    });

    const rankedEntries = leaderboardEntries.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    const contestPrizes = await strapi.db.query("api::prize.prize").findMany({
      where: { contest: contestId },
      orderBy: { rank: 'asc' } 
    });

    for (let entry of rankedEntries) {
      const prizeForRank = contestPrizes.find(p => p.rank === entry.rank);

      if (prizeForRank) {
        const existingPrize = await strapi.db.query("api::prize.prize").findOne({
          where: { contest: contestId, user: entry.user.id }
        });

        if (!existingPrize) {
          await strapi.entityService.create("api::prize.prize", {
            data: {
              user: entry.user.id,
              contest: contestId,
              prizeDetails: prizeForRank.prizeDetails,
              rank: entry.rank,
              awardedAt: new Date(),
              status: "awarded"
            }
          });
        }
      }
    }

    const leaderboardWithPrizes = rankedEntries.map(entry => {
      const prize = contestPrizes.find(p => p.rank === entry.rank);
      return {
        ...entry,
        prizeAwarded: !!prize,
        prizeDetails: prize?.prizeDetails || null
      };
    });

    return ctx.send({
      success: true,
      message: "Leaderboard fetched successfully",
      data: leaderboardWithPrizes
    });

  } catch (err) {
    strapi.log.error("Error fetching leaderboard:", err);
    return ctx.badRequest(err.message || "Something went wrong while fetching leaderboard");
  }
}


async function updateScore(ctx) {
    try {
      const { contestId } = ctx.params;
      const { userId, score } = ctx.request.body;

      if (!contestId || !userId || score === undefined) {
        return ctx.badRequest("contestId, userId, and score are required");
      }
    if (user.role.type !== "admin") {
      return ctx.forbidden("You do not have permission to update scores");
    }


      let entry = await strapi.db.query("api::leaderboard.leaderboard").findOne({
        where: { contest: contestId, user: userId }
      });

      if (entry) {
        entry = await strapi.entityService.update("api::leaderboard.leaderboard", entry.id, {
          data: { score }
        });
      } else {
        entry = await strapi.entityService.create("api::leaderboard.leaderboard", {
          data: {
            contest: contestId,
            user: userId,
            score,
          }
        });
      }

      return ctx.send({ success: true, message: "Score updated", data: entry });

    } catch (err) {
      strapi.log.error("Error updating leaderboard:", err);
      return ctx.badRequest(err.message);
    }
}

async function awardPrize(ctx) {
    try {
      const { contestId, userId } = ctx.params;
      const { prizeDetails } = ctx.request.body;

      if (!contestId || !userId || !prizeDetails) {
        return ctx.badRequest("contestId, userId, and prizeDetails are required");
      }

      const entry = await strapi.db.query("api::leaderboard.leaderboard").findOne({
        where: { contest: contestId, user: userId }
      });

      if (!entry) return ctx.notFound("Leaderboard entry not found");

      const updated = await strapi.entityService.update("api::leaderboard.leaderboard", entry.id, {
        data: { prizeAwarded: true, prizeDetails }
      });

      return ctx.send({ success: true, message: "Prize awarded", data: updated });
    } catch (err) {
      strapi.log.error("Error awarding prize:", err);
      return ctx.badRequest(err.message);
    }
}
module.exports = {
  getLeaderboard,
  updateScore,
  awardPrize
}
