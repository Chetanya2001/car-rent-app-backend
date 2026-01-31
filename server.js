const express = require("express");

const dotenv = require("dotenv");
const cors = require("cors");
const db = require("./models");
const routes = require("./routes");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => res.send("Car Rental API Running 🚗"));
app.use("/api", routes);
// Sync DB
require("./jobs/pickupOTP.job");
require("./jobs/dropOTP.jobs");
db.sequelize.sync({ force: false }).then(() => {
  console.log("✅ Database synced");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on port ${PORT}`),
);
