require("dotenv").config();
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

const quizzesRouter = require("./routes/quizzes");
const questionsRouter = require("./routes/questions");
const authRouter = require("./routes/auth");

var app = express();

// CORS configuration
app.use(
  cors({
    origin: "http://localhost:5173", // FE URL
    credentials: true, // cho phép gửi cookie
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", authRouter);
app.use("/users", usersRouter);
app.use("/quizzes", quizzesRouter);
app.use("/questions", questionsRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    message: err.message || "Internal Server Error",
  });
});

// Thêm MongoDB
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

module.exports = app;
