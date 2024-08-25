const express = require("express");
const router = express.Router();

// Controllers
const educationContoller = require("../controllers/educationController");
const experienceController = require("../controllers/experienceController");
const skillController = require("../controllers/skillController");

// Middleware
const authenticateToken = require("../middlewares/authMiddleware");

router.get("/education", authenticateToken, educationContoller.getEducation);
router.post("/education", authenticateToken, educationContoller.create);
router.put("/education", authenticateToken, educationContoller.update);
router.delete("/education", authenticateToken, educationContoller.delete);


//! For testing purposes ONLY
router.get("/allEducation", educationContoller.getAll);

module.exports = router;
