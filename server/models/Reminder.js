const mongoose = require("mongoose");
const ReminderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contest",
    required: true,
  },
  reminderTime: {
    type: String,
    enum: ["30min", "1hour"],
    required: true,
  },
  sent: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
// Create a compound index to ensure a user can only have one reminder per contest
ReminderSchema.index({ userId: 1, contestId: 1 }, { unique: true });
module.exports = mongoose.model("Reminder", ReminderSchema);
