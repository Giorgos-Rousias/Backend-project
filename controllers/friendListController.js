const db = require("../models");

exports.addFriend = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have authentication middleware
    const friendId = req.body.friendId;

    if (userId === friendId) {
      return res
        .status(400)
        .json({ message: "You cannot add yourself as a friend" });
    }

    const user = await db.User.findByPk(userId);
    const friend = await db.User.findByPk(friendId);

    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    // Check if they're already friends
    const existingFriendship = await db.UserFriends.findOne({
      where: { userId, friendId },
    });

    if (existingFriendship) {
      return res
        .status(400)
        .json({ message: "You are already friends with this user" });
    }

    // Add friend
    await user.addFriend(friend);

    res.status(200).json({ message: "Friend added successfully!" });
  } catch (error) {
    console.error("Error adding friend:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.removeFriend = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have authentication middleware
    const friendId = req.body.friendId;

    const user = await db.User.findByPk(userId);
    const friend = await db.User.findByPk(friendId);

    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    // Remove friend
    await user.removeFriend(friend);

    res.status(200).json({ message: "Friend removed successfully!" });
  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have authentication middleware

    const user = await db.User.findByPk(userId, {
      include: [
        {
          model: db.User,
          as: "Friends",
          through: { attributes: [] }, // Don't include the UserFriends table data
          attributes: ["id", "name", "surname", "email"], // Customize what fields you want to return
        },
      ],
    });

    res.status(200).json(user.Friends);
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ error: error.message });
  }
};
