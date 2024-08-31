const db = require("../models");

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

        res.status(201).json(chat);
    } catch(error) {
        console.error("Error creating chat:", error);
        res.status(500).json({ error: error.message });
    }
};

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
            senderId: req.user.id,
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

exports.getChat = async (req, res) => {};

exports.getAllChats = async (req, res) => {
    try {
        const chats = await db.Chat.findAll(
        );
        res.status(200).json(chats);
    } catch (error) {
        console.error("Error getting all chats:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteChats = async (req, res) => {
    try {
        const chat = await db.Chat.findOne();
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        await chat.destroy();
        res.status(204).end();
    } catch (error) {
        console.error("Error deleting chat:", error);
        res.status(500).json({ error: error.message });
    }
}