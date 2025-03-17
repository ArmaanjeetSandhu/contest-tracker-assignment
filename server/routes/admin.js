const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
// @route   GET api/admin/users
// @desc    Get all users
// @access  Admin only
router.get("/users", [auth, admin], async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ date: -1 });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});
// @route   DELETE api/admin/users/:id
// @desc    Delete a user (admin only)
// @access  Admin only
router.delete("/users/:id", [auth, admin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Don't allow admins to delete themselves through this route
    if (user._id.toString() === req.user.id) {
      return res
        .status(400)
        .json({
          message: "Admin cannot delete their own account through this route",
        });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully", userId: req.params.id });
  } catch (err) {
    console.error("Error deleting user:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
