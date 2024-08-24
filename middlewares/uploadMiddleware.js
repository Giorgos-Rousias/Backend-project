// middlewares/uploadMiddleware.js
const multer = require("multer");

const storage = multer.memoryStorage(); // Store files in memory as Buffer
const upload = multer({ storage: storage });

module.exports = upload;
