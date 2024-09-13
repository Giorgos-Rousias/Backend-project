const db = require("../models");
const determineFileCategory = require("../middlewares/determineFileTypeMiddleware");
const { Op, fn, col } = require("sequelize");
const createNotification = require("./notificationController").createNotification;
const { faker } = require('@faker-js/faker');
const bcrypt = require("bcryptjs");

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
			index === self.findIndex((p) => p.id === post.id)  // Assuming `id` is the unique property
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




exports.dummyDataGenerator = async (req, res) => {
	try {
		const hashedPassword = await bcrypt.hash("1234", 10); 
		
		const newUsers = 50;
		for (let i = 0; i < newUsers; i++) {
			await db.User.create({
				firstName: faker.person.firstName(),
				lastName: faker.person.lastName(),
				email: faker.internet.email(),
				password: hashedPassword, // Ensure this is the resolved hashed password
				phoneNumber: '1234567890',
				photo: null,
				hasPhoto: false,
			});
		}

		const users = await db.User.findAll({
			where: {
				isAdmin: false
			},
		})
		// console.log("Ids ussers are: ", count)
		// const idsUsers = count - newUsers;
		// const usersLength = users.length;
		// console.log(users.length);
		console.log("Users are: ", users.length);

		await users.forEach((user) => {
			console.log("User is: ", user.id);

			function getRandomNumbersWithDuplicatesRemoved(count, min, max, excludeId) {
				const numbers = [];

				// Generate random numbers, excluding excludeId
				for (let i = 0; i < count; i++) {
					let randomNum;
					do {
						randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
					} while (randomNum === excludeId); // Ensure excludeId is not added
					numbers.push(randomNum);
				}

				// Remove duplicates by converting to a Set and back to an Array
				const uniqueNumbers = Array.from(new Set(numbers));

				return uniqueNumbers;
			}

			// Create Friends
			let maxFriends = 5;
			let minFriends = 1;
			const randomNumFriends = Math.floor(Math.random() * (maxFriends - minFriends + 1)) + minFriends;
			console.log("Got here 1", user.id);
			const randomUsers = getRandomNumbersWithDuplicatesRemoved(randomNumFriends, 2, users.length, user.id);
			console.log("Got here 2", user.id);

			const createFriends = async (userId) => {
				try {
					for (const id of randomUsers) {
					console.log("Got here 3", userId);

					const isFriends = await db.UserFriends.findOne({
						where: {
						userId: id,
						friendId: userId
						}
					}) || await db.UserFriends.findOne({
						where: {
						userId: userId,
						friendId: id
						}
					});

					console.log("isFriends", isFriends);

					// If friendship already exists, skip creating
					if (isFriends !== null) {
						console.log("Got here 3.1", userId);
						console.log("isFriends", isFriends);
						continue; // Skip to the next user
					}

					// Create new friendship entries for both directions
					await db.UserFriends.create({
						userId: userId,
						friendId: id,
						status: "accepted"
					});

					await db.UserFriends.create({
						userId: id,
						friendId: userId,
						status: "accepted"
					});

					console.log("Got here 4", userId);
					}
				} catch (error) {
					console.log("Error creating friends: ", error);
				}
				};

			createFriends(user.id);

			console.log("Go here ", user.id);
			
			// Create posts
			// let maxPost = 5;
			// let minPost = 0;
			// const randomNumPosts = Math.floor(Math.random() * (maxPost - minPost + 1)) + minPost;
			// const randomPosts = getRandomNumbersWithDuplicatesRemoved(randomNumPosts, 0, 79, -1);

			// randomPosts.forEach(async (id)=>{
			// 	await db.Post.create({
			// 		creatorUserId: user.id,
			// 		text: postTexts[id]
			// 	})		
			// })
			/*// await db.Post.create({
			// 	creatorUserId: user.id,
			// 	text: "text"
			// })*/

			// Create Likes
			// const posts = await db.Post.findAll();
			// let maxLikes = 5;
			// let minLikes = 1;
			// const randomNumLikes = Math.floor(Math.random() * (maxLikes - minLikes + 1)) + minLikes;
			// const randomLikes = getRandomNumbersWithDuplicatesRemoved(randomNumLikes, 1, posts.length, -1);

			// randomLikes.forEach(async (id)=>{
			// 	await db.Like.create({
			// 		userId: user.id,
			// 		postId: id
			// 	})
			// })
			/*// await db.Like.create({
			// 	userId: user.id,
			// 	postId: 1
			// })*/

			// Create Comments
			// let maxComments = 5;
			// let minComments = 1;
			// const randomNumComments = Math.floor(Math.random() * (maxComments - minComments + 1)) + minComments;
			// const randomCommnents = getRandomNumbersWithDuplicatesRemoved(randomNumComments, 1, posts.length, -1);
			// await randomCommnents.forEach(async (id)=>{
			// 	await db.Comment.create({
			// 		userId: user.id,
			// 		postId: 1,
			// 		text: "No importance"
			// 	})
			// })			
			/*// await db.Comment.create({
			// 	userId: user.id,
			// 	postId: 1
			// })*/

			/*// await db.Like.findOne({ // TO find if the user has already liked a post
			// 	where: {
			// 		userId: user.id,
			// 		postId: post.id
			// 	}
			// })*/
		})

		res.status(200).json({
			message: "Dummy data created successfully",
		});
	} catch (error) {
		console.error("Error creating dummy data:", error);
		res.status(500).json({ error: error.message });
	}
};

const postTexts = [
	"Excited to connect with industry leaders and expand my professional network!",
	"Attending a virtual conference on software development—great opportunity to learn and network!",
	"Looking for collaborators on an exciting new app development project. Who's interested?",
	"Just published my latest blog post on the future of cloud computing. Let's discuss!",
	"Does anyone have experience with scaling agile teams? I'd love to connect and chat.",
	"Networking tip: Follow up with your connections after meeting at a conference or event!",
	"Hiring talented full-stack developers. Drop your CV or reach out directly!",
	"Looking forward to presenting at next week's tech meetup on microservices architecture.",
	"Taking the next step in my career by learning more about AI and machine learning.",
	"Looking for a mentor in product management. Any recommendations?",
	"How do you manage your work-life balance as a remote worker? Let's exchange tips!",
	"Happy to announce I've joined a new team as a senior backend developer!",
	"Networking isn’t just about business; it's about building meaningful relationships.",
	"Anyone interested in a virtual coffee to discuss career growth in the tech industry?",
	"Just finished an amazing course on leadership in tech teams. Highly recommend it!",
	"How do you keep up with the latest trends in mobile app development?",
	"Looking for a UI/UX designer to collaborate on a new app idea. Let's connect!",
	"Professional development is a journey. Always excited to learn something new!",
	"Preparing a workshop on modern web development. Would love feedback from the community.",
	"Joining a webinar today on cybersecurity best practices. Anyone else attending?",
	"The key to successful networking is genuine connections, not just business cards.",
	"Just completed a challenging coding project—feeling accomplished!",
	"Does anyone here have experience in blockchain development? Let's connect!",
	"Looking for a co-founder for a new startup in the mobile app space.",
	"Connecting with fellow developers to discuss the future of cloud-native apps.",
	"Starting a new open-source project and looking for contributors. Interested?",
	"Grateful to my mentors who helped me navigate the early stages of my career.",
	"Anyone here focusing on developing apps with Flutter? Let's share ideas!",
	"Reaching out to the community for advice on transitioning to a leadership role.",
	"Networking tip: Always offer value before expecting something in return.",
	"Excited to announce my promotion to Lead Software Engineer!",
	"Starting a new blog series on building scalable mobile applications. Stay tuned!",
	"Appreciating the power of networking as I continue to meet inspiring professionals.",
	"Does anyone know a good tool for managing multiple projects efficiently?",
	"Just signed up for a course on DevOps culture and automation. Can’t wait to start!",
	"Let's talk about remote work productivity. What are your best strategies?",
	"Looking for partnerships to develop an innovative professional networking app.",
	"Had a great brainstorming session with fellow developers today!",
	"Career advice: Never stop learning and evolving, even in your busiest times.",
	"Networking tip: Always follow up with a personalized message after connecting.",
	"Excited to be part of the upcoming hackathon! Anyone else participating?",
	"Starting a mentorship program for junior developers—feel free to join!",
	"How do you stay motivated in the constantly evolving tech industry?",
	"Feeling inspired after a great conversation with a mentor on career progression.",
	"Offering free consultations on mobile app development strategies. Let’s connect!",
	"What's the best way to find remote job opportunities in tech?",
	"Celebrating small wins today—completed the MVP for a new project!",
	"Looking for advice on how to pitch a startup idea to investors.",
	"Connecting with other professionals in AI and data science—exciting conversations!",
	"What’s your go-to strategy for growing your professional network effectively?",
	// 30 more posts below
	"Attending a webinar on the future of cloud infrastructure. Anyone joining?",
	"Excited to announce I’ll be speaking at the next tech conference on AI.",
	"Looking for feedback on my latest GitHub repository—open to suggestions!",
	"How do you manage large-scale cloud migrations? Would love to learn more.",
	"Starting a new side project focused on improving developer productivity.",
	"Looking forward to meeting new connections at the upcoming industry meetup!",
	"Just wrapped up an amazing hackathon—feeling energized and inspired!",
	"Exploring career opportunities in data science. Anyone hiring?",
	"Sharing tips on how to stay organized while managing multiple coding projects.",
	"Looking for resources to learn more about serverless architecture. Any recommendations?",
	"Just launched a new app on the App Store—excited to share it with the community!",
	"How do you stay focused while working remotely? Let's discuss strategies.",
	"Collaborating with a global team on an exciting blockchain project. Let's connect!",
	"Offering pro bono mentorship for aspiring software developers. Reach out!",
	"Attending a bootcamp on advanced JavaScript techniques—can't wait to apply my learnings!",
	"Looking for recommendations for online communities focused on DevOps.",
	"Just got certified in AWS cloud architecture. Ready to take on new challenges!",
	"Preparing a talk on innovation in mobile app development. Would love feedback!",
	"Anyone here working on machine learning for healthcare? Let's exchange ideas!",
	"Just joined a mastermind group focused on leadership in tech—great experience so far!",
	"Looking for co-founders for an exciting new fintech startup. Interested?",
	"How do you keep up with the ever-evolving cybersecurity landscape? Let's talk.",
	"Excited to connect with entrepreneurs focused on social impact tech startups.",
	"Just completed an online course on Python automation. Highly recommend it!",
	"Looking for guest bloggers for my tech blog—anyone interested?",
	"Attending a virtual networking event tonight. Who else is coming?",
	"How do you balance learning new technologies while managing your day-to-day work?",
	"Feeling inspired after reading about breakthrough innovations in AI."
];