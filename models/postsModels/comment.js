const { DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const Comment = sequelize.define("Comment", {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Users", // Reference to the User model
            key: "id",
        },
        onDelete: "CASCADE",
    },
    postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "Posts", // Reference to the Post model
            key: "id",
        },
        onDelete: "CASCADE",
    },
    text: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
});

module.exports = Comment;