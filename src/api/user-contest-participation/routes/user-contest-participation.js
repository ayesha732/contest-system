'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/user-contest-participations/contest/:contestId/join',
      handler: 'user-contest-participation.join',
      config: {
        auth: false,
        middlewares: ['global::is-authenticated'],
        
      }
    },
    {
      method: 'GET',
      path: '/user-contest-participations/my-participations',
      handler: 'user-contest-participation.findMyParticipations',
      config: {
        auth: false,
        middlewares: ['global::is-authenticated'],
        policies: [],
        description: 'Get my contest participations',
        tag: {
          name: 'User Contest Participation'
        }
      }
    }
  ]
};