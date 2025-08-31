'use strict';

/**
 * user-contest-participation service
 */


const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::user-contest-participation.user-contest-participation', ({ strapi }) => ({
  async joinContest(contestId, user) {
    try {
      const contest = await strapi.entityService.findOne('api::contest.contest', contestId, {
        populate: ['participations']
      });

      if (!contest) {
        throw new Error('Contest not found');
      }

      const now = new Date();
      const startDate = new Date(contest.startDate);
      const endDate = new Date(contest.endDate);

      if (now < startDate) {
        throw new Error('Contest has not started yet');
      }

      if (now > endDate) {
        throw new Error('Contest has already ended');
      }

      if (contest.status !== 'ongoing') {
        throw new Error('Contest is not currently active');
      }

    if (user.role.type === 'public') {
    throw new Error('Guests cannot participate in contests. Please sign up or log in.');
    }

    if (user.role.type === 'admin') {
    throw new Error('Admins cannot participate in contests');
    }

    if (contest.accessLevel === 'VIP' && user.role.type !== 'vip') {
    throw new Error('VIP access required for this contest');
    }

    if (contest.accessLevel === 'authenticated' && !['vip', 'authenticated'].includes(user.role.type)) {
    throw new Error('You must be logged in to join this contest');
    }

    if (contest.accessLevel === 'Admin' && user.role.type !== 'admin') {
    throw new Error('Only admins can access this contest');
    }


      const existingParticipation = await strapi.db.query('api::user-contest-participation.user-contest-participation').findOne({
        where: {
          user: user.id,
          contest: contestId
        }
      });

      if (existingParticipation) {
        throw new Error('You have already joined this contest');
      }

      if (contest.maxParticipants > 0) {
        const participantCount = await strapi.db.query('api::user-contest-participation.user-contest-participation').count({
          where: { contest: contestId }
        });

        if (participantCount >= contest.maxParticipants) {
          throw new Error('Contest is full. Maximum participants reached');
        }
      }

      const participation = await strapi.entityService.create('api::user-contest-participation.user-contest-participation', {
        data: {
          user: user.id,
          contest: contestId,
          participationStatus: 'joined',
          totalScore: 0,
          startTime: new Date(),
          publishedAt: new Date()
        },
        populate: ['user', 'contest']
      });

      return participation;

    } catch (error) {
      strapi.log.error('Error joining contest:', error);
      throw error;
    }
  }
}));