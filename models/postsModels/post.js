const { DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const Post = sequelize.define("Post", {
  creatorUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "Users", // Reference to the User model
      key: "id",
    },
    onDelete: "CASCADE",
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  file: {
    type: DataTypes.BLOB("long"), // Use "long" for large files
    allowNull: true,
  },
  fileType: {
    type: DataTypes.ENUM("photo", "video", "audio"),
    allowNull: true,
  }
});

module.exports = Post;