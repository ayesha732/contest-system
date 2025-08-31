'use strict';

/**
 * A set of functions called "actions" for `user-contest-participation`
 */

const { createCoreController } = require('@strapi/strapi').factories;

async function join(ctx) {
  try {
    const user = ctx.state.user;
    const { contestId } = ctx.params;

    if (!contestId) {
      return ctx.badRequest('Contest ID is required');
    }

    if (user.role && user.role.type === 'public') {
      return ctx.forbidden("Guests are not allowed to join contests.");
    }

    const contest = await strapi.db.query('api::contest.contest').findOne({
      where: { id: contestId },
      select: ['id', 'name', 'startDate', 'endDate'],
    });

    if (!contest) {
      return ctx.notFound("Contest not found");
    }

    const now = new Date();

    if (now < new Date(contest.startDate)) {
      return ctx.forbidden("Contest has not started yet.");
    }

    if (now > new Date(contest.endDate)) {
      return ctx.forbidden("Contest has already ended.");
    }

    const participation = await strapi
      .service('api::user-contest-participation.user-contest-participation')
      .joinContest(contestId, user);

    return ctx.created({
      success: true,
      message: 'Successfully joined the contest',
      data: {
        id: participation.id,
        participationStatus: participation.participationStatus,
        startTime: participation.startTime,
        contest: {
          id: contest.id,
          name: contest.name,
        },
      },
    });
  } catch (error) {
    strapi.log.error('Join contest error:', error);
    return ctx.badRequest(error.message || 'Failed to join contest');
  }
}

async function findMyParticipations(ctx) {
  try {
    const user = ctx.state.user;
    const { status } = ctx.query;

    const where = { user: user.id };
    if (status) {
      where.participationStatus = status;
    }

    const participations = await strapi.entityService.findMany(
      'api::user-contest-participation.user-contest-participation',
      {
        where,
        populate: { contest: true },
      }
    );

    return ctx.send({
      success: true,
      data: participations,
    });
  } catch (error) {
    strapi.log.error('Error fetching participations:', error);
    return ctx.badRequest('Failed to fetch participations');
  }
}

module.exports = {
  join,
  findMyParticipations,
};
