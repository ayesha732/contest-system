'use strict';

/**
 * A set of functions called "actions" for `question`
 */

async function create(ctx) {
  try {
    const user = ctx.state.user;

    if (!user || user.role.type !== "admin") {
      return ctx.unauthorized("Only Admins can add questions");
    }

    const { data } = ctx.request.body;

    const question = await strapi
      .service("api::question.question")
      .createQuestion(data, user);

    return ctx.created({
      success: true,
      message: "Question added successfully",
      data: question,
    });
  } catch (err) {
    strapi.log.error("Error adding question:", err);
    return ctx.badRequest(err.message || "Something went wrong");
  }
}

async function findByContest(ctx) {
  try {
    const user = ctx.state.user;
    const { contestId } = ctx.params;

    if (!contestId) {
      return ctx.badRequest("Contest ID is required");
    }

    if (!user) {
      return ctx.unauthorized("You must be logged in to access contest questions");
    }

    const participation = await strapi.db.query("api::user-contest-participation.user-contest-participation").findOne({
      where: {
        user: user.id,
        contest: contestId,
      },
    });

    if (!participation) {
      return ctx.forbidden("You must join this contest before viewing questions");
    }
    const questions = await strapi.entityService.findMany("api::question.question", {
      filters: { contest: contestId },

    });
    return ctx.send({
      success: true,
      message:"Question fetched successfully",
      data: questions,
    });
  } catch (err) {
    strapi.log.error("Error fetching contest questions:", err);
    return ctx.badRequest(err.message || "Failed to fetch questions");
  }
}

module.exports = {
  create,
  findByContest,
};
