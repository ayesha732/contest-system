module.exports = {
  routes: [
    {
      method: "GET",
      path: "/prizes",
      handler: "prize.find",
      config: {
        auth: false,
        middlewares: ["global::is-authenticated"]
      },
    },
    {
      method: "POST",
      path: "/prizes",
      handler: "prize.create",
      config: {
        auth: false,
        middlewares: ["global::is-authenticated"]

      },
    },
    {
      method: "PATCH",
      path: "/prizes/:id",
      handler: "prize.update",
      config: {
        auth: false,
        middlewares: ["global::is-authenticated"]

      },
    },
  ],
};
