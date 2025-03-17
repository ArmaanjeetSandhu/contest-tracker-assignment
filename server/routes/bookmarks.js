const express = require("express");
const router = express.Router();
const Bookmark = require("../models/Bookmark");
const Contest = require("../models/Contest");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
// @route   GET /api/bookmarks/:userId
// @desc    Get all bookmarks for a user
// @access  Public
router.get("/:userId", async (req, res) => {
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
      `Error fetching bookmarks for user ${req.params.userId}:`,
      err.message
    );
    res.status(500).json({ message: err.message });
  }
});
// @route   POST /api/bookmarks
// @desc    Create a new bookmark
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const { userId, contestId } = req.body;
    if (!userId || !contestId) {
      return res
        .status(400)
        .json({ message: "userId and contestId are required" });
    }
    // Ensure the contest exists
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }
    // Check for existing bookmark
    const existingBookmark = await Bookmark.findOne({
      userId,
      contestId,
    });
    if (existingBookmark) {
      return res.status(400).json({ message: "Contest already bookmarked" });
    }
    // Create new bookmark
    const newBookmark = new Bookmark({
      userId,
      contestId,
    });
    await newBookmark.save();
    // Return populated bookmark
    const populatedBookmark = await Bookmark.findById(newBookmark._id).populate(
      "contestId"
    );
    res.status(201).json(populatedBookmark);
  } catch (err) {
    console.error("Error adding bookmark:", err.message);
    res.status(500).json({ message: err.message });
  }
});
// @route   POST /api/bookmarks/toggle
// @desc    Toggle a bookmark (add if not exists, remove if exists)
// @access  Private
router.post("/toggle", auth, async (req, res) => {
  try {
    const { userId, contestId } = req.body;
    if (!userId || !contestId) {
      return res
        .status(400)
        .json({ message: "userId and contestId are required" });
    }
    // Ensure the contest exists
    if (typeof contestId !== "string") {
      return res.status(400).json({ message: "Invalid contestId" });
    }
    const contest = await Contest.findById({ _id: { $eq: contestId } });
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }
    // Look for existing bookmark
    const existingBookmark = await Bookmark.findOne({
      userId: { $eq: userId },
      contestId: { $eq: contestId },
    });
    if (existingBookmark) {
      // Remove bookmark if it exists
      await Bookmark.findByIdAndDelete({ _id: { $eq: existingBookmark._id } });
      res.json({
        message: "Bookmark removed",
        bookmarked: false,
        bookmarkId: existingBookmark._id,
      });
    } else {
      // Create bookmark if it doesn't exist
      const newBookmark = new Bookmark({
        userId: { $eq: userId },
        contestId: { $eq: contestId },
      });
      await newBookmark.save();
      // Return populated bookmark
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
// @route   DELETE /api/bookmarks/:bookmarkId
// @desc    Delete a bookmark
// @access  Private
router.delete("/:bookmarkId", auth, async (req, res) => {
  try {
    const bookmark = await Bookmark.findById(req.params.bookmarkId);
    if (!bookmark) {
      return res.status(404).json({ message: "Bookmark not found" });
    }
    // Additional check to verify user owns this bookmark
    if (bookmark.userId !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this bookmark" });
    }
    await Bookmark.findByIdAndDelete(req.params.bookmarkId);
    res.json({ message: "Bookmark deleted successfully" });
  } catch (err) {
    console.error(
      `Error deleting bookmark ${req.params.bookmarkId}:`,
      err.message
    );
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;
