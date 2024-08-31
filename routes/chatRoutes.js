const express = require("express");
const router = express.Router();

const chatController = require("../controllers/chatController");

// Middleware
const authenticateToken = require("../middlewares/authMiddleware");

router.post("/createChat", authenticateToken, chatController.createChat);
router.post("/:chatId/sendMessage", authenticateToken, chatController.sendMessage);

router.get("/getAllChats", chatController.getAllChats);
router.delete("/deleteChats", chatController.deleteChats);

module.exports = router;