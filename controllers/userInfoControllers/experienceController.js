const db = require("../../models");

exports.create = async (req, res) => {
    try {
        const userId = req.user.id; // Extract userId from route parameters
        const { company, role, startYear, endYear, isPrivate } = req.body; // Extract experience details from the request body
    
        // Check if the user exists
        const user = await db.User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "User not found" });
    
        // Create new experience for the user
        const experience = await db.Experience.create({
          company,
          role,
          startYear,
          endYear,
          userId, // Associate the experience with the correct user
          isPrivate,
        });
    
        res.status(201).json(experience);
    } catch (error) {
        console.error("Error creating experience:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getExperience = async (req, res) => {
    try {
        const userId = req.user.id; // Extract userId from route parameters
    
        // Check if the user exists
        const user = await db.User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "User not found" });
    
        // Fetch the user's experience
        const experience = await db.Experience.findAll({ where: { userId } });
    
        // Ensure only one response is sent
        res.status(200).json(experience);
    } catch (error) {
        console.error("Error fetching experience:", error);
    
        // Handle errors properly
        if (!res.headersSent) {
        // Check if headers are already sent
        res
            .status(500)
            .json({ message: "Error fetching experience", error: error.message });
        }
    }
};

exports.update = async (req, res) => {
    try {
        const userId = req.user.id; // Extract userId from route parameters
        const { id, company, role, startYear, endYear, isPrivate } = req.body; // Extract experience details from the request body
    
        // Check if the user exists
        const user = await db.User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "User not found" });
    
        // Check if the experience exists
        const experience = await db.Experience.findByPk(id);
        if (!experience) return res.status(404).json({ message: "Experience not found" });
    
        // Update the experience
        experience.company = company;
        experience.role = role;
        experience.startYear = startYear;
        experience.endYear = endYear;
        experience.isPrivate = isPrivate;
    
        await experience.save();
    
        res.status(200).json(experience);
    } catch (error) {
        console.error("Error updating experience:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const userId = req.user.id; // Extract userId from route parameters
        const { id } = req.body; // Extract experience id from the request body
    
        // Check if the user exists
        const user = await db.User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "User not found" });
    
        // Check if the experience exists
        const experience = await db.Experience.findByPk(id);
        if (!experience) return res.status(404).json({ message: "Experience not found" });
    
        // Delete the experience
        await experience.destroy();
    
        res.status(200).json({ message: "Experience deleted successfully" });
    } catch (error) {
        console.error("Error deleting experience:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAll = async (req, res) => {
    try {
        const experiences = await db.Experience.findAll();
        res.status(200).json(experiences);
    } catch (error) {
        console.error("Error fetching all experiences:", error);
        res.status(500).json({ error: error.message });
    }
};
