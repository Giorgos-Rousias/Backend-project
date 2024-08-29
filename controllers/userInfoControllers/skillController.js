const db = require("../../models");

exports.create = async (req, res) => {
    try {
        const userId = req.user.id; // Extract userId from route parameters
        const { skill, description, isPrivate } = req.body; // Extract skill details from the request body
    
        // Check if the user exists
        const user = await db.User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Create new skill for the user
        const newSkill = await db.Skill.create({
          skill,
          description,
          userId, // Associate the skill with the correct user
          isPrivate,
        });

        res.status(201).json(newSkill);
    }
    catch (error) {
        console.error("Error creating skill:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getSkill = async (req, res) => {
    try {
        const userId = req.user.id; // Extract userId from route parameters

        // Check if the user exists
        const user = await db.User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Fetch the user's skill
        const skill = await db.Skill.findAll({ where: { userId } });

        // Ensure only one response is sent
        res.status(200).json(skill);
    } catch (error) {
        console.error("Error fetching skill:", error);

        // Handle errors properly
        if (!res.headersSent) {
            // Check if headers are already sent
            res
                .status(500)
                .json({ message: "Error fetching skill", error: error.message });
        }
    }
};

exports.update = async (req, res) => {
    try {
        const userId = req.user.id; // Extract userId from route parameters
        const { id, skill, description, isPrivate } = req.body; // Extract skill details from the request body

        // Check if the user exists
        const user = await db.User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Check if the skill exists
        const existingSkill = await db.Skill.findByPk(id);
        if (!existingSkill) return res.status(404).json({ message: "Skill not found" });

        // Update the skill
        existingSkill.skill = skill;
        existingSkill.description = description;
        existingSkill.isPrivate = isPrivate;

        await existingSkill.save();

        res.status(200).json(existingSkill);
    } catch (error) {
        console.error("Error updating skill:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const userId = req.user.id; // Extract userId from route parameters
        const { id } = req.body; // Extract skill id from the request body

        // Check if the user exists
        const user = await db.User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Check if the skill exists
        const skill = await db.Skill.findByPk(id);
        if (!skill) return res.status(404).json({ message: "Skill not found" });

        // Delete the skill
        await skill.destroy();

        res.status(200).json({ message: "Skill deleted successfully" });
    } catch (error) {
        console.error("Error deleting skill:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAll = async (req, res) => {
    try {
        const skills = await db.Skill.findAll();
        res.status(200).json(skills);
    } catch (error) {
        console.error("Error fetching all skills:", error);
        res.status(500).json({ error: error.message });
    }
};