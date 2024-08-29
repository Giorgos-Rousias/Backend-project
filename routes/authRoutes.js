const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const uploadMiddleware = require("../middlewares/uploadMiddleware");

router.post("/register", uploadMiddleware.single("photo"), authController.register);
router.post("/login", authController.login);

module.exports = router;
