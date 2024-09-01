const { DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const Chat = sequelize.define(
    "Chat",
    {
        userId1: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        userId2: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        lastMessage: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    }, {
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['userId1', 'userId2'], // This ensures the combination of userId1 and userId2 is unique
            },
        ],
    }
);

module.exports = Chat;