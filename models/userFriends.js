const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");
const User = require("./user");

// Define the UserFriends junction table
const UserFriends = sequelize.define("UserFriends", {
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
    defaultValue: "accepted", // Optional status for friend requests
  },
});

module.exports = UserFriends;
