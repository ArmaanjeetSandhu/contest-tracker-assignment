const mongoose = require("mongoose");
const config = require("config");
const connectDB = async () => {
  try {
    let mongoURI;
    try {
      mongoURI = config.get("mongoURI");
    } catch (err) {
      mongoURI = process.env.MONGO_URI;
    }
    if (!mongoURI) {
      console.error(
        "FATAL ERROR: MongoDB URI is not defined. Check your config/default.json file or MONGO_URI environment variable."
      );
      process.exit(1);
    }
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    mongoose.connection.on("error", (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });
    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected, attempting to reconnect...");
    });
    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
    });
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed due to app termination");
      process.exit(0);
    });
    return conn;
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    if (err.name === "MongoNetworkError") {
      console.error(
        "Network error connecting to MongoDB. Check your connection string and network settings."
      );
    } else if (err.name === "MongoServerSelectionError") {
      console.error(
        "Could not select MongoDB server. Check that your MongoDB instance is running."
      );
    }
    process.exit(1);
  }
};
module.exports = connectDB;
