var express = require("express");
const User = require("../models/User");
var router = express.Router();
const authenticate = require("../middlewares/authenticate");

/* GET users listing. */
router.get(
  "/",
  authenticate.verifyUser,
  authenticate.verifyAdmin,
  async (req, res, next) => {
    try {
      const users = await User.find({});

      res.status(200).json({
        success: true,
        message: "Fetched all users successfully",
        data: users,
      });
    } catch (error) {
      console.error("Error fetching users:", error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch users",
        error: error.message,
      });
    }
  },
);

module.exports = router;
