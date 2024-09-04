// sync.js
const db = require("./models");

const syncDatabase = async () => {
  try {
    await db.sequelize.sync({ force: true }); // Use `{ force: true }` to recreate tables
    console.log("Database synchronized");
  } catch (error) {
    console.error("Unable to synchronize the database:", error);
  } finally {
    await db.sequelize.close();
  }
};

syncDatabase();
