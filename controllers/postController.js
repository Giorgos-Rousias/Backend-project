const db = require("../models");
const determineFileCategory = require("../middlewares/determineFileTypeMiddleware");
const { Op, fn, col } = require("sequelize");

exports.createPost = async (req, res) => {
	try {
		const { text } = req.body;
		const creatorUserId = req.user.id; // Assuming you're using authentication and have req.user
		const file = req.file ? req.file.buffer : null; // Get the photo buffer if it exists

		if (!text && !file) {
			return res.status(400).json({ error: "You must provide text or a file to create a post" });
		}

		postBody = {creatorUserId, text};
		if (file){
			const fileType = await determineFileCategory(req.file.originalname);

			if (fileType == null) {
				// File type is not supported
				res.status(400).json({ error: "Unsupported file type" });
			}
			potBody = {creatorUserId, text, file, fileType};
		}
		await db.Post.create(postBody);

		res.status(200).json("Post created successfully");
	} catch (error) {
		console.error("Error creating post:", error);
		res.status(500).json({ error: error.message });
	}
};


// exports.getFriendsPosts = async (req, res) => {
// 	try {
// 		const user = req.user.id; // Assuming you're using authentication and have req.user

// 		const friends = await db.UserFriends.findAll({
// 			where: {
// 				userId: user,
// 			},
// 		});

// 		if (!friends) {
// 			return res.status(404).json({ error: "No friends found" });
// 		}

// 		const friendIds = friends.map((friend) => friend.friendId);

// 		const posts = await db.Post.findAll({
// 			where: {
// 				creatorUserId: friendIds,
// 			},
// 			include: {
// 				model: db.User,
// 				attributes: ["username"],
// 			},
// 		});

// 		if (!posts) {
// 			return res.status(404).json({ error: "No posts found" });
// 		}

// 		res.status(200).json(posts);
// 	} catch (error) {
// 		console.error("Error getting friends' posts:", error);
// 		res.status(500).json({ error: error.message });
// 	}
// };

exports.getUserSuggestedPosts = async (req, res) => {
	try {
		const userId = req.user.id;

		const numberOfPosts = req.body.numberOfPosts ? req.body.numberOfPosts : 3; // Default to 10 posts
		const date = req.body.lastPostDate ? new Date(req.body.lastPostDate) : new Date(); // Default to current date

		let suggestedPosts = [];

		const user = await db.User.findByPk(userId);

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Get the user's posts
		const userPosts = await db.Post.findAll({
			where: {
				creatorUserId: userId,
				createdAt: {
					[Op.lt]: date,
				},
			},
			order: [["createdAt", "DESC"]],
		});

		suggestedPosts = suggestedPosts.concat(userPosts);

		const friends = await db.UserFriends.findAll({
			where: {
				userId: userId,
			},
		});

		if (friends) {
			const friendIds = friends.map((friend) => friend.friendId);

			const friendPosts = await db.Post.findAll({
				where: {
					creatorUserId: friendIds,
					createdAt: {
						[Op.lt]: date,
					},
				},
				include: {
					model: db.User,
					attributes: ["name", "surname"],
				},
				order: [["createdAt", "DESC"]],
				limit: numberOfPosts,
			});

			suggestedPosts = suggestedPosts.concat(friendPosts);

			const friendLikedPosts = await db.Post.findAll({
				include: [{
					model: db.Like,
					where: {
						userId: friendIds,
					},
					required: true,
					attributes: [],
				}, {
					model: db.User,
					attributes: ["name", "surname"],
				}],
				where: {
					createdAt: {
						[Op.lt]: date,
				}},
				order: [["createdAt", "DESC"]],
				limit: numberOfPosts,
			});

			suggestedPosts = suggestedPosts.concat(friendLikedPosts);

			const friendCommentedPosts = await db.Post.findAll({
				include: [{
					model: db.Comment,
					where: {
						userId: friendIds,
					},
					required: true,
					attributes: [],
				}, {
					model: db.User,
					attributes: ["name", "surname"],
				}],
				where: {
					createdAt: {
						[Op.lt]: date,
				}},
				order: [["createdAt", "DESC"]],
				limit: numberOfPosts,
			});

			suggestedPosts = suggestedPosts.concat(friendCommentedPosts);
		}

		suggestedPosts.sort((a, b) => b.createdAt - a.createdAt);
		suggestedPosts = suggestedPosts.slice(0, numberOfPosts);

		res.status(200).json(suggestedPosts);

	} catch (error) {
		console.error("Error getting suggested posts:", error);
		res.status(500).json({ error: error.message });
	}
};


exports.updatePost = async (req, res) => {
	try {
		const post = await db.Post.findByPk(req.params.id);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const { text } = req.body;
		const file = req.file ? req.file.buffer : null; // Get the photo buffer if it exists
		
		if (!text && !file) {
			return res.status(400).json({ error: "You must provide text or a file to update a post" });
		}

		const fileType = await determineFileCategory(req.file.originalname);

		if (post.creatorUserId !== req.user.id) {
			return res.status(403).json({ error: "You are not authorized to update this post" });
		}

		if (fileType == null) {
			res.status(400).json({ error: "Unsupported file type" });
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
		res.status(200).json({ message: "Post deleted successfully" });
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

		const post = await db.Post.findByPk(req.params.id);
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
		const post = await db.Post.findByPk(req.params.id);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const comment = await db.Comment.findOne({where: { id: req.params.commentId, postId: req.params.id }});

		if (comment == null) {
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

// Get all comments for a specific post
exports.getPostsComments = async (req, res) => {
	try {
		const post = await db.Post.findByPk(req.params.id);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const comments = await db.Comment.findAll({
			where: {
				postId: post.id,
			}
		});

		res.status(200).json(comments);
	} catch (error) {
		console.error("Error getting post comments:", error);
		res.status(500).json({ error: error.message });
	}
};

// For testing purposes
exports.getAllPosts = async (req, res) => {
	try {
		const posts = await db.Post.findAll({
			attributes: {
				exclude: ["file"],
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
