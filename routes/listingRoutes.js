const express = require("express");
const router = express.Router();

const listingController = require("../controllers/listingController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/", authMiddleware, listingController.create);
router.put("/:id/", authMiddleware, listingController.update);
router.delete("/:id/", authMiddleware, listingController.delete);
router.get("/", authMiddleware, listingController.getListings);

module.exports = router;