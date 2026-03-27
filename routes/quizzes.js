const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const authenticate = require("../middlewares/authenticate");

const mongoose = require("mongoose");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * GET /quizzes
 */
router.get("/", async (req, res, next) => {
  try {
    const quizzes = await Quiz.find().populate("questions");
    res.json(quizzes);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /quizzes/:quizId
 */
router.get("/:quizId", async (req, res, next) => {
  try {
    const { quizId } = req.params;

    if (!isValidObjectId(quizId)) {
      return res.status(400).json({ message: "Invalid quizId" });
    }

    const quiz = await Quiz.findById(quizId).populate("questions");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.json(quiz);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /quizzes/:quizId/populate
 * Populate only questions that contain the word "capital"
 */
router.get("/:quizId/populate", async (req, res, next) => {
  try {
    const { quizId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({
        message: "Invalid quizId",
      });
    }

    const quiz = await Quiz.findById(quizId).populate({
      path: "questions",
      match: {
        $or: [
          { text: { $regex: "capital", $options: "i" } },
          { keywords: { $regex: "capital", $options: "i" } },
        ],
      },
    });

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    res.json(quiz);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /quizzes
 */
router.post(
  "/",
  authenticate.verifyUser,
  authenticate.verifyAdmin,
  async (req, res, next) => {
    try {
      const quiz = new Quiz(req.body);
      await quiz.save();

      res.status(201).json({
        message: "Added the quiz with ID: " + quiz._id,
        quiz,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /quizzes/:quizId/question
 * Add a question to a quiz
 */
router.post(
  "/:quizId/question",
  authenticate.verifyUser,
  authenticate.verifyAdmin,
  async (req, res, next) => {
    try {
      const { quizId } = req.params;
      const { options, correctAnswerIndex } = req.body;

      if (!isValidObjectId(quizId)) {
        return res.status(400).json({ message: "Invalid quizId" });
      }

      if (!Array.isArray(options) || correctAnswerIndex >= options.length) {
        return res.status(400).json({
          message: "correctAnswerIndex must be within options array",
        });
      }

      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // const question = new Question(req.body);
      const question = new Question({
        ...req.body,
        author: req.user._id,
      });
      await question.save();

      quiz.questions.push(question._id);
      await quiz.save();

      res.status(201).json({
        message: "Question added to quiz",
        question,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /quizzes/:quizId/questions
 * Add multiple questions to a quiz
 */
router.post(
  "/:quizId/questions",
  authenticate.verifyUser,
  authenticate.verifyAdmin,
  async (req, res, next) => {
    try {
      const { quizId } = req.params;
      const questionsData = req.body;

      if (!isValidObjectId(quizId)) {
        return res.status(400).json({ message: "Invalid quizId" });
      }

      if (!Array.isArray(questionsData)) {
        return res.status(400).json({
          message: "Request body must be an array of questions",
        });
      }

      for (const q of questionsData) {
        if (
          !Array.isArray(q.options) ||
          q.correctAnswerIndex >= q.options.length
        ) {
          return res.status(400).json({
            message: "Invalid question data",
          });
        }
      }

      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // const createdQuestions = await Question.insertMany(questionsData);
      const questionsWithAuthor = questionsData.map((q) => ({
        ...q,
        author: req.user._id,
      }));

      const createdQuestions = await Question.insertMany(questionsWithAuthor);

      quiz.questions.push(...createdQuestions.map((q) => q._id));
      await quiz.save();

      res.status(201).json({
        message: "Questions added to quiz successfully",
        totalAdded: createdQuestions.length,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PUT /quizzes/:quizId
 */
router.put(
  "/:quizId",
  authenticate.verifyUser,
  authenticate.verifyAdmin,
  async (req, res, next) => {
    try {
      const { quizId } = req.params;

      if (!isValidObjectId(quizId)) {
        return res.status(400).json({ message: "Invalid quizId" });
      }

      const updated = await Quiz.findByIdAndUpdate(quizId, req.body, {
        new: true,
      });

      if (!updated) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      res.json({
        message: "Quiz updated successfully",
        updated,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * DELETE /quizzes/:quizId
 */
router.delete(
  "/:quizId",
  authenticate.verifyUser,
  authenticate.verifyAdmin,
  async (req, res, next) => {
    try {
      const { quizId } = req.params;

      if (!isValidObjectId(quizId)) {
        return res.status(400).json({ message: "Invalid quizId" });
      }

      const quiz = await Quiz.findById(quizId);

      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      if (quiz.questions.length > 0) {
        await Question.deleteMany({
          _id: { $in: quiz.questions },
        });
      }

      await Quiz.findByIdAndDelete(quizId);

      res.json({ message: "Quiz deleted successfully" });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
