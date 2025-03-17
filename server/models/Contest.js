const mongoose = require("mongoose");
const ContestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  platform: {
    type: String,
    required: true,
    enum: ["Codeforces", "CodeChef", "Leetcode"],
    index: true,
  },
  startTime: {
    type: Date,
    required: true,
    index: true,
  },
  endTime: {
    type: Date,
    required: true,
    index: true,
  },
  url: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["upcoming", "ongoing", "past"],
    required: true,
    index: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  solutionUrl: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isTest: {
    type: Boolean,
    default: false,
    index: true,
  },
});
ContestSchema.index({ name: 1, platform: 1 }, { unique: true });
ContestSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});
ContestSchema.pre("save", function (next) {
  const now = new Date();
  if (this.startTime > now) {
    this.status = "upcoming";
  } else if (this.endTime > now) {
    this.status = "ongoing";
  } else {
    this.status = "past";
  }
  next();
});
ContestSchema.virtual("timeRemaining").get(function () {
  const now = new Date();
  if (this.status === "upcoming") {
    return this.startTime - now;
  } else if (this.status === "ongoing") {
    return this.endTime - now;
  } else {
    return 0;
  }
});
ContestSchema.methods.getCurrentStatus = function () {
  const now = new Date();
  if (this.startTime > now) {
    return "upcoming";
  } else if (this.endTime > now) {
    return "ongoing";
  } else {
    return "past";
  }
};
module.exports = mongoose.model("Contest", ContestSchema);
