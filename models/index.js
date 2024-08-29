const sequelize = require("../sequelize");
const User = require("./user"); // Import the user model
const Experience = require("./userInfoModels/experience"); // Import the experience model
const Skill = require("./userInfoModels/skill"); // Import the skill model
const Education = require("./userInfoModels/education"); // Import the education model
const UserFriends = require("./userFriends"); // Import the userFriends model
const Post = require("./postsModels/post"); // Import the post model
const Comment = require("./postsModels/comment"); // Import the comment model
const Like = require("./postsModels/like"); // Import the like model

User.hasMany(Education, { foreignKey: "userId" });
Education.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Experience, { foreignKey: "userId" });
Experience.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Skill, { foreignKey: "userId" });
Skill.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Post, { foreignKey: "creatorUserId" });
Post.belongsTo(User, { foreignKey: "creatorUserId" });

Post.hasMany(Comment, { foreignKey: "postId" });
Comment.belongsTo(Post, { foreignKey: "postId" });

Post.hasMany(Like, { foreignKey: "postId" });
Like.belongsTo(Post, { foreignKey: "postId" });

// Inside your User model file (models/user.js)
User.belongsToMany(User, {
  as: 'Friends',
  through: 'UserFriends', // Junction table
  foreignKey: 'userId',
  otherKey: 'friendId',
});

Post.associate = (models) => {
  Post.belongsTo(models.User, {
    foreignKey: 'creatorUserId',
    as: 'creator', // Alias for the associated user
    onDelete: 'CASCADE',
  });
}

const db = {
    sequelize,
    User,
    Experience,
    Skill,
    Education,
    UserFriends,
    Post,
    Comment,
    Like,
    // Add other models here if needed
};

module.exports = db;
