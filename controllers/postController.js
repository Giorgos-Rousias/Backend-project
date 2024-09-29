const db = require("../models");
const determineFileCategory = require("../middlewares/determineFileTypeMiddleware");
const { Op, fn, col } = require("sequelize");
const createNotification = require("./notificationController").createNotification;

exports.createPost = async (req, res) => {
	try {
		const { text } = req.body;
		const creatorUserId = req.user.id;

		const user = await db.User.findByPk(creatorUserId);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		const file = req.file ? req.file.buffer : null; // Get the photo buffer if it exists

		if (!text && !file) {
			return res.status(400).json({ error: "You must provide text or a file to create a post" });
		}

		postBody = {creatorUserId, text};
		if (file){
			const fileType = await determineFileCategory(req.file);

			if (fileType === null) {
				// File type is not supported
				return res.status(400).json({ error: "Unsupported file type" });
			}

			postBody = {creatorUserId, text, file, fileType};
		}
		const post = await db.Post.create(postBody);

		let returnFile = null;
		if (post.file) {
			if (post.fileType === "video") {
				returnFile = `data:video/mp4;base64,${post.file.toString('base64')}`;
			} else if (post.fileType === "audio") {
				returnFile = `data:audio/mp3;base64,${post.file.toString('base64')}`;
			} else {
				returnFile = `data:image/jpeg;base64,${post.file.toString('base64')}`;
			}
		}
	
		const response = {
			id: post.id,
			text,
			file: returnFile,
			fileType: postBody.fileType,
			firstName: user.firstName,
			lastName: user.lastName,
			photo: user.photo ? `data:image/jpeg;base64,${user.photo.toString('base64')}` : null,
		};

		res.status(200).json(response);
	} catch (error) {
		console.error("Error creating post:", error);
		res.status(500).json({ error: error.message });
	}
};

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
			include: {
				model: db.User,
				attributes: ["firstName", "lastName", "photo"],
			},
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
					attributes: ["firstName", "lastName" , "photo"],
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
					attributes: ["firstName", "lastName" , "photo"],
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
					attributes: ["firstName", "lastName" , "photo"],
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

		// Remove duplicates
		suggestedPosts = suggestedPosts.filter((post, index, self) => 
			index === self.findIndex((p) => p.id === post.id)
		);

		suggestedPosts.sort((a, b) => b.createdAt - a.createdAt);
		suggestedPosts = suggestedPosts.slice(0, numberOfPosts);

		const returnPosts = suggestedPosts.map((post) => {
			let returnFile = null;
			if (post.file) {
				if (post.fileType === "video") {
					returnFile = `data:video/mp4;base64,${post.file.toString('base64')}`;
				} else if (post.fileType === "audio") {
					returnFile = `data:audio/mp3;base64,${post.file.toString('base64')}`;
				} else {
					returnFile = `data:image/jpeg;base64,${post.file.toString('base64')}`;
				}
			}

			// Process the user photo the same way
			const returnUserPhoto = post.User.photo
				? `data:image/jpeg;base64,${post.User.photo.toString('base64')}`
				: null;
			
			return {
				id: post.id,
				text: post.text,
				fileType: post.fileType,  // The fileType should be something like 'image', 'video', or 'audio'
				file: returnFile,         // The base64 data URI for the media file
				userId: post.User.id,
				firstName: post.User.firstName,
				lastName: post.User.lastName,
				photo: returnUserPhoto,   // The base64 data URI for the user's profile photo
			};
		});

		res.status(200).json(returnPosts);

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
		const user = await db.User.findByPk(req.user.id);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

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

		const newLike = await db.Like.create({
			userId: req.user.id,
			postId: post.id,
		});
		
		// Create a notification for the post creator
		await createNotification(
			post.creatorUserId,
			"like",
			newLike.id,
			`${user.firstName} ${user.lastName} liked your post`,
		);

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
		const user = await db.User.findByPk(req.user.id);
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		console.log(user);

		if (!req.body.text) {
			return res.status(400).json({ error: "You must provide text to create a comment" });
		}
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

		// Create a notification for the post creator
		await createNotification(
			post.creatorUserId,
			"comment",
			comment.id,
			`${user.firstName} ${user.lastName} commented on your post`,
		);

		const response = {
			id: comment.id,
			postId: comment.postId,
			text: comment.text,
			firstName: user.firstName,
			lastName: user.lastName,
			photo: user.photo ? `data:image/jpeg;base64,${user.photo.toString('base64')}` : null,
		};

		res.status(201).json(response);
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
			},
			include: {
				model: db.User,
				attributes: ["firstName", "lastName", "photo"],
			},
		});

		const commentsWithBase64Photo = comments.map(comment => {
			if (comment.User && comment.User.photo) {
				// Check if photo is a buffer
				const photoBase64 = `data:image/jpeg;base64,${comment.User.photo.toString('base64')}`;
				return {
					...comment.toJSON(), // Convert Sequelize instance to a plain object
					User: {
						...comment.User.toJSON(), // Convert User instance to a plain object
						photo: photoBase64, // Add the base64 encoded photo
					},
				};
			}
			return comment; // Return as-is if there's no photo
		});

		res.status(200).json(commentsWithBase64Photo);
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
			group: ['Post.id'], // Group by Post ID to aggregate likes and comments per post
			order: [['createdAt', 'DESC']],
		});

		res.status(200).json(posts);
	} catch (error) {
		console.error("Error getting all posts:", error);
		res.status(500).json({ error: error.message });
	}
};
