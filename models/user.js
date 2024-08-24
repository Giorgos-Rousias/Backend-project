// models/user.js

const { DataTypes } = require("sequelize");
const sequelize = require("../sequelize");

const User = sequelize.define(
  "User",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    surname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: "Password is required" },
        isValidLength(value) {
          const passwordRegex = /^.{2,32}$/;
          if (!passwordRegex.test(value)) {
            throw new Error(
              "Password must be between 2 and 32 characters long"
            );
          }
        },
      },
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: "Phone number is required" },
        isValidPhoneNumber(value) {
          const phoneNumberRegex = /^\+?[1-9]\d{1,14}$/; // E.164 international format
          if (!phoneNumberRegex.test(value)) {
            throw new Error("Phone number is not valid");
          }
        },
      },
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    hasPhoto: {
        type: DataTypes.BOOLEAN,
        defaultValue: false  // User starts without a photo
    },
    photo: {
      type: DataTypes.BLOB, // Storing photo as binary data (BLOB)
      allowNull: true,
    }
  },
  {
    timestamps: true, // Adds 'createdAt' and 'updatedAt'
  }
);

module.exports = User;
