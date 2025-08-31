module.exports = {
  routes: [
    {
      method: "POST",
      path: "/contests/:contestId/questions/:questionId/submit",
      handler: "user-answer.submitAnswer",
      config: {
        auth: false,
        middlewares: ["global::is-authenticated"],

      },
    },
     {
      method: "GET",
      path: "/contests/:contestId/questions/:questionId/answers",
      handler: "user-answer.getAnswers",
      config: {
        auth: false,
        middlewares: ["global::is-authenticated"],
      },
    },
  ],
};
