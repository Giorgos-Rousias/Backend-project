const { DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");

const Message = sequelize.define(
    "Message",
    {
        chatId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        content: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    }, {
        timestamps: true
    }
);

module.exports = Message;