const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Question = require("../models/Question");

const secretKey = process.env.SECRET_KEY;

// Verify User
exports.verifyUser = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    const err = new Error("No token provided!");
    err.status = 401;
    return next(err);
  }

  jwt.verify(token.split(" ")[1], secretKey, (err, decoded) => {
    if (err) {
      err.status = 401;
      return next(err);
    }

    req.user = decoded; // gắn user vào request
    next();
  });
};

// Verify Admin
exports.verifyAdmin = (req, res, next) => {
  if (req.user && req.user.admin) {
    next();
  } else {
    const err = new Error("You are not authorized to perform this operation!");
    err.status = 403;
    return next(err);
  }
};

// Verify Author
exports.verifyAuthor = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.questionId);

    if (!question) {
      const err = new Error("Question not found");
      err.status = 404;
      return next(err);
    }

    if (question.author.toString() === req.user._id) {
      next();
    } else {
      const err = new Error("You are not the author of this question");
      err.status = 403;
      return next(err);
    }
  } catch (err) {
    err.status = 500;
    return next(err);
  }
};