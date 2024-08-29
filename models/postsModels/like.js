const { DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const Like = sequelize.define("Like", {
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
});

module.exports = Like;