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
        // if (step % 100 === 0) {
        //     console.log(`Step: ${step}, Error: ${totalError}`);
        // }
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
        // const topPostScores = postScores.slice(0, limit);
        const topPostScores = postScores;
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