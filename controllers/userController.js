// controllers/userController.js
const { UniqueConstraintError, ValidationError } = require("sequelize");
const db = require("../models");


//? creates a new user
exports.createUser = async (req, res) => {
  try {
    const { name, surname, email, password, phoneNumber, isAdmin } = req.body; // Get the user data from the request body
    const photoBuffer = req.file ? req.file.buffer : null; // Get the photo buffer if it exists
    const hasPhoto = !!photoBuffer; // Check if the user has a photo

    // Create the new user
    const user = await db.User.create({
      name,
      surname,
      email,
      password,
      phoneNumber,
      isAdmin: isAdmin === "true", // Convert the string to a boolean
      photo: photoBuffer,
      hasPhoto,
    });

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error creating user:", error);

    // console.log(error.errors.map(e => e.type));
    const type = error.errors.map(e => e.type);
    const message = error.errors.map(e => e.message);

    if (error instanceof UniqueConstraintError || error instanceof ValidationError) { // Check if the error is due to a unique constraint violation
      return res.status(400).json({ message: message[0], errors: type[0] });
    }

    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
};

//? returns all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await db.User.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: error.message });
  }
};

//! From here on down, the code is for testing purposes ONLY

//? returns all users without the photo attribute
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
