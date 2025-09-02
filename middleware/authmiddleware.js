// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

// Verify JWT token
exports.verifyToken = (req, res, next) => {
  try {
    // Expecting header as: Authorization: Bearer <token>
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
      return res.status(403).json({ message: "No token provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
      }

      // Save decoded user info for next middlewares/controllers
      req.user = decoded; // { id, email, role }
      next();
    });
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ message: "Authentication failed" });
  }
};

// Role-based access control
exports.checkRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !roles.includes(req.user.role)) {
        return res
          .status(403)
          .json({ message: "Forbidden: insufficient role" });
      }
      next();
    } catch (error) {
      console.error("Role Middleware Error:", error);
      return res.status(500).json({ message: "Authorization failed" });
    }
  };
};
