const sequelize = require("../sequelize");
const User = require("./user"); // Import the user model
const Experience = require("./experience"); // Import the experience model
const Skill = require("./skill"); // Import the skill model
const Education = require("./education"); // Import the education model


const db = {
    sequelize,
    User,
    Experience,
    Skill,
    Education
    // Add other models here if needed
};

module.exports = db;
