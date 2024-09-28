const db = require("../models");

exports.create = async (req, res) => {
    try {
        const user = await db.User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const listingDetails = req.body;
        if (!listingDetails.title || !listingDetails.description || !listingDetails.company || !listingDetails.location || !listingDetails.salary) {
            return res.status(400).json({ message: "Missing required information" });
        }

        const listing = await db.Listing.create({
            ...listingDetails,
            userId: req.user.id,
        });
        res.status(201).json(listing);
    } catch (error) {
        console.error("Error creating listing:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        if(!req.params.id) {
            return res.status(400).json({ message: "Missing listing ID" });
        }

        const listing = await db.Listing.findByPk(req.params.id);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        if (listing.userId !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        await listing.update(req.body);
        res.status(200).json(listing);
    } catch (error) {
        console.error("Error updating listing:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        if(!req.params.id) {
            return res.status(400).json({ message: "Missing listing ID" });
        }

        const listing = await db.Listing.findByPk(req.params.id);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        if (listing.userId !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        await listing.destroy();
        res.status(200).json({message: "Listing deleted"});
    } catch (error) {
        console.error("Error deleting listing:", error);
        res.status(500).json({ error: error.message });
    }
}

exports.getListings = async (req, res) => {
    try {
        const listings = await db.Listing.findAll({
            include: [
                {
                    model: db.User,
                    attributes: ["id", "firstName", "lastName", "photo"],
                },
            ],
            order: [["createdAt", "DESC"]],
        });

        const mappedListings = listings.map((listing) => {
            const { id, title, description, company, location, salary, createdAt, User } = listing;
            return {
                id,
                title,
                description,
                company,
                location,
                salary,
                createdAt,
                User: {
                    id: User.id,
                    firstName: User.firstName,
                    lastName: User.lastName,
                    photo: User.photo ? `data:image/jpeg;base64,${User.photo.toString('base64')}` : null,
                },
            };
        });

        res.status(200).json(mappedListings);
    } catch (error) {
        console.error("Error getting listings:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getApplicants = async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({ message: "Listing param not found" });
        }

        const listing = await db.Listing.findByPk(
            req.params.id,{ 
                include: { 
                    model: db.User,
                    as: 'Applicants',
                    attributes: ["id", "firstName", "lastName", "photo", "phoneNumber", "email"],
                } 
        });

        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        if(listing.userId !== req.user.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const mappedApplicants = listing.Applicants.map((applicant) => {
            return {
                id: applicant.id,
                firstName: applicant.firstName,
                lastName: applicant.lastName,
                photo: applicant.photo ? `data:image/jpeg;base64,${applicant.photo.toString('base64')}` : null,
                phoneNumber: applicant.phoneNumber,
                email: applicant.email,
            };
        });

        return res.status(200).json(mappedApplicants);

    } catch (error) {
        console.error("Error getting applicants:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.applyToListing = async (req, res) => {
    try {
        if(!req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }

        if (!req.params.id) {
            return res.status(400).json({ message: "Listing param not found" });
        }

        const user = await db.User.findByPk(req.user.id);
        const listing = await db.Listing.findByPk(req.params.id);

        if (!user || !listing) {
            throw new Error('User or Listing not found');
        }

        await user.addAppliedToListing(listing);

        res.status(200).json({ message: "Applied to listing" });
    } catch (error) {
        console.error("Error getting applicants:", error);
        res.status(500).json({ error: error.message });
    }
}

exports.markAsSeen = async (req, res) => {
    try {
        if(!req.params.id) {
            return res.status(400).json({ message: "Missing listing ID" });
        }

        const listing = await db.Listing.findByPk(req.params.id);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        const user = await db.User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const alreadySeen = await user.hasSeen(listing);
        if (alreadySeen) {
            return res.status(200).json({ message: "Listing already marked as seen" });
        }

        await user.addSeen(listing);
        res.status(200).json({ message: "Listing marked as seen" });

    } catch (error) {
        console.error("Error marking listing as seen:", error);
        res.status(500).json({ error: error.message });
    }
}
// Matrix Factorization function SAME WITH THE OTHER ONE
const createMatrixFactorization = (interactionMatrix, numUsers, numListings, latentFeatures = 10, steps = 1000, alpha = 0.002) => {
    let U = Array.from({ length: numUsers }, () => Array(latentFeatures).fill().map(() => Math.random() * 0.1));
    let P = Array.from({ length: numListings }, () => Array(latentFeatures).fill().map(() => Math.random() * 0.1));

    for (let step = 0; step < steps; step++) {
        let totalError = 0;

        for (let i = 0; i < numUsers; i++) {
            for (let j = 0; j < numListings; j++) {
                if (interactionMatrix[i][j] > 0) {
                    const predictedInteraction = U[i].reduce((sum, userFeature, k) => sum + userFeature * P[j][k], 0);
                    const error = interactionMatrix[i][j] - predictedInteraction;
                    totalError += Math.pow(error, 2);

                    for (let k = 0; k < latentFeatures; k++) {
                        U[i][k] += alpha * error * P[j][k];
                        P[j][k] += alpha * error * U[i][k];
                    }
                }
            }
        }

        if (step % 100 === 0) {
            console.log(`Step: ${step}, Error: ${totalError}`);
        }
    }

    return { U, P };
};

/*
getListings2(req, res)
Η λειτουργία getListings2 είναι υπεύθυνη για την παροχή προτάσεων αγγελιών εργασίας σε έναν συγκεκριμένο χρήστη με βάση τόσο τις προηγούμενες αλληλεπιδράσεις του όσο και τις δραστηριότητες των φίλων του. Ο αλγόριθμος προτείνει αγγελίες με βάση έναν συνδυασμό Matrix Factorization και content-based filtering, εξασφαλίζοντας ότι οι προτάσεις είναι σχετικές και προσωποποιημένες. Αρχικά χρησιμοποιούμαι την μέθοδο createMatrixFactorization όπως και στην συνάρτηση getUserSuggestedPosts2(req, res) με την ίδια λογική "λαμβάνοντας υπόψη προβολές αγγελιών, αιτήσεις εργασίας, καθώς και προβολές και αιτήσεις φίλων", Τα προβλεπόμενα σκορ κανονικοποιούνται μεταξύ 0 και 1. Στο δεύτερο μέρος κάνουμε αναζήτηση βάσει περιεχομένου, η λειτουργία συγκρίνει το προφίλ του χρήστη, συμπεριλαμβανομένων των δεξιοτήτων του, της εκπαίδευσής του, και της επαγγελματικής του εμπειρίας, με τις περιγραφές των αγγελιών. Για κάθε λέξη-κλειδί που εμφανίζεται στην περιγραφή μιας αγγελίας, η λειτουργία αυξάνει το σκορ της συγκεκριμένης αγγελίας. Τα σκορ που προκύπτουν κανονικοποιούνται μεταξύ 0 και 1, δημιουργώντας ένα σύστημα βαθμολόγησης που αντικατοπτρίζει τη συνάφεια της αγγελίας με το προφίλ του χρήστη. Στο τέλος, η λειτουργία συνδυάζει τις κανονικοποιημένες βαθμολογίες από το Matrix Factorization και το content-based filtering με συγκεκριμένα βάρη (π.χ., a = 0.7 για Matrix Factorization και b = 0.3 για το content-based σκορ). Οι τελικές βαθμολογίες υπολογίζονται ως σταθμισμένα αθροίσματα των δύο αυτών σκορ. Οι αγγελίες κατατάσσονται με βάση την τελική τους βαθμολογία και επιστρέφονται οι κορυφαίες προτάσεις στον χρήστη.
*/
exports.getListings2 = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = req.body.limit ? parseInt(req.body.limit) : 10; // Limit the number of recommended listings, default is 10

        // // //
        // Part.1: Create Max Factorization "like post" and Normalize score from 0 to 1
        // // //
        const users = await db.User.findAll(); // Fetch all users
        const listings = await db.Listing.findAll(); // Fetch all listings
        const numUsers = users.length;
        const numListings = listings.length;

        let interactionMatrix = Array(numUsers).fill(null).map(() => Array(numListings).fill(0));
        const viewWeight = 1;
        const applicationWeight = 2;
        const singleFriendInteractionWeight = 3;
        const multipleFriendInteractionWeight = 4;

        // Populate Interaction Matrix with views and applications from all users
        for (let userIndex = 0; userIndex < numUsers; userIndex++) {
            // Fetch the listings that the current user has seen
            const currentUser = users[userIndex];
            const userSeens = await db.User.findAll({
                where: { id: currentUser.id }, 
                attributes: [],
                include: [{
                    model: db.Listing,
                    as: 'Seen',
                    through: {
                        attributes: []
                    }
                }]
            });

            // Extract the 'Seen' listings from dataValues and Populate the interaction matrix for views
            const userWithSeenListings = userSeens[0];      // Get the first (and only) user from the result array
            const seenListings = userWithSeenListings ? userWithSeenListings.dataValues.Seen : [];
            seenListings.forEach(listing => {
                const listingIndex = listings.findIndex(l => l.id === listing.id);
                if (listingIndex !== -1) {
                    interactionMatrix[userIndex][listingIndex] += viewWeight;
                }
            });

            // Fetch the listings that the current user has applied
            const userApply = await db.User.findAll({
                where: { id: currentUser.id }, 
                attributes: [],
                include: [{
                    model: db.Listing,
                    as: 'AppliedToListing',
                    through: {
                        attributes: []
                    }
                }]
            });

            // Extract the 'AppliedToListing' listings from dataValues
            const userWithApplyListings = userApply[0];      // Get the first (and only) user from the result array
            const applyListings = userWithApplyListings ? userWithApplyListings.dataValues.AppliedToListing : [];
            applyListings.forEach(application => {
                const listingIndex = listings.findIndex(listing => listing.id === application.id);
                if (listingIndex !== -1) {
                    interactionMatrix[userIndex][listingIndex] += applicationWeight;
                }
            });
        }

        // Add friend interactions only for the target user
        const targetUserIndex = users.findIndex(user => user.id === userId);
        const targetUserFriends = await db.UserFriends.findAll({ where: { userId: userId } });
        const friendIds = targetUserFriends.map(friend => friend.friendId);

        // Fetch listings viewed and applied by friends
        const friendViewedListings = await db.SeenListings.findAll({ where: { userId: friendIds } });
        console.log(friendViewedListings.length)
        let friendAppliedListings = [];
        for (const friendId of friendIds) {
            const friendAppliedListingsData = await db.User.findByPk(friendId, {
                include: [{
                    model: db.Listing,
                    as: 'AppliedToListing',
                }],
            });
            
            // If the friend has applied listings, concatenate them into the friendAppliedListings array
            if (friendAppliedListingsData && friendAppliedListingsData.AppliedToListing) {
                friendAppliedListings = friendAppliedListings.concat(friendAppliedListingsData.AppliedToListing);
            }
        }

        // Count interactions by friends on listings
        let friendInteractionCount = {}; // Map of listingId -> number of friends interacting
        [...friendViewedListings, ...friendAppliedListings].forEach(friendInteraction => {
            const listingId = friendInteraction.listingId;
            if (!friendInteractionCount[listingId]) {
                friendInteractionCount[listingId] = 0;
            }
            friendInteractionCount[listingId] += 1;
        });

        // Apply weights based on the number of friends interacting with each listing
        Object.keys(friendInteractionCount).forEach(listingId => {
            const listingIndex = listings.findIndex(listing => listing.id === parseInt(listingId));
            if (listingIndex !== -1) {
                const interactionCount = friendInteractionCount[listingId];
                if (interactionCount === 1) {
                    interactionMatrix[targetUserIndex][listingIndex] += singleFriendInteractionWeight;
                } else if (interactionCount > 1) {
                    interactionMatrix[targetUserIndex][listingIndex] += multipleFriendInteractionWeight;
                }
            }
        })

        // Apply Matrix Factorization to the Interaction Matrix
        const latentFeatures = 10; 
        const steps = 1000
        const alpha = 0.002
        const { U, P } = createMatrixFactorization(interactionMatrix, numUsers, numListings, latentFeatures, steps, alpha);

        // Predict Scores for the Target User
        const predictedScores = P.map(listingFeatures =>
            U[targetUserIndex].reduce((sum, userFeature, index) => sum + userFeature * listingFeatures[index], 0)
        );
        const listingScores = listings.map((post, index) => ({
            postId: post.id,
            score: predictedScores[index]
        }));
        console.log(listingScores)

        // Normalize Matrix Factorization Scores between 0 and 1
        const maxMatrixFactorizationScore = Math.max(...listingScores.map(item => item.score));
        const minMatrixFactorizationScore = Math.min(...listingScores.map(item => item.score));

        const normalizedMatrixScores = listingScores.map(item => ({
            postId: item.postId,
            normalizedScore: maxMatrixFactorizationScore > minMatrixFactorizationScore
                ? (item.score - minMatrixFactorizationScore) / (maxMatrixFactorizationScore - minMatrixFactorizationScore)
                : 0 // Handle case where all scores are the same
        }));

        // // //
        // Part.2: Search for skills Education and Experience
        // // //        
        const userExperience = await db.Experience.findAll({ where: { userId } });
        const userEducation = await db.Education.findAll({ where: { userId } });
        const userSkill = await db.Skill.findAll({ where: { userId } });
        const roles = userExperience.map(experience => experience.dataValues.role);
        const skills = userSkill.map(skill => skill.dataValues.skill);
        const degrees = userEducation.length ? userEducation.map(education => education.dataValues.degree) : [];
        const keywords = [...roles, ...skills, ...degrees];

        let contentBasedScores = [];
        listings.forEach((listing, index) => {
            const description = listing.description.toLowerCase();
            let score = 0;
        
            keywords.forEach(keyword => {
                const keywordCount = (description.match(new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g')) || []).length;
                score += keywordCount;
            });
            contentBasedScores.push({ listingId: listing.id, score });
        });
        
        // Normalizing the content-based scores between 0 and 1
        const maxScore = Math.max(...contentBasedScores.map(item => item.score));
        contentBasedScores = contentBasedScores.map(item => ({
            listingId: item.listingId,
            normalizedScore: maxScore > 0 ? item.score / maxScore : 0
        }));
        // console.log(contentBasedScores)

        // // //
        // Part.3: Combine the Results
        // // //    
        const a = 0.7; // Weight for matrix factorization score
        const b = 0.3;  // Weight for content-based score

        // Combine the two scores
        const contentScoreMap = new Map(contentBasedScores.map(item => [item.listingId, item.normalizedScore]));
        const finalScores = normalizedMatrixScores.map((matrixScore) => {
            const contentScore = contentScoreMap.get(matrixScore.postId) || 0;

            // Calculate the final score using a weighted sum of both normalized scores
            const finalScore = (a * matrixScore.normalizedScore) + (b * contentScore);
            return {
                postId: matrixScore.postId,
                finalScore
            };
        });

        // Sort the listings by the final combined score in descending order
        finalScores.sort((a, b) => b.finalScore - a.finalScore);

        // Limit the number of posts and fetch post details
        // const topListingScores = finalScores.slice(0, limit);
        const topListingScores = finalScores;
        const topListingIds = topListingScores.map(p => p.postId);

        // Fetch the top recommended listings by their IDs
        const recommendedListings = await db.Listing.findAll({
            where: { id: topListingIds },
            include: [
                {
                    model: db.User,
                    attributes: ["id", "firstName", "lastName", "photo"]
                },
            ]
        });

        const mappedListings = recommendedListings.map((listing) => {
            const { id, title, description, company, location, salary, createdAt, User } = listing;
            return {
                id,
                title,
                description,
                company,
                location,
                salary,
                createdAt,
                User: {
                    id: User.id,
                    firstName: User.firstName,
                    lastName: User.lastName,
                    photo: User.photo ? `data:image/jpeg;base64,${User.photo.toString('base64')}` : null,
                },
            };
        });
        res.status(200).json(mappedListings);

    } catch (error) {
        console.error("Error getting suggested listings:", error);
        res.status(500).json({ error: error.message });
    }
};