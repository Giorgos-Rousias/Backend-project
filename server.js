// server.js
const express = require("express");
const app = express();
const userRoutes = require("./routes/userRoutes");

app.use(express.json()); // Middleware to parse JSON bodies

// Use user routes
app.use("/users", userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({ error: err.message });
});

const PORT = process.env.PORT || 8181;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
