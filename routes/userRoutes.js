// routes/userRoutes.js
const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

// Route to get all users
router.get("/", userController.getAllUsers);

// Route to get all users without photo
router.get("/noPhoto", userController.getUsersWithoutPhoto);

module.exports = router;
