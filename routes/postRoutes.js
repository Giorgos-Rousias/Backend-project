const express = require("express");
const router = express.Router();
const uploadMiddleware = require("../middlewares/uploadMiddleware");

const postController = require("../controllers/postController");

const authenticateToken = require("../middlewares/authMiddleware");
router.get("/", authenticateToken, postController.getUserSuggestedPosts); 

router.post( "/", authenticateToken, uploadMiddleware.single("file"), postController.createPost);
// router.put( "/:id/post", authenticateToken, postController.updatePost); // unused
// router.delete( "/:id/post", authenticateToken, postController.deletePost); // unused

router.post( "/:id/like", authenticateToken, postController.likePost);
router.delete( "/:id/like", authenticateToken, postController.removeLike);

router.post( "/:id/comment", authenticateToken, postController.createComment);
// router.delete( "/:id/:commentId/comment", authenticateToken, postController.deleteComment); // unused

router.get( "/:id/comments", authenticateToken, postController.getPostsComments);

//! For testing purposes
// router.get( "/get", postController.getAllPosts);

module.exports = router;
