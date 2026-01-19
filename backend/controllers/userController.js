// controllers/userController.js
import User from "../models/User.js";

export const uploadProfilePicture = async (req, res) => {
  try {
    const { userId } = req.params;

    // 🔍 DETAILED DEBUG LOGGING
    console.log("\n📦 ===== UPLOAD REQUEST RECEIVED =====");
    console.log("👤 User ID:", userId);
    console.log("📄 Content-Type:", req.headers["content-type"]);
    console.log("📁 req.file:", req.file);
    console.log("📝 req.body:", req.body);
    console.log("🔑 Has file?", !!req.file);
    console.log("=====================================\n");

    if (!req.file) {
      console.error("❌ NO FILE DETECTED IN REQUEST");
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // req.file.path contains the URL from Cloudinary
    user.profilePictureUrl = req.file.path;
    await user.save();

    // Return the updated user object (without sensitive data)
    const updatedUser = await User.findById(userId).select("-password -otp");

    console.log("✅ Profile picture uploaded successfully!");
    console.log("🔗 Cloudinary URL:", req.file.path);

    res.json({
      message: "Profile picture updated successfully!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ PFP Upload error:", error);
    res.status(500).json({ message: "Server error uploading image" });
  }
};
