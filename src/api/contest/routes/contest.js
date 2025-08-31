// src/api/contest/routes/contest.js
'use strict';

module.exports = {
  routes: [
   
    {
      method: 'POST',
      path: '/contests',
      handler: 'contest.create',
      config: {
        auth: false,   //disable Strapi’s built-in auth check
        middlewares: [
          'global::is-authenticated',
        ],
      },
    },
    {
      "method": "GET",
      "path": "/contests/:id?",
      "handler": "contest.find",
      "config": {
        "auth": false,
        middlewares: [
          'global::is-authenticated',
        ],
        
      }
    },
    {
      method: 'PATCH',
      path: '/contests/:id',
      handler: 'contest.update',
      config: {
        "auth":false,
        middlewares: [
          'global::is-authenticated',
        ],
      },
    },
    {
      method: 'DELETE',
      path: '/contests/:id',
      handler: 'contest.delete',
      config: {
        auth: false,   
        middlewares: [
          'global::is-authenticated',
        ],
      },
    },
    {
      method: 'GET',
      path: '/contests/active',
      handler: 'contest.findActive',
      config: {
        middlewares: ['global::is-authenticated'],
      },
    },
  ],
};