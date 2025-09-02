const db = require("./models");

db.sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("✅ All tables created successfully!");
    process.exit();
  })
  .catch((err) => {
    console.error("❌ Error creating tables:", err);
    process.exit(1);
  });
