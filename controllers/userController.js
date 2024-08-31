// controllers/userController.js
const { UniqueConstraintError, ValidationError } = require("sequelize");
const db = require("../models");

exports.getUserProfile = async (req, res) => {
	try {
		const user = await db.User.findByPk(req.params.id, {
			attributes: { exclude: ["id", "email", "password", "isAdmin", "createdAt", "updatedAt"] }, // Exclude the password from the user data
		});
		
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		//Get user's skill 
		const skills = await db.Skill.findAll({
			where: { userId: req.params.id, isPrivate: false },
			attributes: { exclude: ["userId", "createdAt", "updatedAt", "isPrivate"] },
		});

		const experience = await db.Experience.findAll({
			where: { userId: req.params.id, isPrivate: false },
			attributes: { exclude: ["userId", "createdAt", "updatedAt", "isPrivate"] },
		});

		const education = await db.Education.findAll({
			where: { userId: req.params.id, isPrivate: false },
			attributes: { exclude: ["userId", "createdAt", "updatedAt", "isPrivate"] },
		});	

		res.status(200).json({
			user: user,
			skills: skills,
			experience: experience,
			education: education,
		});
	} catch (error) {
		console.error("Error fetching user profile:", error);
		res.status(500).json({ error: error.message });
	}
};

//! From here on down, the code is for testing purposes ONLY

//! creates a new user
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

//! returns all users
exports.getAllUsers = async (req, res) => {
	try {
		const users = await db.User.findAll();
		res.status(200).json(users);
	} catch (error) {
		console.error("Error fetching users:", error);
		res.status(500).json({ error: error.message });
	}
};

//! returns all users without the photo attribute
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
