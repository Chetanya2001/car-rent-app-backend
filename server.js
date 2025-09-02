const express = require("express");
const dotenv = require("dotenv");
const db = require("./models");

dotenv.config();
const app = express();
app.use(express.json());

// Routes
app.get("/", (req, res) => res.send("Car Rental API Running 🚗"));

// Sync DB
db.sequelize.sync({ force: false }).then(() => {
  console.log("✅ Database synced");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
