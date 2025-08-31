// src/api/contest/controllers/contest.js
'use strict';

async function create(ctx) {
  try {
    console.log("Creating contest with user:", ctx.state.user);

    const user = ctx.state.user;
    if (!user || !user.role || user.role.name !== 'Admin') {
      return ctx.forbidden("Only Admins are allowed to create contests");
    }

    const { data } = ctx.request.body;
    if (!data) {
      return ctx.badRequest('Missing contest data');
    }

    const contest = await strapi.service('api::contest.contest').create({
      data: {
        ...data,
      },
      populateCreatorFields: false, 
    });

    return ctx.created({
      success: true,
      message: 'Contest created successfully',
      data: contest,
    });
  } catch (error) {
    strapi.log.error('Error creating contest:', error);
    return ctx.internalServerError('Something went wrong while creating the contest');
  }
}


async function update(ctx) {
  try {

    const { id } = ctx.params;
    const { data } = ctx.request.body;

    const contest = await strapi.entityService.update('api::contest.contest', id, {
      data: {
        ...data,
      },
    });

    return ctx.send({
      data: contest,
      message: 'Contest updated successfully'
    });
  } catch (error) {
    strapi.log.error('Error updating contest:', error);
    return ctx.internalServerError('Something went wrong while updating the contest');
  }
}


async function deleteContest(ctx) {
  try {
    const { id } = ctx.params;

    const contest = await strapi.db.query('api::contest.contest').findOne({
      where: { id, isDeleted: false },
    });

    if (!contest) {
      return ctx.notFound('Contest not found or already deleted');
    }

    await strapi.db.query('api::contest.contest').update({
      where: { id },
      data: { isDeleted: true },
    });

    return ctx.send({
      success: true,
      message: 'Contest deleted successfully',
    });
  } catch (error) {
    strapi.log.error('Error deleting contest:', error);
    return ctx.internalServerError('Something went wrong while deleting the contest');
  }
}

async function findActive(ctx) {
  try {
    const user = ctx.state.user;
    const now = new Date().toISOString();
    
    let whereClause = {
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: []
    };

    whereClause.$or.push({ accessLevel: 'authenticated' });

    if (user) {
      if (user.role && user.role.name === 'VIP') {
        whereClause.$or.push({ accessLevel: 'VIP' });
      }
      
      if (user.role && user.role.name === 'Admin') {
        whereClause = {
          startDate: { $lte: now },
          endDate: { $gte: now }
        };
      }
    }

    const contests = await strapi.db.query('api::contest.contest').findMany({
      where: whereClause,
      populate: ['questions']
    });

    return ctx.send({
      success: true,
      message: 'Active contests fetched successfully',
      data: contests,
    });
  } catch (error) {
    strapi.log.error('Error fetching active contests:', error);
    return ctx.internalServerError('Something went wrong while fetching active contests');
  }
}
async function find(ctx) {
  try {
    const { id } = ctx.params;
    const user = ctx.state.user;
    
    if (id) {
      const contest = await strapi.db.query('api::contest.contest').findOne({
        where: { id, isDeleted: false },
        populate: ['questions']
      });

      if (!contest) {
        return ctx.notFound('Contest not found');
      }

      if (contest.accessLevel === 'vip') {
        if (!user || !user.role || user.role.name !== 'VIP') {
          return ctx.forbidden('VIP contests are only accessible to VIP users');
        }
      }

      const now = new Date();
      if (contest.startDate > now || contest.endDate < now) {
        return ctx.badRequest('Contest is not currently active');
      }

      return ctx.send({
        success: true,
        message: 'Contest fetched successfully',
        data: contest,
      });
    }
    else {
      const now = new Date().toISOString();
      
      let whereClause = {
        isDeleted: false, 
        $or: [{ accessLevel: 'authenticated' }]
      };

      if (user && user.role && user.role.name === 'VIP') {
        whereClause.$or.push({ accessLevel: 'vip' });
      }
      
      if (user && user.role && user.role.name === 'Admin') {
      whereClause = { isDeleted: false }; 

      }

      const contests = await strapi.db.query('api::contest.contest').findMany({
        where: whereClause,
        populate: ['questions']
      });

      return ctx.send({
        success: true,
        message: 'Contests fetched successfully',
        data: contests,
      });
    }
  } catch (error) {
    strapi.log.error('Error fetching contest(s):', error);
    return ctx.internalServerError('Something went wrong while fetching contest(s)');
  }
}

module.exports = {
  create,
  update,
  find,
  delete: deleteContest,
  findActive
};