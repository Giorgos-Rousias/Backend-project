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

router.get("skills", authenticateToken, skillController.getSkill);
router.post("/skills", authenticateToken, skillController.create);
router.put("/skills", authenticateToken, skillController.update);
router.delete("/skills", authenticateToken, skillController.delete);

router.get("/experience", authenticateToken, experienceController.getExperience);
router.post("/experience", authenticateToken, experienceController.create);
router.put("/experience", authenticateToken, experienceController.update);
router.delete("/experience", authenticateToken, experienceController.delete);

//! For testing purposes ONLY
router.get("/allEducation", educationContoller.getAll);
router.get("/allExperience", experienceController.getAll);
router.get("/allSkills", skillController.getAll);

module.exports = router;
