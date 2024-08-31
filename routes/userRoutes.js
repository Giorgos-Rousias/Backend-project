// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Route to get all users
router.get("/", userController.getAllUsers);

// Route to get all users without photo
router.get("/noPhoto", userController.getUsersWithoutPhoto);

const authenticateToken = require("../middlewares/authMiddleware");

router.get("/:id", authenticateToken, userController.getUserProfile);



module.exports = router;
