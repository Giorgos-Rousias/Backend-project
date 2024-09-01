const db = require('../models');

const createNotification = async (userId, type, sourceId, content) => {
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

const getNotifications = async (req, res) => {
    try {
        const user = await db.User.findOne({
            where: {
                id: req.user.id,
            },
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const notifications = await db.Notification.findAll({
            where: {
                userId: req.user.id,
            },
            order: [['createdAt', 'DESC']],
        });

        res.status(200).json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const markAsRead = async (req, res) => {
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

const deleteNotification = async (req, res) => {
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