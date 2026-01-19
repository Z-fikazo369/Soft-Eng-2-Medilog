import express from "express";
import { getDashboardInsights } from "../controllers/analyticsController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Ito 'yung bagong endpoint na tatawagin ng React
// GET /api/analytics/insights
router.route("/insights").get(protect, isAdmin, getDashboardInsights);

export default router;
