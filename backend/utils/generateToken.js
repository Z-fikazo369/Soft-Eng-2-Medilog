// File: utils/generateToken.js
import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d", // Pwede mong i-adjust (e.g., '1h', '7d')
  });
};

export default generateToken;
