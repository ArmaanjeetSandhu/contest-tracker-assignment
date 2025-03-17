const mongoose = require("mongoose");
const BookmarkSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contest",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
BookmarkSchema.index({ userId: 1, contestId: 1 }, { unique: true });
module.exports = mongoose.model("Bookmark", BookmarkSchema);
