const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

/**
 * POST /login
 * Authenticate a user
 */
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // validate input
    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({
        message: "Wrong username or password",
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        message: "Wrong username or password",
      });
    }

    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        admin: user.admin,
      },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /register
 * Create a new user
 */
router.post("/register", async (req, res, next) => {
  try {
    const { username, password, admin } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    const newUser = new User({
      username,
      password,
      admin: admin || false,
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
