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