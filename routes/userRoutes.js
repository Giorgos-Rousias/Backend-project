// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Route to get all users
router.get("/", userController.getAllUsers);

// Route to get all users without photo
router.get("/noPhoto", userController.getUsersWithoutPhoto);

const authenticateToken = require("../middlewares/authMiddleware");

router.put("/change-password", authenticateToken, userController.changePassword);
router.put("/change-email", authenticateToken, userController.changeEmail);
router.get("/:id/profile", authenticateToken, userController.getUserProfile);



module.exports = router;
