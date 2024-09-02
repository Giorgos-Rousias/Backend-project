// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Route to get all users

// Route to get all users without photo
router.get("/noPhoto", userController.getUsersWithoutPhoto);

const authenticateToken = require("../middlewares/authMiddleware");

router.get("/", authenticateToken, userController.getAllUsers);
router.get("/xml", authenticateToken, userController.exportUsersXML);
router.get("/json", authenticateToken, userController.exportUsersJSON);
router.get("/:id/", authenticateToken, userController.getUserProfile);

router.put("/change-password", authenticateToken, userController.changePassword);
router.put("/change-email", authenticateToken, userController.changeEmail);

module.exports = router;
