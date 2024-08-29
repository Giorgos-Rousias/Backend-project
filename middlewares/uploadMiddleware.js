// middlewares/uploadMiddleware.js
const multer = require("multer");
const path = require("path");

// const storage = multer.memoryStorage(); // Store files in memory as Buffer
// const upload = multer({ storage: storage });

const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory to upload to the DB as a BLOB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|mp4|mp3|wav/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Error: File type not supported!"));
    }
  },
});

module.exports = upload;
