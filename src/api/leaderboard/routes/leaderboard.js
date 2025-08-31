module.exports = {
  routes: [
    {
      method: "GET",
      path: "/contests/:contestId/leaderboard",
      handler: "leaderboard.getLeaderboard",
      config: { 
         auth: false,
         middlewares: ["global::is-authenticated"],

       },
    },
    {
      method: "POST",
      path: "/contests/:contestId/leaderboard",
      handler: "leaderboard.updateScore",
      config: { auth: false ,
         middlewares: ["global::is-authenticated"]
       },
    },
    {
      method: "POST",
      path: "/contests/:contestId/leaderboard/:userId/prize",
      handler: "leaderboard.awardPrize",
      config: { auth: false },
    },
  ],
};
