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
			post.id,
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

/*
createMatrixFactorization(interactionMatrix, numUsers, numPosts, latentFeatures, steps, alpha)
Η λειτουργία createMatrixFactorization υλοποιεί τη μέθοδο Matrix Factorization χρησιμοποιώντας τον αλγόριθμο Stochastic Gradient Descent. Χρησιμοποιείται για τη βελτιστοποίηση του μητρώου αλληλεπίδρασης χρήστη-αντικειμένου (όπως οι αλληλεπιδράσεις χρήστη-δημοσίευσης) ώστε να δημιουργήσει λανθάνουσες διαστάσεις για τους χρήστες και τα αντικείμενα. Τα βελτιστοποιημένα μητρώα U και P χρησιμοποιούνται για την πρόβλεψη αλληλεπιδράσεων και την παροχή προτάσεων. Η διαδικασία περιλαμβάνει αρχικοποίηση των μητρώων χρηστών (U) και δημοσιεύσεων (P) με μικρές τυχαίες τιμές, και την εφαρμογή του αλγόριθμου Στοχαστικής Βαθμίδωσης για την προσαρμογή των τιμών αυτών ώστε να ελαχιστοποιηθεί το σφάλμα πρόβλεψης των αλληλεπιδράσεων. Ο αλγόριθμος εκτελείται για έναν καθορισμένο αριθμό βημάτων (steps) και ρυθμίζεται από την παράμετρο alpha (ρυθμός μάθησης). Το αποτέλεσμα είναι δύο μητρώα λανθάνουσων χαρακτηριστικών που μπορούν να χρησιμοποιηθούν για να προταθούν νέες δημοσιεύσεις στους χρήστες.
*/
const createMatrixFactorization = (interactionMatrix, numUsers, numPosts, latentFeatures = 10, steps = 1000, alpha = 0.002) => {
    // Initialize user U and post P matrices with small random values
    let U = Array.from({ length: numUsers }, () => Array(latentFeatures).fill().map(() => Math.random() * 0.1));
    let P = Array.from({ length: numPosts }, () => Array(latentFeatures).fill().map(() => Math.random() * 0.1));

    // Perform Stochastic Gradient Descent to optimize U and P matrices
    for (let step = 0; step < steps; step++) {
        let totalError = 0;

        // Loop through each user and post
        for (let i = 0; i < numUsers; i++) {
            for (let j = 0; j < numPosts; j++) {
                // Only consider non-zero interactions (where user interacted with the post)
                if (interactionMatrix[i][j] > 0) {
                    // Predicted interaction by dot product of U[i] and P[j]
                    const predictedInteraction = U[i].reduce((sum, userFeature, k) => sum + userFeature * P[j][k], 0);
                    const error = interactionMatrix[i][j] - predictedInteraction;
                    totalError += Math.pow(error, 2);

                    // Update U and P using Gradient Descent
                    for (let k = 0; k < latentFeatures; k++) {
                        U[i][k] += alpha * error * P[j][k];
                        P[j][k] += alpha * error * U[i][k];
                    }
                }
            }
        }
        // Troubleshooting
        if (step % 100 === 0) {
            console.log(`Step: ${step}, Error: ${totalError}`);
        }
    }

    // Return the optimized user U and post P matrices
    return { U, P };
};

/*
getUserSuggestedPosts2(req, res)
Η λειτουργία getUserSuggestedPosts2 παρέχει προτάσεις δημοσιεύσεων σε έναν συγκεκριμένο χρήστη με βάση τις προηγούμενες αλληλεπιδράσεις του καθώς και τις δραστηριότητες των φίλων του. Αρχικά, δημιουργείται ένα user-post interaction matrix που περιλαμβάνει likes, σχόλια και αλληλεπιδράσεις φίλων. Έπειτα εφαρμόζεται ο αλγόριθμός createMatrixFactorization ο για να βαθμολογήσει τα σκορ των posts. Κατατάσσουμε αυτά τα σκορ από το υψηλότερο στο χαμηλότερο και στέλνουμε n σύνολο από posts με τα μεγαλύτερα σκορ.
*/
exports.getUserSuggestedPosts = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = req.body.limit ? parseInt(req.body.limit) : 10; // Limit the number of recommended posts, default is 10

        // Create the full User-Post Interaction Matrix
        const users = await db.User.findAll(); // Fetch all users
        const posts = await db.Post.findAll(); // Fetch all posts

        const numUsers = users.length;
        const numPosts = posts.length;

        // Initialize interaction matrix (users x posts), setting all to 0 initially and weights
        let interactionMatrix = Array(numUsers).fill(null).map(() => Array(numPosts).fill(0));
		const singleFriendInteractionWeight = 1;
        const likeWeight = 2;
        const multipleFriendInteractionWeight = 3;
		const commentWeight = 4;

        // Populate Interaction Matrix with likes and comments from all users
        for (let userIndex = 0; userIndex < numUsers; userIndex++) {
            const currentUser = users[userIndex];

            const likedPosts = await db.Like.findAll({ where: { userId: currentUser.id } });
            likedPosts.forEach(like => {
                const postIndex = posts.findIndex(post => post.id === like.postId);
                if (postIndex !== -1) {
                    interactionMatrix[userIndex][postIndex] += likeWeight;
                }
            });

            const commentedPosts = await db.Comment.findAll({ where: { userId: currentUser.id } });
            commentedPosts.forEach(comment => {
                const postIndex = posts.findIndex(post => post.id === comment.postId);
                if (postIndex !== -1) {
                    interactionMatrix[userIndex][postIndex] += commentWeight;
                }
            });
        }

        // Add friend interactions only for the target user
        const targetUserIndex = users.findIndex(user => user.id === userId);
        const targetUserFriends = await db.UserFriends.findAll({ where: { userId: userId } });
        const friendIds = targetUserFriends.map(friend => friend.friendId);
        const friendLikedPosts = await db.Like.findAll({ where: { userId: friendIds } });
        const friendCommentedPosts = await db.Comment.findAll({ where: { userId: friendIds } });

        // Count interactions by friends on posts
        let friendInteractionCount = {}; // Map of postId -> number of friends interacting
        [...friendLikedPosts, ...friendCommentedPosts].forEach(friendInteraction => {
            if (!friendInteractionCount[friendInteraction.postId]) {
                friendInteractionCount[friendInteraction.postId] = 0;
            }
            friendInteractionCount[friendInteraction.postId] += 1;
        });

        // Apply weights based on the number of friends interacting with each post
        Object.keys(friendInteractionCount).forEach(postId => {
            const postIndex = posts.findIndex(post => post.id === parseInt(postId));
            if (postIndex !== -1) {
                const interactionCount = friendInteractionCount[postId];
                if (interactionCount === 1) {
                    interactionMatrix[targetUserIndex][postIndex] += singleFriendInteractionWeight;
                } else if (interactionCount > 1) {
                    interactionMatrix[targetUserIndex][postIndex] += multipleFriendInteractionWeight;
                }
            }
        });

        // Apply Matrix Factorization to the Interaction Matrix
        const latentFeatures = 10;
        const steps = 1000
        const alpha = 0.002
        const { U, P } = createMatrixFactorization(interactionMatrix, numUsers, numPosts, latentFeatures, steps, alpha);

        // Predict Scores for the Target User
        const predictedScores = P.map(postFeatures =>
            U[targetUserIndex].reduce((sum, userFeature, index) => sum + userFeature * postFeatures[index], 0)
        );

        // Step 6: Combine, Sort, Limit posts with their predicted scores
        const postScores = posts.map((post, index) => ({
            postId: post.id,
            score: predictedScores[index]
        }));
        postScores.sort((a, b) => b.score - a.score);
        const topPostScores = postScores.slice(0, limit);
        const topPostIds = topPostScores.map(p => p.postId);

        const topPosts = await db.Post.findAll({
            where: { id: topPostIds },
            include: [{
                model: db.User,
                attributes: ["firstName", "lastName", "photo"]
            }, {
				model: db.Like,
				as: 'Likes'
			}]
        });

        // Format the response to match the previous version
        const recommendedPosts = topPosts.map(post => {
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

            const returnUserPhoto = post.User.photo
                ? `data:image/jpeg;base64,${post.User.photo.toString('base64')}`
                : null;

            return {
                id: post.id,
                text: post.text,
                fileType: post.fileType,
                file: returnFile,
                userId: post.User.id,
                firstName: post.User.firstName,
                lastName: post.User.lastName,
                photo: returnUserPhoto,
				likedByUser: post.Likes.some(like => like.userId === userId)

            };
        });

        res.status(200).json(recommendedPosts);

    } catch (error) {
        console.error("Error getting suggested posts:", error);
        res.status(500).json({ error: error.message });
    }
};

/*
dummyDataGenerator(req, res)
Η λειτουργία dummyDataGenerator δημιουργεί ψευδοδεδομένα για δοκιμές. Δημιουργεί νέους χρήστες, φίλους, δημοσιεύσεις, likes, σχόλια, αγγελίες εργασίας, αιτήσεις, δεξιότητες, εκπαίδευση, και εμπειρία για να προσομοιώσει πραγματικές αλληλεπιδράσεις στην πλατφόρμα. Κάθε προφίλ χρήστη γεμίζεται με περιστασιακά ρεαλιστικά, τυχαία δεδομένα, ώστε η εφαρμογή να διαθέτει επαρκές περιεχόμενο για δοκιμές του συστήματος συστάσεων και άλλων λειτουργιών.
*/
exports.dummyDataGenerator = async (req, res) => {
	try {
		const hashedPassword = await bcrypt.hash("1234", 10); 
		
		const newUsers = 40;
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
		console.log(users.length)

		async function processUsers(users) {
			for (const user of users) {
				
				function getRandomNumbersWithDuplicatesRemoved(count, min, max, excludeId) {
					const numbers = [];
					for (let i = 0; i < count; i++) {
						let randomNum;
						do {
							randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
						} while (randomNum === excludeId);
						numbers.push(randomNum);
					}
					return Array.from(new Set(numbers));
				}

				// Create Friends
				const createFriends = async (userId) => {
					try {
						let maxFriends = 9;
						let minFriends = 0;
						const randomNumFriends = Math.floor(Math.random() * (maxFriends - minFriends + 1)) + minFriends;
						const randomUsers = getRandomNumbersWithDuplicatesRemoved(randomNumFriends, 2, users.length, user.id);

						for (const id of randomUsers) {
							let isFriends = await db.UserFriends.findOne({
								where: {
									userId: id,
									friendId: userId
								}
							});
							if (isFriends !== null) continue;

							isFriends = await db.UserFriends.findOne({
								where: {
									userId: userId,
									friendId: id
								}
							});
							if (isFriends !== null) continue;

							await db.UserFriends.create({ userId, friendId: id, status: "accepted" });
							await db.UserFriends.create({ userId: id, friendId: userId, status: "accepted" });
						}
					} catch (error) {
						console.log("Error creating friends: ", error);
					}
				};

				// Create Posts
				const createPosts = async (userId) => {
					try {
						let maxPost = 4;
						let minPost = 0;
						const randomNumPosts = Math.floor(Math.random() * (maxPost - minPost + 1)) + minPost;
						const randomPosts = getRandomNumbersWithDuplicatesRemoved(randomNumPosts, 0, 10, -1);

						for (const id of randomPosts) {
							await db.Post.create({
								creatorUserId: userId,
								text: postTexts[id]
							});
						}
					} catch (error) {
						console.log("Error creating posts: ", error);
					}
				};

				// Create Likes
				const createLikes = async (userId) => {
					try {
						const posts = await db.User.findAll();
						let maxLikes = 10;
						let minLikes = 1;
						const randomNumLikes = Math.floor(Math.random() * (maxLikes - minLikes + 1)) + minLikes;
						const randomLikes = getRandomNumbersWithDuplicatesRemoved(randomNumLikes, 1, posts.length, -1);

						for (const id of randomLikes) {
							const post = await db.Post.findByPk(id);
							if (!post) continue;
							const isLiked = await db.Like.findOne({ where: { userId, postId: id } });
							if (isLiked !== null) continue;

							await db.Like.create({ userId, postId: id });
						}
					} catch (error) {
						console.log("Error creating likes: ", error);
					}
				};

				// Create Comments
				const createComments = async (userId) => {
					try {
						const posts = await db.User.findAll();
						let maxComments = 4;
						let minComments = 0;
						const randomNumComments = Math.floor(Math.random() * (maxComments - minComments + 1)) + minComments;
						const randomComments = getRandomNumbersWithDuplicatesRemoved(randomNumComments, 1, posts.length, -1);

						for (const id of randomComments) {
							const post = await db.Post.findByPk(id);
							if (!post) continue;
							await db.Comment.create({
								userId,
								postId: id,
								text: "No importance"
							});
						}
					} catch (error) {
						console.log("Error creating comments: ", error);
					}
				};

				// Create Job Listings
				const createJobListings = async (userId) => {
					try {
						let maxJobListings = 4;
						let minJobListings = 0;
						const randomNumJobListings = Math.floor(Math.random() * (maxJobListings - minJobListings + 1)) + minJobListings;

						for (let i = 0; i < randomNumJobListings; i++) {
							await db.Listing.create({
								userId,
								title: faker.person.jobTitle(),
								description: jobDescriptions[Math.floor(Math.random() * jobDescriptions.length)],
								location: faker.location.city(),
								company: faker.company.name(),
								salary: faker.finance.amount()
							});
						}
					} catch (error) {
						console.log("Error creating job listings: ", error);
					}
				};

				// Create Applications
				const createApplications = async (user) => {
                    try {
                        const jobListings = await db.Listing.findAll();
                        if (!jobListings || jobListings.length === 0) return;
                        console.log(jobListings.length);

                        const maxApplications = 4;
                        const minApplications = 0;
                        const randomNumApplications = Math.floor(Math.random() * (maxApplications - minApplications + 1)) + minApplications;
                        const appliedListings = new Set();

                        for (let i = 0; i < randomNumApplications; i++) {
                            const randomJobListing = jobListings[Math.floor(Math.random() * jobListings.length)];
                            
                            if (appliedListings.has(randomJobListing.id)){
                                console.log("Duplicate application");
                                continue;
                            }

                            appliedListings.add(randomJobListing.id);
                            await user.addAppliedToListing(randomJobListing);
                        }
                    } catch (error) {
                        console.log("Error creating applications: ", error);
                    }
                };

				// Create Skills
				const createSkills = async (userId) => {
					try {
						let maxSkills = 5;
						let minSkills = 0;
						const randomNumSkills = Math.floor(Math.random() * (maxSkills - minSkills + 1)) + minSkills;
						for (let i = 0; i < randomNumSkills; i++) {
							await db.Skill.create({
								userId,
								skill: skillsList[Math.floor(Math.random() * skillsList.length)],
								description: faker.lorem.sentence()
							});
						}
					} catch (error) {
						console.log("Error creating skills: ", error);
					}
				};

				// Create Education
				const createEducation = async (userId) => {
					try {
						let maxEducation = 4;
						let minEducation = 0;
						const randomNumEducation = Math.floor(Math.random() * (maxEducation - minEducation + 1)) + minEducation;
						for (let i = 0; i < randomNumEducation; i++) {
							await db.Education.create({
								userId,
								institution: faker.company.name(),
								degree: faker.lorem.word(),
								startYear: faker.number.int({ min: 2000, max: 2020 }),
								endYear: 2020,
							});
						}
					} catch (error) {
						console.log("Error creating education: ", error);
					}
				};

				// Create Experience
				const createExperience = async (userId) => {
					try {
						let maxExperience = 4;
						let minExperience = 0;
						const randomNumExperience = Math.floor(Math.random() * (maxExperience - minExperience + 1)) + minExperience;

						for (let i = 0; i < randomNumExperience; i++) {
							await db.Experience.create({
								userId,
								company: faker.company.name(),
								role: faker.person.jobTitle(),
								startYear: faker.number.int({ min: 2000, max: 2020 }),
								endYear: 2020,
							});
						}
					} catch (error) {
						console.log("Error creating experience: ", error);
					}
				};

				const createSeeListings = async (user) => {
                    try {
                        let maxSeeListings = 4;
                        let minSeeListings = 2;
                        const randomNumSeeListings = Math.floor(Math.random() * (maxSeeListings - minSeeListings + 1)) + minSeeListings;

                        const numberOfListings = await db.Listing.count();

                        const randomListings = getRandomNumbersWithDuplicatesRemoved(randomNumSeeListings, 1, numberOfListings, -1);

                        for (const id of randomListings) {
                            const listing = await db.Listing.findByPk(id);
                            if (!listing) {
                                continue;
                            }

                            const alreadySeen = await user.hasSeen(listing);
                            if (alreadySeen) {
                                continue;
                            }

                            await user.addSeen(listing);
                        }
                    } catch (error) {
                        console.log("Error creating see listing: ", error);
                    }
                };

                // Now calling each async function for the user in sequence
                await createFriends(user.id);
                await createPosts(user.id);
                await createLikes(user.id);
                await createComments(user.id);
                await createJobListings(user.id);
                await createApplications(user);
                await createSkills(user.id);
                await createEducation(user.id);
                await createExperience(user.id);
                await createSeeListings(user);
			}
		}

		// Call the function with the users array
		await processUsers(users);

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
];

const skillsList = [
	"JavaScript",
	"Python",
	"Data analysis with Python and R",
	"Project management and agile methodologies",
	"Web development with HTML, CSS, and React",
	"Database management with SQL and NoSQL",
	"SQL",
	"Cloud computing with AWS and Azure",
	"Machine learning",
	"AI",
	"UI/UX designer",
	"DevOps and CI/CD pipeline setup",
	"Networking and cybersecurity basics",
	"Mobile application development",
	"junior developer",
	"SEO",
	"Business analysis",
	"Software testing and quality assurance",
	"API design and integration with RESTful services",
    "DevOps",
    "Jenkins",
    "GitLab CI",
    "Docker",
    "Node.js",
    "Kubernetes",
    "Flutter",
    "Agile",
    "SEO",
    "Testing",
    "Tableau",
    "Flask",
    "Java",
    "Leadership",
    "RPA",
    "Data Analysis",
    "Cybersecurity",
    "Prototyping",
    "REST APIs",
    "Scalability"
];

const jobDescriptions = [
    "Develop and maintain high-quality web applications using JavaScript, React, and modern frameworks. Collaborate with designers and back-end developers to create a seamless user experience, ensuring responsive design and cross-browser compatibility.",
    "Collaborate with cross-functional teams, including product owners, designers, and engineers, to gather requirements and deliver scalable software solutions. Participate in code reviews, ensure adherence to best practices, and mentor junior developers.",
    "Design and implement efficient data storage solutions using SQL and NoSQL databases. Optimize database performance, write complex queries, and ensure data integrity across multiple environments. Work closely with the engineering team to ensure robust and scalable solutions.",
    "Manage cloud infrastructure and deploy services using AWS or Azure. Automate infrastructure provisioning and maintenance tasks using Infrastructure as Code (IaC) tools like Terraform. Ensure high availability, scalability, and security of cloud-based applications.",
    "Create engaging UI/UX designs, conduct user testing, and iterate based on feedback to improve usability. Develop wireframes, prototypes, and visual designs using tools such as Figma or Sketch. Work closely with front-end developers to bring designs to life.",
    "Develop machine learning models to solve complex business problems, and integrate them into existing applications. Analyze large datasets to extract insights, create predictive models, and evaluate model performance. Collaborate with data engineers to deploy models in production environments.",
    "Lead project teams through agile processes to ensure on-time delivery of features. Facilitate daily stand-ups, sprint planning, and retrospective meetings. Identify risks and roadblocks, and develop strategies to mitigate them while ensuring stakeholder alignment.",
    "Write unit and integration tests to ensure the stability and quality of applications. Utilize tools such as Jest, Mocha, and Selenium to create automated test scripts. Collaborate with QA engineers to identify potential issues and verify fixes in the development process.",
    "Design and maintain CI/CD pipelines to streamline software delivery. Set up automated builds, tests, and deployments using Jenkins, GitLab CI, or similar tools. Work closely with development teams to implement continuous integration and deployment best practices.",
    "Provide technical support and training for internal and external stakeholders. Develop technical documentation, create user guides, and conduct workshops to ensure users are comfortable with software products. Work closely with the customer support team to address and resolve technical issues.",
    "Design and implement scalable microservices using Node.js or Java. Develop RESTful APIs, integrate third-party services, and ensure that the microservices architecture is highly available and fault-tolerant. Monitor system performance and make improvements where necessary.",
    "Drive digital transformation initiatives, focusing on automation, efficiency, and customer experience. Analyze business processes, identify bottlenecks, and recommend solutions to improve overall productivity. Work with multiple teams to successfully implement process improvements.",
    "Lead the design and development of a mobile application using frameworks such as Flutter or React Native. Implement user authentication, manage state effectively, and optimize the app for different devices and screen sizes. Ensure high performance and smooth animations.",
    "Develop comprehensive cybersecurity strategies to protect applications and data. Perform security assessments, vulnerability scans, and penetration testing. Educate development teams about secure coding practices, and establish protocols to respond to security incidents.",
    "Participate in the design, architecture, and development of large-scale distributed systems. Ensure that applications are built to handle significant growth and scalability requirements. Collaborate with infrastructure engineers to design robust, high-performance systems.",
    "Oversee end-to-end delivery of complex software projects, from initial concept to deployment. Prepare project plans, allocate resources, and manage timelines. Maintain regular communication with stakeholders, providing updates on project status, risks, and issues.",
    "Create digital marketing campaigns aimed at enhancing brand visibility and customer engagement. Utilize SEO, content marketing, and PPC to attract and retain customers. Analyze campaign performance metrics and optimize strategies for maximum effectiveness.",
    "Work closely with product managers to define and prioritize features. Create detailed user stories, acceptance criteria, and flow diagrams to capture requirements. Ensure that features align with business goals, and provide valuable feedback during feature development.",
    "Develop scalable backend services using Python and Flask, integrating with third-party APIs to extend the application's capabilities. Create automated scripts for data migration and transformation, ensuring that the system remains robust and efficient.",
    "Lead a team of junior developers, providing code reviews, mentorship, and technical guidance. Ensure the team adheres to coding standards, keeps up with modern development trends, and delivers high-quality software that meets business requirements.",
    "Coordinate with marketing and sales teams to strategize and execute product launches. Develop marketing collateral, participate in customer interviews, and perform competitive analysis to ensure successful market positioning.",
    "Manage software deployments and oversee the release process in a production environment. Collaborate with QA teams for final sign-offs and ensure rollback plans are in place. Handle production issues swiftly, ensuring minimum downtime.",
    "Conduct market research to identify customer needs and analyze competitor offerings. Provide insights to the product team to influence the product roadmap. Prepare reports on market trends and customer feedback.",
    "Implement automated workflows using robotic process automation (RPA) tools. Identify repetitive business tasks, design automation scripts, and work with business units to ensure smooth integration of automated processes.",
    "Analyze performance metrics to measure software efficiency. Utilize data visualization tools such as Power BI or Tableau to present metrics to stakeholders. Work with developers to optimize underperforming areas of the software.",
    "Perform server-side logic and manage databases to ensure efficient application performance. Handle integrations with third-party services, and optimize server usage for scalability.",
    "Create and manage product documentation, including user manuals and technical specifications. Work with developers to ensure that all product features are documented correctly, providing clear instructions for end users.",
    "Develop front-end code that meets WCAG accessibility standards to ensure web applications are accessible to all users, including those with disabilities. Collaborate with UX designers to implement visually appealing and compliant user interfaces."
];