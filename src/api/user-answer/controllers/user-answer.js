'use strict';

async function submitAnswer(ctx) {
  try {
    const user = ctx.state.user;
    const { contestId, questionId } = ctx.params;

    let userAnswer;
    
    if (ctx.request.body.hasOwnProperty('userAnswer')) {
      userAnswer = ctx.request.body.userAnswer;
      
      if (userAnswer && typeof userAnswer === 'object' && userAnswer.hasOwnProperty('userAnswer')) {
        userAnswer = userAnswer.userAnswer;
      }
    }
    
    if (!user) {
      return ctx.unauthorized("You must be logged in to submit answers");
    }

    if (!contestId || !questionId) {
      return ctx.badRequest("Contest ID and Question ID are required");
    }

    if (userAnswer === undefined || userAnswer === null) {
      return ctx.badRequest("User answer is required in the request body");
    }
    const participation = await strapi.db.query("api::user-contest-participation.user-contest-participation").findOne({
      where: { user: user.id, contest: contestId },
    });

    if (!participation) {
      return ctx.forbidden("You must join this contest before submitting answers");
    }
    const question = await strapi.entityService.findOne("api::question.question", questionId, {
      fields: ["id", "questionText", "questionType", "points", "correctAnswer"],
    });

    if (!question) {
      return ctx.notFound("Question not found");
    }
    const existingAnswer = await strapi.db.query("api::user-answer.user-answer").findOne({
      where: {
        participation: participation.id,
        question: question.id,
      },
    });

    if (existingAnswer) {
      return ctx.badRequest("You have already submitted an answer for this question");
    }
    let submittedAnswer = userAnswer;

    if (typeof userAnswer === 'object' && userAnswer.hasOwnProperty('answer')) {
      submittedAnswer = userAnswer.answer;
    }

    let isCorrect = false;

    if (Array.isArray(submittedAnswer) && Array.isArray(question.correctAnswer)) {
      const submittedSet = new Set(
        submittedAnswer.map(a => (a.label ? a.label.toString().trim().toLowerCase() : a.toString().trim().toLowerCase()))
      );
      const correctSet = new Set(
        question.correctAnswer.map(a => (a.label ? a.label.toString().trim().toLowerCase() : a.toString().trim().toLowerCase()))
      );

      isCorrect =
        submittedSet.size === correctSet.size &&
        [...submittedSet].every(val => correctSet.has(val));
    } 
    else if (typeof submittedAnswer === 'object' && submittedAnswer?.label && question.correctAnswer?.label) {
      isCorrect = submittedAnswer.label === question.correctAnswer.label;
    } 
    else {
      isCorrect = submittedAnswer == question.correctAnswer;
    }


    const pointsEarned = isCorrect ? question.points : 0;

    const savedAnswer = await strapi.entityService.create("api::user-answer.user-answer", {
      data: {
        userAnswer: { answer: userAnswer },
        isCorrect,
        pointsEarned,
        answeredAt: new Date(),
        participation: participation.id,
        question: question.id,
      },
    });

    await strapi.db.query("api::user-contest-participation.user-contest-participation").update({
      where: { id: participation.id },
      data: {
        totalScore: participation.totalScore + pointsEarned,
      },
    });
    const existingLeaderboard = await strapi.db.query("api::leaderboard.leaderboard").findOne({
      where: { user: user.id, contest: contestId },
    });

      if (existingLeaderboard) {
        await strapi.entityService.update("api::leaderboard.leaderboard", existingLeaderboard.id, {
          data: { 
            score: participation.totalScore + pointsEarned,
            user: { connect: { id: user.id } },
            contest: { connect: { id: contestId } },
          },
        });
      } else {
        await strapi.entityService.create("api::leaderboard.leaderboard", {
          data: {
            user: { connect: { id: user.id } },
            contest: { connect: { id: contestId } },
            score: participation.totalScore + pointsEarned,
          },
        });
      }
    return ctx.send({
      success: true,
      message: "Answer submitted successfully",
      data: savedAnswer,
    });

  } catch (err) {
    strapi.log.error("Error submitting answer:", err);
    return ctx.badRequest(err.message || "Something went wrong while submitting answer");
  }
}
async function getAnswers(ctx) {
  try {
    const user = ctx.state.user;
    const { contestId, questionId } = ctx.params;

    if (!user) {
      return ctx.unauthorized("You must be logged in");
    }

    if (!['admin', 'vip'].includes(user.role.type)) {
      return ctx.forbidden("You don't have permission to view answers");
    }

    const question = await strapi.db.query("api::question.question").findOne({
      where: { id: questionId, contest: contestId }
    });

    if (!question) {
      return ctx.notFound("Question does not exist in this contest");
    }

    const answers = await strapi.db.query("api::user-answer.user-answer").findMany({
      where: { question: question.id },
      populate: {
        participation: {
          populate: ['user', 'contest'],
        },
        question: true,
      },
    });

    return ctx.send({
      success: true,
      message: "Answers fetched successfully",
      data: answers,
    });

  } catch (err) {
    strapi.log.error("Error fetching answers:", err);
    return ctx.badRequest(err.message || "Something went wrong while fetching answers");
  }
}


module.exports = {
  submitAnswer,
  getAnswers
};