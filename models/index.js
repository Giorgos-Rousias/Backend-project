const sequelize = require("../sequelize");
const bcrypt = require("bcryptjs");

const User = require("./user"); // Import the user model
const Experience = require("./userInfoModels/experience"); // Import the experience model
const Skill = require("./userInfoModels/skill"); // Import the skill model
const Education = require("./userInfoModels/education"); // Import the education model
const UserFriends = require("./userFriends"); // Import the userFriends model
const Post = require("./postsModels/post"); // Import the post model
const Comment = require("./postsModels/comment"); // Import the comment model
const Like = require("./postsModels/like"); // Import the like model
const Chat = require("./chatModels/chat"); // Import the chat model
const Message = require("./chatModels/message"); // Import the chat model
const Notification = require("./notification"); // Import the notification model
const Listing = require("./listing"); // Import the listing model
const SeenListings = require("./seenListings"); // Import the seenListings model

User.hasMany(Education, { foreignKey: "userId" });
Education.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Experience, { foreignKey: "userId" });
Experience.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Skill, { foreignKey: "userId" });
Skill.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Like, { foreignKey: "userId" });
Like.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Comment, { foreignKey: "userId" });
Comment.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Post, { foreignKey: "creatorUserId" });
Post.belongsTo(User, { foreignKey: "creatorUserId" });

Post.hasMany(Comment, { foreignKey: "postId" });
Comment.belongsTo(Post, { foreignKey: "postId" });

Post.hasMany(Like, { foreignKey: "postId" });
Like.belongsTo(Post, { foreignKey: "postId" });

Chat.hasMany(Message, { foreignKey: "chatId" });
Message.belongsTo(Chat, { foreignKey: "chatId" });

Notification.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Notification, { foreignKey: "userId" });

Listing.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Listing, { foreignKey: "userId" });

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
User.belongsToMany(Listing, {
	as: 'AppliedToListing',
	through: 'UserApplications', // Junction table
	foreignKey: 'userId',
	otherKey: 'listingId',
});

Listing.belongsToMany(User, {
	as: 'Applicants',
	through: 'UserApplications', // Junction table
	foreignKey: 'listingId',
	otherKey: 'userId',
});

User.belongsToMany(Listing, {
    as: 'Seen', // Alias for the listings a user has seen
    through: 'SeenListings', // Junction table
    foreignKey: 'userId',
    otherKey: 'listingId',
});

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
	Chat,
	Message,
	Notification,
	Listing,
	SeenListings,
};

(async () => {
	try {
		const admin = await User.findOne({
			where: {
				email: 'admin@admin.com',
			}
		});

		if (!admin) {
			const hashedPassword = await bcrypt.hash("admin", 10); // Use await to resolve the promise
			
			await User.create({
				firstName: 'Admin',
				lastName: ' ',
				email: 'admin@admin.com',
				password: hashedPassword, // Ensure this is the resolved string
				isAdmin: true,
				phoneNumber: '1234567890',
				photo: null,
				hasPhoto: false,
			});
		}
	} catch (error) {
		console.error("Error connecting to the database: ", error);
		process.exit(1);
	}
})();

module.exports = db;
