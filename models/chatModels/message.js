const { DataTypes } = require("sequelize");
const sequelize = require("../../sequelize");
const Chat = require("./chat");

const Message = sequelize.define(
    "Message",
    {
        chatId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    }, {
        timestamps: true
    }
);

Message.afterCreate(async (message, options) => {
    try {
        const chat = await Chat.findByPk(message.chatId);

        if (!chat) {
            throw new Error("Chat not found");
        }

        await chat.update({
            lastMessage: message.content,
        });
    } catch(error) {
        console.error("Error creating message:", error);
    }
});

module.exports = Message;