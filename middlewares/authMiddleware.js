const jwt = require("jsonwebtoken");

// Middleware to authenticate and authorize users
const authenticateToken = (req, res, next) => {
  // Get the token from the Authorization header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401); // If no token, return Unauthorized

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // If invalid token, return Forbidden

    req.user = user; // Add user info to request object
    next(); // Proceed to the next middleware or route handler
  });
};

module.exports = authenticateToken;
