const { Sequelize } = require("sequelize");
require("dotenv").config(); // Load environment variables



const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: "postgres",
    port: process.env.DB_PORT || 5432,
  }
);

module.exports = sequelize;
