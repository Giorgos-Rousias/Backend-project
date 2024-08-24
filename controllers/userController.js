// controllers/userController.js
const { UniqueConstraintError, ValidationError } = require("sequelize");
const db = require("../models");

exports.createUser = async (req, res) => {
  try {
    const { name, surname, email, password, phoneNumber, isAdmin } = req.body;
    const photoBuffer = req.file ? req.file.buffer : null;
    const hasPhoto = !!photoBuffer;

    // Create the new user
    const user = await db.User.create({
      name,
      surname,
      email,
      password,
      phoneNumber,
      isAdmin: isAdmin === "true",
      photo: photoBuffer,
      hasPhoto,
    });

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);

    if (error instanceof UniqueConstraintError) {
      return res.status(400).json({ message: "Email already in use" });
    }

    if (error instanceof ValidationError) {
      return res
        .status(400)
        .json({ message: "Validation error", errors: error.errors });
    }

    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await db.User.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: error.message });
  }
};


// For testing purposes
exports.getUsersWithoutPhoto = async (req, res) => {
  try {
    const users = await db.User.findAll({
      attributes: { exclude: ["photo"] },
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: error.message });
  }
};
