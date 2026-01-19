// config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv"; // ✅ I-IMPORT ANG DOTENV DITO

dotenv.config(); // ✅ TAWAGIN ANG CONFIG AGAD DITO

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "medilog_profile_pictures",
    allowed_formats: ["jpg", "png", "jpeg"],
    transformation: [{ width: 200, height: 200, crop: "fill" }],
  },
});

const upload = multer({ storage: storage });

export default upload;
