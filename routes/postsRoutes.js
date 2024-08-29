const express = require("express");
const router = express.Router();
const uploadMiddleware = require("../middlewares/uploadMiddleware");

const postController = require("../controllers/postController");

const authenticateToken = require("../middlewares/authMiddleware");

app.post( "/posts", authenticateToken, uploadMiddleware.single("file"), postController.createPost);


module.exports = router;
