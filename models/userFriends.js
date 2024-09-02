const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");
const User = require("./user");

// Define the UserFriends junction table
const UserFriends = sequelize.define("UserFriends", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: "id",
    },
    onDelete: "CASCADE",
  },
  friendId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: "id",
    },
    onDelete: "CASCADE",
  },
  status: {
    type: DataTypes.STRING, // E.g., 'pending', 'accepted', 'rejected'
    defaultValue: "pending", // Default to 'pending' when a request is made
    validate: {
      isIn: [["pending", "accepted"]],
    },
  },
});

module.exports = UserFriends;
