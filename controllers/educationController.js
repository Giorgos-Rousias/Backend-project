const db = require("../models");

exports.create = async (req, res) => {
    try {
        const userId  = req.user.id; // Extract userId from route parameters
        const { institution, degree, startYear, endYear } = req.body; // Extract education details from the request body

        // Check if the user exists
        const user = await db.User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Create new education for the user
        const education = await db.Education.create({
          institution,
          degree,
          startYear,
          endYear,
          userId, // Associate the education with the correct user
        });

        res.status(201).json(education);
    } catch (error) {
        console.error("Error creating education:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getEducation = async (req, res) => {
    try {
        const education = await db.Education.findAll({
            where: {
                userId: req.user.id,
            },
        });
        res.status(200).json(education);
    } catch (error) {
        console.error("Error fetching education:", error);
        res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: "Education get endpoint" });
};
exports.update = async (req, res) => {
    return res.status(200).json({ message: "Education update endpoint" });
};
exports.delete = async (req, res) => {
    return res.status(200).json({ message: "Education delete endpoint" });
};

exports.getAll = async (req, res) => {
    try {
        const education = await db.Education.findAll();
        res.status(200).json(education);
    } catch (error) {
        console.error("Error fetching education:", error);
        res.status(500).json({ error: error.message });
    }
};