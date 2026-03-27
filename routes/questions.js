const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const authenticate = require("../middlewares/authenticate");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * GET /questions
 */
router.get("/", async (req, res, next) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /questions/:questionId
 */
router.get("/:questionId", async (req, res, next) => {
  try {
    const { questionId } = req.params;

    if (!isValidObjectId(questionId)) {
      return res.status(400).json({
        message: "Invalid questionId",
      });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    res.json(question);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /questions
 */
router.post("/", authenticate.verifyUser, async (req, res, next) => {
  try {
    const { options, correctAnswerIndex } = req.body;

    if (!Array.isArray(options) || correctAnswerIndex >= options.length) {
      return res.status(400).json({
        message: "correctAnswerIndex must be within options array",
      });
    }

    const question = new Question({
      ...req.body,
      author: req.user._id,
    });

    await question.save();

    res.status(201).json({
      message: "Added the question with ID: " + question._id,
      question,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /questions/:questionId
 */
router.put(
  "/:questionId",
  authenticate.verifyUser,
  authenticate.verifyAuthor,
  async (req, res, next) => {
    try {
      const { questionId } = req.params;
      const { options, correctAnswerIndex } = req.body;

      if (!isValidObjectId(questionId)) {
        return res.status(400).json({
          message: "Invalid questionId",
        });
      }

      if (
        options &&
        (!Array.isArray(options) || correctAnswerIndex >= options.length)
      ) {
        return res.status(400).json({
          message: "correctAnswerIndex must be within options array",
        });
      }

      const updated = await Question.findByIdAndUpdate(questionId, req.body, {
        new: true,
      });

      if (!updated) {
        return res.status(404).json({
          message: "Question not found",
        });
      }

      res.json({
        message: "Question updated successfully",
        updated,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * DELETE /questions/:questionId
 */
router.delete(
  "/:questionId",
  authenticate.verifyUser,
  authenticate.verifyAuthor,
  async (req, res, next) => {
    try {
      const { questionId } = req.params;

      if (!isValidObjectId(questionId)) {
        return res.status(400).json({
          message: "Invalid questionId",
        });
      }

      const question = await Question.findById(questionId);
      if (!question) {
        return res.status(404).json({
          message: "Question not found",
        });
      }

      await Quiz.updateMany(
        { questions: questionId },
        { $pull: { questions: questionId } },
      );

      await Question.findByIdAndDelete(questionId);

      res.json({
        message: "Question deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
