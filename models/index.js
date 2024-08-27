const sequelize = require("../sequelize");
const User = require("./user"); // Import the user model
const Experience = require("./experience"); // Import the experience model
const Skill = require("./skill"); // Import the skill model
const Education = require("./education"); // Import the education model

User.hasMany(Education, { foreignKey: "userId" });
Education.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Experience, { foreignKey: "userId" });
Experience.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Skill, { foreignKey: "userId" });
Skill.belongsTo(User, { foreignKey: "userId" });

// Inside your User model file (models/user.js)
User.belongsToMany(User, {
  as: 'Friends',
  through: 'UserFriends', // Junction table
  foreignKey: 'userId',
  otherKey: 'friendId',
});


const db = {
    sequelize,
    User,
    Experience,
    Skill,
    Education
    // Add other models here if needed
};

module.exports = db;
