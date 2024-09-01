const db = require("../models");
const { Op } = require("sequelize");

exports.createChat = async (req, res) => {
    try {
        if (!req.body.friendId) {
            return res.status(400).json({ message: "Friend ID is required" });
        }

        if (req.user.id === req.body.friendId) {
            return res.status(400).json({ message: "You cannot create a chat with yourself" });
        }

        const user = await db.User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const friend = await db.User.findByPk(req.body.friendId);
        if (!friend) {
            return res.status(404).json({ message: "Friend not found" });
        }

        const friendship = await db.UserFriends.findOne({
            where: {
                userId: user.id,
                friendId: friend.id,
                status: "accepted",
            }
        });

        if (!friendship) {
            return res.status(400).json({ message: "You must be friends to create a chat" });
        }

        const chat = await db.Chat.findOne({
            where: {
                userId1: user.id,
                userId2: friend.id,
            }
        });

        if (chat) {
            return res.status(400).json({ message: "Chat already exists" });
        }

        const newChat = await db.Chat.create({
                userId1: user.id,
                userId2: friend.id,
        })

        if (!newChat) {
            return res.status(500).json({ message: "Error creating chat" });
        }

        res.status(200).json({ message: "Chat created successfully"});
    } catch(error) {
        console.error("Error creating chat:", error);
        res.status(500).json({ error: error.message });
    }
};

// Send message to chat by chat ID and user ID
exports.sendMessage = async (req, res) => {
    try {

        if (!req.params.chatId) {
            return res.status(400).json({ message: "Chat ID required" });
        }

        if (!req.body.content) {
            return res.status(400).json({ message: "Content required" });
        }

        const chat = await db.Chat.findByPk(req.params.chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        if (chat.userId1 !== req.user.id && chat.userId2 !== req.user.id) {
            return res.status(403).json({ message: "You are not authorized to send messages in this chat" });
        }

        const message = await db.Message.create({
            chatId: chat.id,
            userId: req.user.id,
            content: req.body.content,
        });

        if (!message) {
            return res.status(500).json({ message: "Error sending message" });
        }

        res.status(201).json(message);
    }
    catch(error) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: error.message });
    };
};

// Get chat messages by chat ID
exports.getChatMessages = async (req, res) => {
    try {
        if (!req.params.chatId) {
            return res.status(400).json({ message: "Chat ID required" });
        }

        const chat = await db.Chat.findByPk(req.params.chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        if (chat.userId1 !== req.user.id && chat.userId2 !== req.user.id) {
            return res.status(403).json({ message: "You are not authorized to view this chat" });
        }

        const before = req.body.before ? new Date(req.body.before) : new Date();

        const messages = await db.Message.findAll({
            where: {
                chatId: chat.id,
                createdAt: {
                    [Op.lt]: new Date(before),
                },
            },
            attributes: { exclude: ["chatId", "id", "updatedAt"] },
            order: [
                ["createdAt", "ASC"],
            ],
            limit: 20,
        });

        res.status(200).json(messages);
    } catch (error) {
        console.error("Error getting chat:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get all chats of the user by userId in the jwt token
exports.getUserChats = async (req, res) => {
    try {
        const before = req.body.before ? new Date(req.body.before) : new Date();

        const chats = await db.Chat.findAll({
            where: {
                [Op.or]: [
                    { userId1: req.user.id },
                    { userId2: req.user.id },
                ],
                updatedAt: {
                    [Op.lt]: new Date(before),
                },
            },
            order: [["updatedAt", "DESC"]],
            limit: 5,
        });

        if (!chats) {
            return res.status(404).json({ message: "Chats not found" });
        }

        res.status(200).json(chats);
    } catch (error) {
        console.error("Error getting users chats:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get all chats
exports.getAllChats = async (req, res) => {
    try {
        const chats = await db.Chat.findAll();
        // const chats = await db.Chat.findOne();
        res.status(200).json(chats);
    } catch (error) {
        console.error("Error getting all chats:", error);
        res.status(500).json({ error: error.message });
    }
};

// Deletes all chats created for every user
exports.deleteAllChats = async (req, res) => {
    try {
        const chats = await db.Chat.findAll();
        if (!chats) {
            return res.status(404).json({ message: "Chat not found" });
        }

        chats.forEach(async (chat) => {
            await chat.destroy();
        });

        res.status(204).end();
    } catch (error) {
        console.error("Error deleting chat:", error);
        res.status(500).json({ error: error.message });
    }
}