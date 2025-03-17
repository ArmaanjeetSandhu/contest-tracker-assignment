const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");
const RateLimit = require("express-rate-limit");
const app = express();
const remindersRoutes = require("./routes/reminders");
const adminRoutes = require("./routes/admin");
const { initReminderScheduler } = require("./services/reminderScheduler");
connectDB();
initReminderScheduler();
app.use(express.json({ extended: false }));
app.use(cors());
app.use("/api/users", require("./routes/api/users"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/contests", require("./routes/contests"));
app.use("/api/bookmarks", require("./routes/bookmarks"));
app.use("/api/reminders", remindersRoutes);
app.use("/api/admin", adminRoutes);
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
  const limiter = RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per windowMs
  });
  app.use(limiter);
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
