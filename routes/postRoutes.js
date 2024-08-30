const express = require("express");
const router = express.Router();
const uploadMiddleware = require("../middlewares/uploadMiddleware");

const postController = require("../controllers/postController");

const authenticateToken = require("../middlewares/authMiddleware");

router.post( "/createPost", authenticateToken, uploadMiddleware.single("file"), postController.createPost);
router.put( "/:id/updatePost", authenticateToken, postController.updatePost);
router.delete( "/:id/deletePost", authenticateToken, postController.deletePost);

router.post( "/:id/likePost", authenticateToken, postController.likePost);
router.delete( "/:id/unLikePost", authenticateToken, postController.removeLike);

router.post( "/:id/comment", authenticateToken, postController.createComment);
router.delete( "/:id/:commentId/deleteComment", authenticateToken, postController.deleteComment);

router.get( "/:id/getPostsComments", authenticateToken, postController.getPostsComments);

//! For testing purposes
router.get( "/get", postController.getAllPosts);

module.exports = router;
