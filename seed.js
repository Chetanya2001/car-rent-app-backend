const sequelize = require("./models").sequelize;
const seedService = require("./seeders/service.seed");

async function runSeeds() {
  try {
    await sequelize.sync(); // ensure tables exist

    await seedService();

    console.log("🌱 All seeds executed successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

runSeeds();
