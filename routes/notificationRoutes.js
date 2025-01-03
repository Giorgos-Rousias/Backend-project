const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authenticateToken = require('../middlewares/authMiddleware');

router.delete('/', notificationController.deleteAllNotifications);

router.get('/', authenticateToken, notificationController.getNotifications);
// router.put('/:id/', authenticateToken, notificationController.markAsRead); // unused
router.delete('/:id/', authenticateToken, notificationController.deleteNotification);


module.exports = router;