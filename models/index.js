// models/index.js

const sequelize = require("../sequelize");
const User = require("./user"); // Import the user model

const db = {
  sequelize,
  User,
  // Add other models here if needed
};

module.exports = db;
