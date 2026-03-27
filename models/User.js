const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    default: "",
    required: true,
  },
  password: {
    type: String,
    default: "",
    required: true,
  },
  admin: {
    type: Boolean,
    default: false,
    required: true,
  },
});

module.exports = mongoose.model("User", UserSchema);
