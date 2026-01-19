// File: middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js"; //

// 1. Middleware para i-check kung valid ang token
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Kunin ang token mula sa header (e.g., "Bearer <token>")
      token = req.headers.authorization.split(" ")[1];

      // I-verify ang token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Kunin ang user data gamit ang ID mula sa token
      // at ilagay sa req object para magamit sa next function
      req.user = await User.findById(decoded.id).select("-password");

      next(); // Magpatuloy sa susunod na function (e.g., isAdmin)
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

// 2. Middleware para i-check kung ang role ay 'admin'
export const isAdmin = (req, res, next) => {
  // Titingnan nito 'yung 'req.user' na galing sa 'protect' middleware
  if (req.user && req.user.role === "admin") {
    //
    next(); // Admin, pwede magpatuloy
  } else {
    // 403 Forbidden - Valid 'yung login, pero hindi admin
    res.status(403).json({ message: "Not authorized. Admin access only." });
  }
};
