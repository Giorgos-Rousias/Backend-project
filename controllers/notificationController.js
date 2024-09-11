const { response } = require('express');
const db = require('../models');
const { Op } = require("sequelize");


exports.createNotification = async (userId, type, sourceId, content) => {
    try {
        const user = await db.User.findByPk(userId);
        if (!user) {
            return console.error('User not found');
        }

        await db.Notification.create({
            userId,
            type,
            sourceId,
            content,
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const user = await db.User.findOne({
            where: {
                id: req.user.id,
            },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const commentlikes = await db.Notification.findAll({
            where: {
                userId: req.user.id,
                [Op.or]: [
                    { type: "like" },
                    { type: "comment" },
                ],
            },
            order: [['createdAt', 'DESC']],
        });

        const mappedLikesAndComments = await Promise.all(
            commentlikes.map(async (notification) => {
                if (notification.type === 'like') { 
                    const like = await db.Like.findByPk(notification.sourceId);
                    if (!like) {
                        return null;
                    }

                    const post = await db.Post.findByPk(like.postId);
                    if (!post) {
                        return null;
                    }

                    const user = await db.User.findByPk(like.userId);
                    if (!user) {
                        return null;
                    }

                    return {
                        type: 'like',
                        postId: post.id,
                        userId: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        profilePicture: user.photo ? `data:image/jpeg;base64,${user.photo.toString('base64')}` : null,
                        notificationId: notification.id,
                        createdAt: notification.createdAt,
                    };
                } else {
                    const comment = await db.Comment.findByPk(notification.sourceId);
                    if (!comment) {
                        return null;
                    }

                    const post = await db.Post.findByPk(comment.postId);
                    if (!post) {
                        return null;
                    }

                    const user = await db.User.findByPk(comment.userId);
                    if (!user) {
                        return null;
                    }

                    return {
                        type: 'comment',
                        postId: post.id,
                        userId: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        profilePicture: user.photo ? `data:image/jpeg;base64,${user.photo.toString('base64')}` : null,
                        commentId: comment.id,
                        commentContent: comment.text,
                        notificationId: notification.id,
                        createdAt: notification.createdAt,
                    };
                }
            })
        );


        const friendRequests = await db.Notification.findAll({
            where: {
                userId: req.user.id,
                type: "friendRequest"
            },
            order: [['createdAt', 'DESC']],
        });

        const mappedFriendReqeusts = await Promise.all(
            friendRequests.map(async (notification) => {
                const friendShip = await db.UserFriends.findByPk(notification.sourceId);
                if (!friendShip) {
                    return null;
                }

                const user = await db.User.findByPk(friendShip.userId);

                if (!user) {
                    return null;
                }

                return {
                    userId: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    profilePicture: user.photo ? `data:image/jpeg;base64,${user.photo.toString('base64')}` : null,
                    notificationId: notification.id,
                    createdAt: notification.createdAt,
                    type: 'friendRequest',
                };
            })
        );

        const notifications = {
            likesAndComments: mappedLikesAndComments,
            friendRequests: mappedFriendReqeusts,
        };

        res.status(200).json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const notification = await db.Notification.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id,
            },
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        await notification.update({
            read: true,
        });

        res.status(200).json({ message: 'Notification updated successfully' });
    } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const notification = await db.Notification.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id,
            },
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        await notification.destroy();

        res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteAllNotifications = async (req, res) => {
    try {
        // await db.Notification.destroy();
        const notifications = await db.Notification.findAll();
        await Promise.all(notifications.map(async (notification) => {
            await notification.destroy();
        }));

        res.status(200).json({ message: 'All notifications deleted successfully' });
    } catch (error) {
        console.error('Error deleting notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
}