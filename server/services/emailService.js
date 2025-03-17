const nodemailer = require("nodemailer");
const config = require("config");
// Create a transporter object
const createTransporter = () => {
  try {
    return nodemailer.createTransport({
      service: config.get("emailService"),
      auth: {
        user: config.get("emailUser"),
        pass: config.get("emailPassword"),
      },
    });
  } catch (error) {
    console.error("Error creating email transporter:", error);
    return null;
  }
};
// Function to send reminder emails
const sendReminderEmail = async (
  userEmail,
  contestName,
  platform,
  startTime,
  url
) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.error("Email transporter not available");
    return false;
  }
  const formattedTime = new Date(startTime).toLocaleString();
  const timeUntilStart = Math.round(
    (new Date(startTime) - new Date()) / (1000 * 60)
  );
  const timeMessage = timeUntilStart === 30 ? "30 minutes" : "1 hour";
  const mailOptions = {
    from: config.get("emailUser"),
    to: userEmail,
    subject: `🔔 Reminder: ${contestName} starts in ${timeMessage}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
        <h1 style="color: #3d7a9e; border-bottom: 2px solid #3d7a9e; padding-bottom: 10px;">Contest Reminder</h1>
        <p>Hello there,</p>
        <p>This is a friendly reminder that the contest <strong style="color: #e3702d;">${contestName}</strong> on ${platform} will start in ${timeMessage}.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Contest:</strong> ${contestName}</p>
          <p style="margin: 5px 0;"><strong>Platform:</strong> ${platform}</p>
          <p style="margin: 5px 0;"><strong>Start Time:</strong> ${formattedTime}</p>
        </div>
        <p>Make sure you're prepared and ready to go!</p>
        <a href="${url}" style="display: inline-block; background-color: #3d7a9e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px;">Go to Contest</a>
        <p style="margin-top: 20px;">Good luck!</p>
        <p style="color: #777; font-size: 0.9em; margin-top: 30px; border-top: 1px solid #e1e1e1; padding-top: 15px;">
          This is an automated reminder from Contest Tracker. You received this because you requested a reminder for this contest.
        </p>
      </div>
    `,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.response}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
module.exports = { sendReminderEmail };
