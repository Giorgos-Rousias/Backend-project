// server.js

const express = require("express");
const sequelize = require("./models"); // Import sequelize instance
const User = require("./models/user"); // Import User model

const app = express();
app.use(express.json()); // Middleware for parsing JSON

// Sync database models
sequelize
  .sync({ force: true }) // Set 'force: true' to drop and recreate tables
  .then(() => {
    console.log("Database synced");
  })
  .catch((err) => {
    console.error("Error syncing the database:", err);
  });

// Create a new user
app.post("/users", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all users
app.get("/users", async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
