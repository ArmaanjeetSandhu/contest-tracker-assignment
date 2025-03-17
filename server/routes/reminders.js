const express = require("express");
const router = express.Router();
const Reminder = require("../models/Reminder");
const Contest = require("../models/Contest");
const auth = require("../middleware/auth");
const rateLimit = require("express-rate-limit");

// Configure rate limiter: maximum of 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
// Get all reminders for a user
router.get("/:userId", limiter, auth, async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.params.userId })
      .populate("contestId")
      .sort({ createdAt: -1 });
    res.json(reminders);
  } catch (err) {
    console.error(
      "Error fetching reminders for user %s:",
      req.params.userId,
      err.message
    );
    res.status(500).json({ message: err.message });
  }
});
// Create a new reminder
router.post("/", auth, limiter, async (req, res) => {
  try {
    const { userId, contestId, reminderTime } = req.body;
    // Validate inputs
    if (!userId || !contestId || !reminderTime) {
      return res
        .status(400)
        .json({ message: "userId, contestId, and reminderTime are required" });
    }
    // Check if the contest exists
    const contest = await Contest.findById({ _id: { $eq: contestId } });
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }
    // Check if the contest is in the future
    if (new Date(contest.startTime) <= new Date()) {
      return res
        .status(400)
        .json({
          message: "Cannot set reminder for a contest that has already started",
        });
    }
    // Check if a reminder already exists
    if (typeof userId !== "string" || typeof contestId !== "string") {
      return res.status(400).json({ message: "Invalid userId or contestId" });
    }
    const existingReminder = await Reminder.findOne({
      userId: { $eq: userId },
      contestId: { $eq: contestId },
    });
    if (existingReminder) {
      // Update existing reminder
      existingReminder.reminderTime = reminderTime;
      existingReminder.sent = false;
      await existingReminder.save();
      const populatedReminder = await Reminder.findById(
        existingReminder._id
      ).populate("contestId");
      return res.json(populatedReminder);
    }
    // Create new reminder
    const newReminder = new Reminder({
      userId,
      contestId,
      reminderTime,
    });
    await newReminder.save();
    const populatedReminder = await Reminder.findById(newReminder._id).populate(
      "contestId"
    );
    res.status(201).json(populatedReminder);
  } catch (err) {
    console.error("Error adding reminder:", err.message);
    res.status(500).json({ message: err.message });
  }
});
// Delete a reminder
router.delete("/:reminderId", auth, limiter, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.reminderId);
    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }
    await Reminder.findByIdAndDelete(req.params.reminderId);
    res.json({
      message: "Reminder deleted successfully",
      reminderId: req.params.reminderId,
    });
  } catch (err) {
    console.error(
      "Error deleting reminder %s:",
      req.params.reminderId,
      err.message
    );
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;
