module.exports = {
  routes: [
    {
      method: "POST",
      path: "/questions",
      handler: "question.create",
      config: {
        auth: false,
        middlewares: ["global::is-authenticated"],
      },
    },
    {
      method: "GET",
      path: "/contests/:contestId/questions",
      handler: "question.findByContest",
      config: {
        auth: false,
        middlewares: ["global::is-authenticated"],
      },
    },
  ],
};
