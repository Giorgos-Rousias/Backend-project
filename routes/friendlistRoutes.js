const express = require("express");
const router = express.Router();

const friendlistController = require("../controllers/friendlistController");

// Middleware
const authenticateToken = require("../middlewares/authMiddleware");

router.post("/sendRequest", authenticateToken, friendlistController.sendFriendRequest);
router.get("/getPendingRequests", authenticateToken, friendlistController.getPendingRequests);
router.post("/respondToRequest", authenticateToken, friendlistController.respondToFriendRequest);

router.delete("/removeFriend", authenticateToken, friendlistController.removeFriend);
router.get("/getFriends", authenticateToken, friendlistController.getFriends);
router.get("/getSentRequests",authenticateToken, friendlistController.getPendingRequestsSend
);

router.get("/getAll", friendlistController.getAllFriends);

module.exports = router;
