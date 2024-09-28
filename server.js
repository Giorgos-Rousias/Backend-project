const express = require("express");
const app = express();
const cors = require("cors");

require('dotenv').config(); // Load environment variables

// Import routes
const userRoutes = require("./routes/userRoutes");
const userInfoRoutes = require("./routes/userInfoRoutes");
const authRoutes = require("./routes/authRoutes");
const friendlistRoutes = require("./routes/friendlistRoutes");
const postRoutes = require("./routes/postRoutes");
const chatRoutes = require("./routes/chatRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const listingRoutes = require("./routes/listingRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Middleware
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors());

// Add routes
app.use("/users", userRoutes);
app.use("/auth", authRoutes); // Mount authentication routes
app.use("/userInfo", userInfoRoutes);
app.use("/friends", friendlistRoutes);
app.use("/posts", postRoutes);
app.use("/chats", chatRoutes);
app.use("/notifications", notificationRoutes);
app.use("/listings", listingRoutes);
app.use("/admin", adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({ error: err.message });
});

const PORT = process.env.PORT || 8181;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
