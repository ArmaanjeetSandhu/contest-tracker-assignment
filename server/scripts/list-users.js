const mongoose = require("mongoose");
const config = require("config");
const User = require("../models/User");
async function listUsers() {
  try {
    await mongoose.connect(config.get("mongoURI"), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected");
    const users = await User.find().select("-password");
    console.log("\n===== ALL USERS =====\n");
    users.forEach((user) => {
      console.log(`ID: ${user._id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Created: ${user.date}`);
      console.log("------------------------\n");
    });
    const adminCount = users.filter((u) => u.role === "admin").length;
    const regularCount = users.filter((u) => u.role === "user").length;
    console.log(`Total users: ${users.length}`);
    console.log(`Admins: ${adminCount}`);
    console.log(`Regular users: ${regularCount}`);
    await mongoose.disconnect();
    console.log("MongoDB Disconnected");
  } catch (err) {
    console.error("Error:", err.message);
  }
}
listUsers();
