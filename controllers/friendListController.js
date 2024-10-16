const db = require("../models");
const createNotification = require("./notificationController").createNotification;
const { Op } = require("sequelize");

exports.sendFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id; // The logged-in user
    const friendId = req.body.friendId; // The user to whom the friend request is being sent

    if (userId === friendId) {
      return res
        .status(400)
        .json({ message: "You cannot send a friend request to yourself" });
    }

    const user = await db.User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "Your user was not found" });
    }

    const friend = await db.User.findByPk(friendId);

    if (!friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if a friend request already exists
    const existingFriendship = await db.UserFriends.findOne({
      where: { userId, friendId },
    });

    if (existingFriendship) {
      existingFriendship.destroy();
    }

    // Create a new friend request with status 'pending'
    const request = await db.UserFriends.create({ userId, friendId});

    // Create a notification for the friend
    await createNotification(
      friendId,
      "friendRequest",
      request.id,
      `${user.firstName} ${user.lastName} sent you a friend request`,
    );

    res.status(200).json({ message: "Friend request sent" });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.respondToFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id; // The logged-in user (recipient of the request)
    const friendId = req.body.friendId; // The user who sent the friend request
    const action = req.body.action; // 'accept' or 'reject'

    const friendRequest = await db.UserFriends.findOne({
      where: { userId: friendId, friendId: userId, status: "pending" },
    });

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (action === "accept") {
      // Update the status to 'accepted'
      friendRequest.status = "accepted";
      await friendRequest.save();

      // Create the reverse relationship to make the friendship mutual
      await db.UserFriends.create({
        userId: userId,
        friendId: friendId,
        status: "accepted",
      });

      res.status(200).json({ message: "Friend request accepted successfully" });
    } else if (action === "reject") {
      // Delete the friend request record
      await friendRequest.destroy();
      res.status(200).json({ message: "Friend request rejected and removed" });
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.error("Error responding to friend request:", error);
    res.status(500).json({ error: error.message });
  }
};


exports.getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.id; // The logged-in user

    const pendingRequests = await db.UserFriends.findAll({
      where: { friendId: userId, status: "pending" },
    });

    res.status(200).json(pendingRequests);
  } catch (error) {
    console.error("Error fetching pending friend requests:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.removeFriend = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have authentication middleware
    const friendId = req.body.friendId;

    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const friend = await db.User.findByPk(friendId);

    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    // Check if the user is friends with the friend
    const friendship = await db.UserFriends.findAll({
      where: {
        [Op.or]: [
          { userId: userId, friendId: friendId },
          { userId: friendId, friendId: userId },
        ],
        status: "accepted",
      },
    });

    if (!friendship) {
      return res.status(404).json({ message: "Friend not found" });
    }

    friendship.forEach(friend => {
      friend.destroy();
    });

    res.status(200).json({ message: "Friend removed successfully!" });
  } catch (error) {
    console.error("Error removing friend:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.id; // The logged-in user

    const friends = await db.User.findAll({
      where: { id: userId }, // Find the logged-in user
      attributes: [], // Omit the user attributes
      include: [
        {
          model: db.User,
          as: "Friends",
          through: { where: { status: "accepted" }, attributes: [] }, // Omit the junction table attributes
          attributes: ["id", "firstName", "lastName", "photo"], // Specify attributes for friends
          include : [{
            model: db.Experience,
            required: false,
            where: { isPrivate: false, endYear: null },
            limit: 1
          }]
        },
      ],
    });

    const friendsList = friends.flatMap(user => 
      user.Friends.map(friend => ({
          id: friend.id,
          firstName: friend.firstName,
          lastName: friend.lastName,
          photo: friend.photo ? `data:image/jpeg;base64,${friend.photo.toString('base64')}` : null,
          role: friend.Experiences.length > 0 ? friend.Experiences[0].role : null,
          company: friend.Experiences.length > 0 ? friend.Experiences[0].company : null,
      }))
    );

    res.status(200).json(friendsList);

  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getPendingRequestsSend = async (req, res) => {
  try {
    const userId = req.user.id; // The logged-in user

    // Find all pending friend requests sent by the user
    const sentRequests = await db.UserFriends.findAll({
      where: {
        userId: userId, // The logged-in user who sent the requests
        status: "pending", // Only pending friend requests
      },
      attributes: ["friendId", "createdAt"],
    });

    res.status(200).json(sentRequests);
  } catch (error) {
    console.error("Error fetching sent friend requests:", error);
    res.status(500).json({ error: error.message });
  }
},

exports.getAllFriends = async (req, res) => {
	try {
    const friendsLists = await db.UserFriends.findAll();

    res.status(200).json(friendsLists);
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.checkFriends = async (req, res) => {
  try {
    const userId = req.user.id; // The logged-in user
    const friendId = req.params.id; // The user to check friendship with

    if (userId === friendId) {
      return res.status(400).json({ message: "You cannot check friendship with yourself" });
    }

    const friendship = await db.UserFriends.findOne({
      where: {
        [Op.or]: [
          { userId: userId, friendId: friendId },
          { userId: friendId, friendId: userId },
        ],
        status: "accepted",
      },
    });

    let response = null;
    if (friendship) {
      response = { isFriend: true };
    } else {
      response = { isFriend: false };
    }
    res.status(200).json(response);
  } catch (error) {
    console.error("Error checking friends:", error);
    res.status(500).json({ error: error});
  }
}