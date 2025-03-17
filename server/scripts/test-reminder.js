const mongoose = require("mongoose");
const config = require("config");
const { sendReminderEmail } = require("../services/emailService");
const Contest = require("../models/Contest");
const User = require("../models/User");
const Reminder = require("../models/Reminder");
async function testReminderSystem() {
  try {
    await mongoose.connect(config.get("mongoURI"), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const uniqueContestName = `Test Reminder Contest ${timestamp}`;
    const startTime = new Date(Date.now() + 32 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
    const testContest = new Contest({
      name: uniqueContestName,
      platform: "Leetcode",
      startTime,
      endTime,
      url: "https://leetcode.com/contest/test",
      status: "upcoming",
      duration: 120,
      isTest: true
    });
    await testContest.save();
    console.log(
      `Created test contest: ${
        testContest._id
      } - Starts in 32 minutes (${startTime.toISOString()})`
    );
    const user = await User.findOne({ role: "admin" });
    if (!user) {
      console.error("No admin user found to test with");
      await mongoose.disconnect();
      return;
    }
    console.log(`Using admin user: ${user.email} (${user._id})`);
    const reminder = new Reminder({
      userId: user._id,
      contestId: testContest._id,
      reminderTime: "30min",
      sent: false,
    });
    await reminder.save();
    console.log(`Created reminder for user ${user.email}: ${reminder._id}`);
    console.log("Running reminder check...");
    const now = new Date();
    console.log(`Current time: ${now.toISOString()}`);
    const reminders = await Reminder.find({
      contestId: testContest._id,
      reminderTime: "30min",
      sent: false,
    });
    console.log(`Found ${reminders.length} reminders to process`);
    const timeDiffMinutes = Math.round((startTime - now) / (60 * 1000));
    console.log(`Contest starts in ${timeDiffMinutes} minutes`);
    console.log("Forcing reminder email for testing...");
    console.log(`Sending reminder to ${user.email}`);
    const emailSent = await sendReminderEmail(
      user.email,
      testContest.name,
      testContest.platform,
      testContest.startTime,
      testContest.url
    );
    if (emailSent) {
      reminder.sent = true;
      await reminder.save();
      console.log(`Reminder sent successfully and marked as sent`);
    } else {
      console.error(`Failed to send reminder email`);
    }
    console.log("Test completed. Disconnect from MongoDB");
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error in test:", error);
    await mongoose.disconnect();
  }
}
testReminderSystem();
