const bcrypt = require("bcryptjs");
async function generateHash(password) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log("Your hashed password is:");
    console.log(hash);
  } catch (err) {
    console.error("Error generating hash:", err);
  }
}
generateHash("your_secure_password");
