const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");
const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");
const User = require("../../models/User");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");

// Set up rate limiter: maximum of 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per windowMs
});
router.post(
  "/",
  limiter,
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;
    try {
      let user = await User.findOne({ email: { $eq: email } });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists" }] });
      }
      user = new User({
        name,
        email,
        password,
        role: "user",
      });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
      const payload = {
        user: {
          id: user.id,
          role: user.role,
        },
      };
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: "5 days" },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);
router.post(
  "/admin",
  limiter,
  [
    auth,
    admin,
    [
      check("name", "Name is required").not().isEmpty(),
      check("email", "Please include a valid email").isEmail(),
      check(
        "password",
        "Please enter a password with 6 or more characters"
      ).isLength({ min: 6 }),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists" }] });
      }
      user = new User({
        name,
        email,
        password,
        role: "admin",
      });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      res.json({ msg: "Admin user created successfully" });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);
// @route   DELETE api/users
// @desc    Delete the current user's account
// @access  Private
router.delete("/", auth, limiter, async (req, res) => {
  try {
    // Get user ID from the auth middleware
    const userId = req.user.id;
    // Find and delete the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    // Delete user from database
    await User.findByIdAndDelete(userId);
    // Delete all user's bookmarks
    if (mongoose.connection.collections["bookmarks"]) {
      await mongoose.connection.collections["bookmarks"].deleteMany({ userId });
    }
    // Delete all user's reminders
    if (mongoose.connection.collections["reminders"]) {
      await mongoose.connection.collections["reminders"].deleteMany({ userId });
    }
    res.json({ msg: "User account deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});
module.exports = router;
