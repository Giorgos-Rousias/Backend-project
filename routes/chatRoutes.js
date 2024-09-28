const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/authMiddleware");
const chatController = require("../controllers/chatController");

// Routes for /chats
router.get("/", authenticateToken, chatController.getUserChats); // Get user chats
router.post("/", authenticateToken, chatController.createChat); // Create a new chat

router.get("/:chatId/messages", authenticateToken, chatController.getChatMessages); // Get chat messages
router.post("/:chatId/messages", authenticateToken, chatController.sendMessage); // Send message to chat

// Only for testing purposes
// router.get("/all", chatController.getAllChats); // Get all chats
// router.delete("/all", chatController.deleteAllChats); // Delete all chats

module.exports = router;