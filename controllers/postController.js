const db = require("../models");
const determineFileCategory = require("../middlewares/determineFileTypeMiddleware");
const { Op, fn, col } = require("sequelize");

exports.createPost = async (req, res) => {
	try {
		const { text } = req.body;
		const creatorUserId = req.user.id; // Assuming you're using authentication and have req.user
		const file = req.file ? req.file.buffer : null; // Get the photo buffer if it exists

		const fileCategory = await determineFileCategory(buffer);

		if (fileCategory) {
			// File is of a supported type
			res.status(200).json({
				message: "File uploaded successfully",
				fileCategory,
			});
		} else {
			// File type is not supported
			res.status(400).json({ error: "Unsupported file type" });
		}

		const post = await db.Post.create({creatorUserId, text, photoBuffer, file});

		res.status(201).json(post);
	} catch (error) {
		console.error("Error creating post:", error);
		res.status(500).json({ error: error.message });
	}
};

//! Πρέπει να την κάνω να επιστρέφει τα ποστ που έχει ανεβάσει ο ίδιος ο χρήστης
//! οι φίλοι του και τα ποστ στα οποία έχουν κάνει interact (like, comment)  οι φίλοι του
//! Αυτά πρέπει να γυρνάνε με την χρονολογική σειρά που έχουν αναρτηθεί αλλά να μην επιστρέφει άπειρα ποστ 
//! αλλά να έχει έναν περιορισμό μέχρι να κάνει scroll ο χρήστης
exports.getFriendsPosts = async (req, res) => {
	try {
		const user = req.user.id; // Assuming you're using authentication and have req.user

		const friends = await db.UserFriends.findAll({
			where: {
				userId: user,
			},
		});

		if (!friends) {
			return res.status(404).json({ error: "No friends found" });
		}

		const friendIds = friends.map((friend) => friend.friendId);

		const posts = await db.Post.findAll({
			where: {
				creatorUserId: friendIds,
			},
			include: {
				model: db.User,
				attributes: ["username"],
			},
		});

		if (!posts) {
			return res.status(404).json({ error: "No posts found" });
		}

		res.status(200).json(posts);
	} catch (error) {
		console.error("Error getting friends' posts:", error);
		res.status(500).json({ error: error.message });
	}
};

exports.updatePost = async (req, res) => {
	try {
		const { text } = req.body;
		const file = req.file ? req.file.buffer : null; // Get the photo buffer if it exists

		const fileType = await determineFileCategory(buffer);

		const post = await db.Post.findByPk(req.params.id);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		if (post.creatorUserId !== req.user.id) {
			return res.status(403).json({ error: "You are not authorized to update this post" });
		}

		if (fileType) {
			// File is of a supported type
			res.status(200).json({
				message: "File uploaded successfully",
				fileType,
			});
		}

		post.text = text;
		post.file = file;
		post.fileType = fileType;

		await post.save();

		res.status(200).json(post);
	} catch (error) {
		console.error("Error updating post:", error);
		res.status(500).json({ error: error.message });
	}
};

exports.deletePost = async (req, res) => {
	try {
		const post = await db.Post.findByPk(req.params.id);
		if (!post) {
		return res.status(404).json({ error: "Post not found" });
		}

		if (post.creatorUserId !== req.user.id) {
		return res.status(403).json({ error: "You are not authorized to delete this post" });
		}

		await post.destroy();
	}
	catch (error) {
		console.error("Error deleting post:", error);
		res.status(500).json({ error: error.message });
	}
};

exports.likePost = async (req, res) => {
	try {
		const post = await db.Post.findByPk(req.params.id);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const like = await db.Like.findOne({
			where: {
				userId: req.user.id,
				postId: post.id,
			},
		});

		if (like) {
			return res.status(400).json({ error: "You have already liked this post" });
		}

		await db.Like.create({
			userId: req.user.id,
			postId: post.id,
		});

		res.status(200).json({ message: "Post liked successfully" });
	} catch (error) {
		console.error("Error liking post:", error);
		res.status(500).json({ error: error.message });
	}
};

exports.removeLike = async (req, res) => {
	try {
		const post = await db.Post.findByPk(req.params.id);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const like = await db.Like.findOne({
			where: {
				userId: req.user.id,
				postId: post.id,
			},
		});

		if (!like) {
			return res.status(400).json({ error: "You have not liked this post" });
		}

		await like.destroy();

		res.status(200).json({ message: "Like removed successfully" });
	} catch (error) {
		console.error("Error removing like:", error);
		res.status(500).json({ error: error.message });
	}
};

exports.createComment = async (req, res) => {
	try {
		const { text } = req.body;

		const post = await db.Post.findByPk(req.user.id);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}


		const comment = await db.Comment.create({
			userId: req.user.id,
			postId: post.id,
			text,
		});

		res.status(201).json(comment);
	} catch (error) {
		console.error("Error creating comment:", error);
		res.status(500).json({ error: error.message });
	}
};

exports.deleteComment = async (req, res) => {
	try {
		const comment = await db.Comment.findByPk(req.params.id);
		if (!comment) {
			return res.status(404).json({ error: "Comment not found" });
		}

		if (comment.userId !== req.user.id) {
			return res.status(403).json({ error: "You are not authorized to delete this comment" });
		}

		await comment.destroy();

		res.status(200).json({ message: "Comment deleted successfully" });
	} catch (error) {
		console.error("Error deleting comment:", error);
		res.status(500).json({ error: error.message });
	}
}

//For testing purposes
exports.getAllPosts = async (req, res) => {
	try {
		const posts = await db.Post.findAll({
			attributes: {
				include: [
				// Count the number of likes
				[fn('COUNT', col('Likes.id')), 'likesCount'],
				// Count the number of comments
				[fn('COUNT', col('Comments.id')), 'commentsCount']
				]
			},
			include: [{
					model: db.Like,
					as: 'Likes',
					attributes: [] // We don't need any attributes from the Like model
				}, {
					model: db.Comment,
					as: 'Comments',
					attributes: [] // We don't need any attributes from the Comment model
				}
			],
			group: ['Post.id'] // Group by Post ID to aggregate likes and comments per post
		});

		res.status(200).json(posts);
	} catch (error) {
		console.error("Error getting all posts:", error);
		res.status(500).json({ error: error.message });
	}
};
