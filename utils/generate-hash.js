// generate-hash.js
const bcrypt = require("bcrypt");
const readline = require("readline");

// Create a readline interface to take password input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter the password to hash: ", async (password) => {
  try {
    const hashed = await bcrypt.hash(password, 10); // 10 salt rounds
    console.log("\n✅ Generated bcrypt hash:");
    console.log(hashed);
  } catch (err) {
    console.error("❌ Error generating hash:", err);
  } finally {
    rl.close();
  }
});
