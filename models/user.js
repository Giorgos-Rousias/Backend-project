// models/user.js

const { DataTypes } = require("sequelize");
const sequelize = require("./index"); // Import sequelize instance

const User = sequelize.define("User", {
  firstName: {
    type: DataTypes.STRING,
    allowNull: false, // This field cannot be null
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false, // This field cannot be null
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false, // This field cannot be null
    unique: true, // This field must be unique
  },
});

module.exports = User;
