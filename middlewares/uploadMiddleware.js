// middlewares/uploadMiddleware.js
const multer = require("multer");
const path = require("path");

// const storage = multer.memoryStorage(); // Store files in memory as Buffer
// const upload = multer({ storage: storage });

const upload = multer({
  storage: multer.memoryStorage()
});

module.exports = upload;
