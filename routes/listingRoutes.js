const express = require("express");
const router = express.Router();

const listingController = require("../controllers/listingController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/:id/applicants", authMiddleware, listingController.getApplicants);
router.post("/:id/apply", authMiddleware, listingController.applyToListing);

router.post("/", authMiddleware, listingController.create);
router.get("/", authMiddleware, listingController.getListings);
router.post("/:id/seen", authMiddleware, listingController.markAsSeen);
// router.put("/:id/", authMiddleware, listingController.update); // unused
// router.delete("/:id/", authMiddleware, listingController.delete); // unused

module.exports = router;