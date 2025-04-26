const express = require("express");
const router = express.Router();
const Reminder = require("../models/Reminder");
const Contest = require("../models/Contest");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
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
router.post("/", limiter, auth, async (req, res) => {
  try {
    const { userId, contestId, reminderTime } = req.body;
    if (!userId || !contestId || !reminderTime) {
      return res
        .status(400)
        .json({ message: "userId, contestId, and reminderTime are required" });
    }
    if (!mongoose.isValidObjectId(contestId)) {
      return res.status(400).json({ message: "Invalid contestId" });
    }
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }
    if (new Date(contest.startTime) <= new Date()) {
      return res.status(400).json({
        message: "Cannot set reminder for a contest that has already started",
      });
    }
    if (typeof userId !== "string" || typeof contestId !== "string") {
      return res.status(400).json({ message: "Invalid userId or contestId" });
    }
    const existingReminder = await Reminder.findOne({
      userId: userId,
      contestId: contestId,
    });
    if (existingReminder) {
      existingReminder.reminderTime = reminderTime;
      existingReminder.sent = false;
      await existingReminder.save();
      const populatedReminder = await Reminder.findById(
        existingReminder._id
      ).populate("contestId");
      return res.json(populatedReminder);
    }
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
router.delete("/:reminderId", limiter, auth, async (req, res) => {
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
