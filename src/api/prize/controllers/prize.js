'use strict';

/**
 * A set of functions called "actions" for `prize`
 */


const { sanitizeEntity } = require('@strapi/utils');

  async function find(ctx) {
    const user = ctx.state.user;
    const { userId } = ctx.query;

    let where = {};
    if (user.role.type !== 'admin') {
      where.user = user.id;
    } else if (userId) {
      where.user = userId;
    }

    const prizes = await strapi.db.query("api::prize.prize").findMany({
      where,
      populate: ['user', 'contest'],
      orderBy: { awardedAt: 'desc' },
    });

    return ctx.send({ success: true, message: "Prizes fetched successfully", data: prizes });
  }

  async function create(ctx) {
    const user = ctx.state.user;
    const { rank, contestId, prizeDetails } = ctx.request.body;

    if (!user || user.role.type !== 'admin') {
      return ctx.forbidden("Only admins can award prizes");
    }

    if (!contestId || !prizeDetails) {
      return ctx.badRequest("userId, contestId, and prizeDetails are required");
    }

    const prize = await strapi.entityService.create("api::prize.prize", {
      data: {
        contest: { connect: { id: contestId } },
        prizeDetails,
        rank,
        awardedAt: new Date(),
        status: 'awarded',
      },
    });

    return ctx.send({ success: true, message: "Prize awarded successfully", data: prize });
  }

 async function update(ctx) {
  const user = ctx.state.user;
  const { id } = ctx.params;
  const { status, prizeDetails, awardedAt } = ctx.request.body;

  const prize = await strapi.db.query("api::prize.prize").findOne({ 
    where: { id }, 
    populate: { user: true } 
  });

  if (!prize) return ctx.notFound("Prize not found");

  if (user.role.type !== 'admin' && prize.user.id !== user.id) {
    return ctx.forbidden("You don't have permission to update this prize");
  }

  const updatedPrize = await strapi.entityService.update("api::prize.prize", id, {
    data: {
      status: status || prize.status,
      prizeDetails: prizeDetails || prize.prizeDetails,
      awardedAt: awardedAt || prize.awardedAt,
    },
  });

  return ctx.send({ success: true, message: "Prize updated successfully", data: updatedPrize });
}

module.exports = {
  find,
  create,
  update
}