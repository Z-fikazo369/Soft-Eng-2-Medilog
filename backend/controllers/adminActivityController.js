import AdminActivityLog from "../models/AdminActivityLog.js";

// ✅ Helper function to log admin actions
export async function logAdminActivity(req, res, next) {
  try {
    const { action, actionDetails, status = "success" } = req.body;

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Get IP address
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown";

    const userAgent = req.headers["user-agent"] || "";

    const log = new AdminActivityLog({
      adminId: req.user._id,
      adminEmail: req.user.email,
      adminUsername: req.user.username,
      action,
      actionDetails,
      ipAddress,
      userAgent,
      status,
    });

    await log.save();
    res.status(201).json({
      message: "Activity logged successfully",
      log,
    });
  } catch (error) {
    console.error("❌ Log activity error:", error);
    res.status(500).json({ message: error.message });
  }
}

// ✅ Get admin activity logs with filtering and pagination
export async function getAdminActivityLogs(req, res) {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const {
      adminId,
      action,
      page = 1,
      limit = 20,
      startDate,
      endDate,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {};
    if (adminId) filter.adminId = adminId;
    if (action) filter.action = action;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const logs = await AdminActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await AdminActivityLog.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      logs,
      currentPage: parseInt(page),
      totalPages,
      totalCount,
    });
  } catch (error) {
    console.error("❌ Get activity logs error:", error);
    res.status(500).json({ message: error.message });
  }
}

// ✅ Get activity summary for dashboard
export async function getAdminActivitySummary(req, res) {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get login/logout counts
    const activityCounts = await AdminActivityLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get last logins per admin
    const lastLogins = await AdminActivityLog.aggregate([
      {
        $match: {
          action: "LOGIN",
          createdAt: { $gte: startDate },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: "$adminId",
          adminEmail: { $first: "$adminEmail" },
          adminUsername: { $first: "$adminUsername" },
          lastLogin: { $first: "$createdAt" },
          loginCount: { $sum: 1 },
        },
      },
      {
        $sort: { lastLogin: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.json({
      activityCounts,
      lastLogins,
    });
  } catch (error) {
    console.error("❌ Get activity summary error:", error);
    res.status(500).json({ message: error.message });
  }
}
