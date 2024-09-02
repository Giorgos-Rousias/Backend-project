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
                    attributes: ["id", "name", "surname"],
                },
            ],
            order: [["createdAt", "DESC"]],
        });
        res.status(200).json(listings);
    } catch (error) {
        console.error("Error getting listings:", error);
        res.status(500).json({ error: error.message });
    }
};