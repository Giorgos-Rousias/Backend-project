const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");

	const User = sequelize.define(
	"User",
	{
		firstName: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		lastName: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true
			},
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		phoneNumber: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				isValidPhoneNumber(value) {
					const phoneNumberRegex = /^\+?[1-9]\d{1,14}$/; // E.164 international format
					if (!phoneNumberRegex.test(value)) {
						throw new Error("Phone number is not valid");
			}}}
		},
		isAdmin: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		hasPhoto: {
			type: DataTypes.BOOLEAN,
			defaultValue: false, // User starts without a photo
		},
		photo: {
			type: DataTypes.BLOB, // Storing photo as binary data (BLOB)
			allowNull: true,
		},
	}, {
		timestamps: true, // Adds 'createdAt' and 'updatedAt'
	}
);

module.exports = User;
