const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authenticateToken = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, notificationController.getNotifications);
router.put('/:id/', authenticateToken, notificationController.markAsRead);
router.delete('/:id/', authenticateToken, notificationController.deleteNotification);

module.exports = router;