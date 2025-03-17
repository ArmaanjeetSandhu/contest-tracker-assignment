const mongoose = require("mongoose");
const config = require("config");
const Contest = require("../models/Contest");
const Reminder = require("../models/Reminder");
async function cleanupTestContests() {
  try {
    await mongoose.connect(config.get("mongoURI"), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected");
    const testContests = await Contest.find({ name: /Test Reminder Contest/ });
    console.log(`Found ${testContests.length} test contests`);
    for (const contest of testContests) {
      await Reminder.deleteMany({ contestId: contest._id });
      console.log(`Deleted reminders for contest: ${contest.name}`);
      await Contest.findByIdAndDelete(contest._id);
      console.log(`Deleted test contest: ${contest.name}`);
    }
    console.log("Cleanup completed");
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error in cleanup:", error);
    await mongoose.disconnect();
  }
}
cleanupTestContests();
