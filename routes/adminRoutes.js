const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/authMiddleware");
const adminController = require("../controllers/adminController");

router.post("/dummy", authenticateToken, adminController.dummyDataGenerator); // Create dummy data for testing purposes

module.exports = router;
