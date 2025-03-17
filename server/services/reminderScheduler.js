const cron = require("node-cron");
const Reminder = require("../models/Reminder");
const Contest = require("../models/Contest");
const User = require("../models/User");
const { sendReminderEmail } = require("./emailService");
// Function to send reminders for a specific contest and reminder time
async function sendReminders(contest, reminderTime) {
  try {
    console.log(
      `Processing reminders for contest: ${contest.name}, time: ${reminderTime}`
    );
    // Find all unsent reminders for this contest and reminder time
    const reminders = await Reminder.find({
      contestId: contest._id,
      reminderTime,
      sent: false,
    });
    console.log(`Found ${reminders.length} unsent reminders to process`);
    for (const reminder of reminders) {
      try {
        // Get the user's email
        const user = await User.findById(reminder.userId);
        if (user && user.email) {
          console.log(
            `Sending reminder to ${user.email} for contest ${contest.name}`
          );
          // Send the reminder email
          const emailSent = await sendReminderEmail(
            user.email,
            contest.name,
            contest.platform,
            contest.startTime,
            contest.url
          );
          if (emailSent) {
            // Mark the reminder as sent
            reminder.sent = true;
            await reminder.save();
            console.log(`Reminder marked as sent for user ${user.email}`);
          } else {
            console.error(`Failed to send email to ${user.email}`);
          }
        } else {
          console.log(
            `User not found or no email for userId: ${reminder.userId}`
          );
        }
      } catch (err) {
        console.error(`Error processing individual reminder: ${err.message}`);
      }
    }
  } catch (error) {
    console.error(`Error sending reminders for ${contest.name}:`, error);
  }
}
// Schedule the job to run every minute
const initReminderScheduler = () => {
  console.log("Initializing reminder scheduler...");
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      console.log(`Running reminder check at ${now.toISOString()}`);
      // Find all contests that are starting soon
      const upcomingContests = await Contest.find({
        status: "upcoming",
        startTime: { $gt: now },
      });
      console.log(
        `Found ${upcomingContests.length} upcoming contests to check`
      );
      for (const contest of upcomingContests) {
        const contestStartTime = new Date(contest.startTime);
        // Calculate time difference in minutes
        const timeDiffMinutes = Math.round(
          (contestStartTime - now) / (60 * 1000)
        );
        // Check for 30-minute reminders (between 29 and 31 minutes before)
        if (timeDiffMinutes >= 29 && timeDiffMinutes <= 31) {
          console.log(`Contest ${contest.name} starts in ~30 minutes`);
          await sendReminders(contest, "30min");
        }
        // Check for 1-hour reminders (between 59 and 61 minutes before)
        if (timeDiffMinutes >= 59 && timeDiffMinutes <= 61) {
          console.log(`Contest ${contest.name} starts in ~1 hour`);
          await sendReminders(contest, "1hour");
        }
      }
    } catch (error) {
      console.error("Error in reminder scheduler:", error);
    }
  });
  return { status: "Reminder scheduler initialized successfully" };
};
module.exports = { initReminderScheduler };
