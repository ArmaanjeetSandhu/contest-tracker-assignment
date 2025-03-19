const express = require("express");
const router = express.Router();
const Bookmark = require("../models/Bookmark");
const Contest = require("../models/Contest");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
router.get("/:userId", limiter, async (req, res) => {
  try {
    console.log(`Fetching bookmarks for user ID: ${req.params.userId}`);
    const bookmarks = await Bookmark.find({ userId: req.params.userId })
      .populate("contestId")
      .sort({ createdAt: -1 });
    console.log(
      `Found ${bookmarks.length} bookmarks for user ${req.params.userId}`
    );
    res.json(bookmarks);
  } catch (err) {
    console.error(
      "Error fetching bookmarks for user %s:",
      req.params.userId,
      err.message
    );
    res.status(500).json({ message: err.message });
  }
});
router.post("/", auth, limiter, async (req, res) => {
  try {
    const { userId, contestId } = req.body;
    if (!userId || !contestId) {
      return res
        .status(400)
        .json({ message: "userId and contestId are required" });
    }
    if (typeof contestId !== "string") {
      return res.status(400).json({ message: "Invalid contestId" });
    }
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }
    if (typeof userId !== "string") {
      return res.status(400).json({ message: "Invalid userId" });
    }
    const existingBookmark = await Bookmark.findOne({
      userId: userId,
      contestId: contestId,
    });
    if (existingBookmark) {
      return res.status(400).json({ message: "Contest already bookmarked" });
    }
    const newBookmark = new Bookmark({
      userId,
      contestId,
    });
    await newBookmark.save();
    const populatedBookmark = await Bookmark.findById(newBookmark._id).populate(
      "contestId"
    );
    res.status(201).json(populatedBookmark);
  } catch (err) {
    console.error("Error adding bookmark:", err.message);
    res.status(500).json({ message: err.message });
  }
});
router.post("/toggle", auth, limiter, async (req, res) => {
  try {
    const { userId, contestId } = req.body;
    if (!userId || !contestId) {
      return res
        .status(400)
        .json({ message: "userId and contestId are required" });
    }
    if (typeof contestId !== "string") {
      return res.status(400).json({ message: "Invalid contestId" });
    }
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }
    const existingBookmark = await Bookmark.findOne({
      userId: userId,
      contestId: contestId,
    });
    if (existingBookmark) {
      await Bookmark.findByIdAndDelete(existingBookmark._id);
      res.json({
        message: "Bookmark removed",
        bookmarked: false,
        bookmarkId: existingBookmark._id,
      });
    } else {
      const newBookmark = new Bookmark({
        userId,
        contestId,
      });
      await newBookmark.save();
      const populatedBookmark = await Bookmark.findById(
        newBookmark._id
      ).populate("contestId");
      res.status(201).json({
        message: "Bookmark added",
        bookmarked: true,
        bookmark: populatedBookmark,
      });
    }
  } catch (err) {
    console.error("Error toggling bookmark:", err.message);
    res.status(500).json({ message: err.message });
  }
});
router.delete("/:bookmarkId", auth, limiter, async (req, res) => {
  try {
    const bookmark = await Bookmark.findById(req.params.bookmarkId);
    if (!bookmark) {
      return res.status(404).json({ message: "Bookmark not found" });
    }
    if (bookmark.userId !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this bookmark" });
    }
    await Bookmark.findByIdAndDelete(req.params.bookmarkId);
    res.json({ message: "Bookmark deleted successfully" });
  } catch (err) {
    console.error(
      "Error deleting bookmark %s:",
      req.params.bookmarkId,
      err.message
    );
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;
