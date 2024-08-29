const db = require("../../models");

exports.create = async (req, res) => {
    try {
        const userId  = req.user.id; // Extract userId from route parameters
        const { institution, degree, startYear, endYear, isPrivate } = req.body; // Extract education details from the request body

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
          isPrivate,
        });

        res.status(201).json(education);
    } catch (error) {
        console.error("Error creating education:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getEducation = async (req, res) => {
  try {
    const userId = req.user.id; // Extract userId from route parameters

    // Check if the user exists
    const user = await db.User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch the user's education
    const education = await db.Education.findAll({ where: { userId } });

    // Ensure only one response is sent
    res.status(200).json(education);
  } catch (error) {
    console.error("Error fetching education:", error);

    // Handle errors properly
    if (!res.headersSent) {
      // Check if headers are already sent
      res
        .status(500)
        .json({ message: "Error fetching education", error: error.message });
    }
  }
};

exports.update = async (req, res) => {
    try {
        const userId = req.user.id; // Extract userId from route parameters
        const { id, institution, degree, startYear, endYear, isPrivate } = req.body; // Extract education details from the request body

        // Check if the user exists
        const user = await db.User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Update the user's education
        const education = await db.Education.findOne({ where: { id, userId } });
        if (!education) return res.status(404).json({ message: "Education not found" });

        education.institution = institution;
        education.degree = degree;
        education.startYear = startYear;
        education.endYear = endYear;
        education.isPrivate = isPrivate;

        await education.save();

        res.status(200).json(education);
    } catch (error) {
        console.error("Error updating education:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const userId = req.user.id; // Extract userId from route parameters
        const { id } = req.body; // Extract education id from the request body

        // Check if the user exists
        const user = await db.User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Delete the user's education
        const education = await db.Education.findOne({ where: { id, userId } });
        if (!education) return res.status(404).json({ message: "Education not found" });

        await education.destroy();

        res.status(200).json({"message": "Education deleted successfully"});
    } catch (error) {
        console.error("Error deleting education:", error);
        res.status(500).json({ error: error.message });
    }
};


//! For testing purposes ONLY
exports.getAll = async (req, res) => {
    try {
        const education = await db.Education.findAll();
        res.status(200).json(education);
    } catch (error) {
        console.error("Error fetching education:", error);
        res.status(500).json({ error: error.message });
    }
};