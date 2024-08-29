// sync.js
const db = require("./models");

// // Define associations
// db.User.hasMany(db.Education, { foreignKey: "userId", as: "education" });
// db.Education.belongsTo(db.User, { foreignKey: "userId", as: "user" });

// db.User.hasMany(db.Experience, { foreignKey: "userId", as: "experience" });
// db.Experience.belongsTo(db.User, { foreignKey: "userId", as: "user" });

// db.User.hasMany(db.Skill, { foreignKey: "userId", as: "skills" });
// db.Skill.belongsTo(db.User, { foreignKey: "userId", as: "user" });

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
