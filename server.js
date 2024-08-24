// server.js

const express = require("express");
const db = require("./models");
const app = express();
const multer = require("multer");

app.use(express.json()); // Middleware to parse JSON bodies

const storage = multer.memoryStorage(); // Store files in memory as Buffer
const upload = multer({ storage: storage });

// Create a route for uploading a user with a photo
app.post("/upload", upload.single("photo"), async (req, res) => {
  try {
    const { name, surname, email, password, phoneNumber, isAdmin } = req.body;

    // Get the binary data of the uploaded photo
    const photoBuffer = req.file ? req.file.buffer : null;

    // Determine if the user has uploaded a photo
    const hasPhoto = !!photoBuffer;

    // Save user data to the database with the photo as a BLOB
    const user = await db.User.create({
      name,
      surname,
      email,
      password,
      phoneNumber,
      isAdmin: isAdmin === "true", // Convert string to boolean if needed
      photo: photoBuffer,
      hasPhoto, // Set the boolean flag for whether the user has a photo
    });

    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    console.error("Error creating user:", error);
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
});


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

app.get("/users2", async (req, res) => {
  try {
    const users = await db.User.findAll({
      attributes: { exclude: ["photo"] }, // Exclude the 'photo' field from the result
    });
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
