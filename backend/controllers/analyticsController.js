import MedicalMonitoring from "../models/MedicalMonitoring.js";
import PhysicalExam from "../models/PhysicalExam.js";
import MedicalCertificate from "../models/MedicalCertificate.js";
import User from "../models/User.js";

// ✅ UPDATED HELPER: "Bounded" Percentage (Max 100% para sa Increase)
const calculatePercentageChange = (current, previous) => {
  // 1. Kung pareho lang, walang change
  if (current === previous) return 0;

  // 2. Kung BUMABA (Decrease), gamitin ang standard formula (magiging negative ito)
  // Example: 10 -> 5 = -50%
  if (current < previous) {
    if (previous === 0) return 0; // Safety check
    return (((current - previous) / previous) * 100).toFixed(0);
  }

  // 3. Kung TUMAAS (Increase)
  // Gagamitin natin ang "New Case Ratio" para hindi lumampas sa 100%.
  // Formula: (Difference / Current Total) * 100
  // Example: 10 -> 35. Diff = 25. (25 / 35) = 71% increase contribution.
  if (current > 0) {
    const difference = current - previous;
    return ((difference / current) * 100).toFixed(0);
  }

  return 0;
};

// Keywords for respiratory detection
const getRespiratoryKeywords = () => {
  return /ubo|sipon|lagnat|cough|cold|fever|asthma|respiratory|sneezing|sore throat|trangkaso|flu/i;
};

export const getDashboardInsights = async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(new Date().setDate(today.getDate() - 7));
    const fourteenDaysAgo = new Date(new Date().setDate(today.getDate() - 14));

    // ======================================================
    // 📊 PART 1: TOP PROGRAM (All Forms Combined)
    // ======================================================

    // 1. Count from Physical Exam
    const physPromise = PhysicalExam.aggregate([
      { $match: { course: { $ne: null, $ne: "" } } },
      { $group: { _id: "$course", count: { $sum: 1 } } },
    ]);

    // 2. Count from Monitoring (Lookup student program)
    const monPromise = MedicalMonitoring.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      { $match: { "student.program": { $ne: null, $ne: "" } } },
      { $group: { _id: "$student.program", count: { $sum: 1 } } },
    ]);

    // 3. Count from Certificates (Lookup student program)
    const certPromise = MedicalCertificate.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      { $match: { "student.program": { $ne: null, $ne: "" } } },
      { $group: { _id: "$student.program", count: { $sum: 1 } } },
    ]);

    // ======================================================
    // 📉 PART 2: SYMPTOM TRENDS (Monitoring + Certificate)
    // ======================================================
    const respiratoryRegex = getRespiratoryKeywords();

    // THIS WEEK: Monitoring + Certificate
    const monThisWeekPromise = MedicalMonitoring.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
      symptoms: { $regex: respiratoryRegex },
      status: "approved",
    });

    const certThisWeekPromise = MedicalCertificate.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
      diagnosis: { $regex: respiratoryRegex }, // Diagnosis field naman dito
      status: "approved",
    });

    // LAST WEEK: Monitoring + Certificate
    const monLastWeekPromise = MedicalMonitoring.countDocuments({
      createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
      symptoms: { $regex: respiratoryRegex },
      status: "approved",
    });

    const certLastWeekPromise = MedicalCertificate.countDocuments({
      createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
      diagnosis: { $regex: respiratoryRegex },
      status: "approved",
    });

    // --- EXECUTE ALL QUERIES ---
    const [
      physResults,
      monResults,
      certResults,
      monThisWeek,
      certThisWeek,
      monLastWeek,
      certLastWeek,
    ] = await Promise.all([
      physPromise,
      monPromise,
      certPromise,
      monThisWeekPromise,
      certThisWeekPromise,
      monLastWeekPromise,
      certLastWeekPromise,
    ]);

    // ======================================================
    // 🧮 LOGIC: TALLYING RESULTS
    // ======================================================

    // Combine Counts for Top Program
    const programTally = {};
    const addToTally = (results) => {
      results.forEach((item) => {
        const programName = (item._id || "Unknown")
          .toString()
          .toUpperCase()
          .trim();
        if (!programTally[programName]) programTally[programName] = 0;
        programTally[programName] += item.count;
      });
    };

    addToTally(physResults);
    addToTally(monResults);
    addToTally(certResults);

    let topProgramName = "N/A";
    let topProgramCount = 0;

    Object.entries(programTally).forEach(([name, count]) => {
      if (count > topProgramCount) {
        topProgramCount = count;
        topProgramName = name;
      }
    });

    // Combine Counts for Trends
    const totalThisWeek = monThisWeek + certThisWeek;
    const totalLastWeek = monLastWeek + certLastWeek;

    // Calculate "Bounded" Percentage
    const symptomChange = calculatePercentageChange(
      totalThisWeek,
      totalLastWeek
    );

    res.json({
      topProgram: {
        name: topProgramName,
        count: topProgramCount,
      },
      symptomTrend: {
        thisWeek: totalThisWeek,
        lastWeek: totalLastWeek,
        changePercentage: symptomChange, // Max 100% logic applied
      },
    });
  } catch (error) {
    console.error("❌ Error fetching dashboard insights:", error);
    res.status(500).json({ message: "Failed to get analytics insights." });
  }
};
