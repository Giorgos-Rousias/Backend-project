// controllers/userController.js
const { UniqueConstraintError, ValidationError } = require("sequelize");
const db = require("../models");
const bcrypt = require("bcrypt");
const js2xmlparser = require('js2xmlparser');
const { Op } = require("sequelize");

exports.getUserProfile = async (req, res) => {
	try {
		const isAdmin = req.user.isAdmin;
		let excludeFields = []
		if(!isAdmin) {
			excludeFields = ["id", "email", "password", "isAdmin", "createdAt", "updatedAt"];
		}

		const user = await db.User.findByPk(req.params.id, {
			attributes: { exclude: excludeFields },
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

exports.getAllUsers = async (req, res) => {
	try {
		if (!req.user.isAdmin) {
			return res.status(403).json({ message: "Unauthorized" });
		}

		const users = await db.User.findAll({
			attributes: { exclude: ["password", "email", "phoneNumber", "createdAt", "updatedAt"] },
		});
		res.status(200).json(users);
	} catch (error) {
		console.error("Error fetching users:", error);
		res.status(500).json({ error: error.message });
	}
};

const usersInfo = async (usersId) => {
	const users = await db.User.findAll({
			where: { id: usersId },
			include: [ {
					model: db.Skill,
				}, {
					model: db.Experience,
				}, {
					model: db.Education,
				}, {
					model: db.Post,
				}, {
					model: db.Comment
				}, {
					model: db.Like
				}, {
					model: db.Listing
				},{
					model: db.User,
					as: 'Friends',
					attributes: { exclude: ["password", "email", "phoneNumber", "createdAt", "updatedAt", "isAdmin", "photo", "hasPhoto"]},
				}]
		});

		return users;
}

exports.exportUsersJSON = async (req, res) => {
	try {
		if(!req.user) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		if (!req.user.isAdmin) {
			return res.status(403).json({ message: "Unauthorized" });
		}

		const usersId = req.body.usersId;
		if (!usersId) {
			return res.status(400).json({ message: "Users ID are required" });
		}

		res.send(await usersInfo(usersId));
	} catch (error) {
		console.error("Error fetching users:", error);
		res.status(500).json({ error: error.message });
	}
};

exports.exportUsersXML = async (req, res) => {
	try {
		if(!req.user) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		if (!req.user.isAdmin) {
			return res.status(403).json({ message: "Unauthorized" });
		}

		const usersId = req.body.usersId;
		if (!usersId) {
			return res.status(400).json({ message: "Users ID are required" });
		}

		const users = await usersInfo(usersId);

		const xmlData = js2xmlparser.parse("users", users.map(user => user.toJSON()));

		res.header('Content-Type', 'application/xml');
		res.send(xmlData);
	} catch (error) {
		console.error("Error fetching users:", error);
		res.status(500).json({ error: error.message });
	}
};

exports.changePassword = async (req, res) => {
	try {
		const user = await db.User.findByPk(req.user.id);

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const { oldPassword, newPassword } = req.body;
		if (!oldPassword || !newPassword) {
			return res.status(400).json({ message: "Old password and new password are required" });
		}

		const isMatch = await bcrypt.compare(oldPassword, user.password);
		if (!isMatch) {
			return res.status(401).json({ message: "Invalid password" });
		}

		const hashedPassword = await bcrypt.hash(newPassword, 10);
		await user.update({ password: hashedPassword });

		res.status(200).json({ message: "Password changed successfully" });
	} catch (error) {
		console.error("Error changing password:", error);
		res.status(500).json({ error: error.message });
	}
};

exports.changeEmail = async (req, res) => {
	try {
		const user = await db.User.findByPk(req.user.id);
		if(!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ message: "Email and password are required" });
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).json({ message: "Invalid password" });
		}

		await user.update({ email });

		res.status(200).json({ message: "Email changed successfully" });
	}
	catch (error) {
		console.error("Error changing email:", error);
		res.status(500).json({ error: error.message });
	}
}

exports.search = async (req , res) => {
	try {
		const input = req.body.input;
		const limit = req.body.limit ? req.body.limit : 10;

		if (!input || input.trim() === "") {
			return res.status(400).json({ message: "Search input cannot be empty" });
		}

		const users = await db.User.findAll({
		where: {
			[Op.or]: [{
				firstName: {
				[Op.iLike]: `%${input}%` // case-insensitive search for PostgreSQL
				}
			}, {
				lastName: {
				[Op.iLike]: `%${input}%` // case-insensitive search for PostgreSQL
				}
			}]
		},
		limit: limit,
		attributes: ["id", "firstName", "lastName", "email"] // You can choose which attributes to return
		});
		res.status(200).json(users);
	}
	catch (error) {
		console.error("Error searching users:", error);
		res.status(500).json({ error: error.message });
	}
} 

//! From here on down, the code is for testing purposes ONLY
//! creates a new user
exports.createUser = async (req, res) => {
	try {
		const { firstName, lastName, email, password, phoneNumber, isAdmin } = req.body; // Get the user data from the request body
		const photoBuffer = req.file ? req.file.buffer : null; // Get the photo buffer if it exists
		const hasPhoto = !!photoBuffer; // Check if the user has a photo

		// Create the new user
		const user = await db.User.create({
		firstName,
		lastName,
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
