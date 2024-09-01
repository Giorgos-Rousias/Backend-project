const express = require("express");
const router = express.Router();

const friendlistController = require("../controllers/friendlistController");

// Middleware
const authenticateToken = require("../middlewares/authMiddleware");

// Routes 
router.get("/", authenticateToken, friendlistController.getFriends); // get user's friends
router.delete("/", authenticateToken, friendlistController.removeFriend); // remove a friend

router.post("/request", authenticateToken, friendlistController.sendFriendRequest); // send a friend request
router.get("/request", authenticateToken, friendlistController.getPendingRequests); // get user's pending requests
router.get("/request/send",authenticateToken, friendlistController.getPendingRequestsSend); // get user's sent requests
router.post("/request/response", authenticateToken, friendlistController.respondToFriendRequest); // respond to a friend request

// For testing purposes
router.get("/friends/all", friendlistController.getAllFriends); // get all friends regardless of user

module.exports = router;
