// controllers/authController.js
const { UniqueConstraintError, ValidationError } = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../models");

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, surname, email, password, phoneNumber, isAdmin } = req.body;
    const photoBuffer = req.file ? req.file.buffer : null;
    const hasPhoto = !!photoBuffer;

    if(password.length < 4 || password.length > 32) {
        return res.status(400).json({ message: "Password must be between 4 and 32 characters" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const user = await db.User.create({
      name,
      surname,
      email,
      password: hashedPassword,
      phoneNumber,
      isAdmin: isAdmin === "true",
      photo: photoBuffer,
      hasPhoto,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);

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
      .json({ message: "Error registering user", error: error.message });
  }
};

// Login a user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await db.User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }


    // Generate a JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION_TIME }
    );

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};
