module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/auth/register',
      handler: 'user.register',
      config: {
        auth: false, 
      },
    },
    {
      method: 'POST',
      path: '/auth/login',
      handler: 'user.login',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/users/me',
      handler: 'user.getProfile',
      config: { auth: false,
      middlewares: ["global::is-authenticated"]

       }, 
    },
    {
      method: 'PATCH',
      path: '/users/me/:id',
      handler: 'user.updateProfile',
      config: { auth: false ,
      middlewares: ["global::is-authenticated"]

      }, 
    },
  ],
};
