const express = require("express");
const app = express();

require('dotenv').config(); // Load environment variables

// Import routes
const userRoutes = require("./routes/userRoutes");
const userInfoRoutes = require("./routes/userInfoRoutes");
const authRoutes = require("./routes/authRoutes");
const friendlistRoutes = require("./routes/friendlistRoutes");

// Middleware
app.use(express.json()); // Middleware to parse JSON bodies

// Add routes
app.use("/users", userRoutes);
app.use("/auth", authRoutes); // Mount authentication routes
app.use("/userInfo", userInfoRoutes);
app.use("/friendlist", friendlistRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({ error: err.message });
});

const PORT = process.env.PORT || 8181;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
