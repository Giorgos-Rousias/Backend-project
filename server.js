// server.js

const express = require("express");
const db = require("./models");
const app = express();

app.use(express.json()); // Middleware to parse JSON bodies

// Route to create a user
app.post("/users", async (req, res) => {
  try {
    // Create a new user with the request body
    const user = await db.User.create(req.body);
    // Respond with the newly created user
    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    // Respond with an error message
    res.status(500).json({ error: error.message });
  }
});

// Route to get all users
app.get("/users", async (req, res) => {
  try {
    const users = await db.User.findAll();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 8181;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
