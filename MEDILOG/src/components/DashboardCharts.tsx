import React from "react";
import { Line, Doughnut, Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  type ChartOptions,
} from "chart.js";

// Kailangan i-register 'yung components na gagamitin
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

// --- Interface para sa data na ipapasa natin ---
export interface AggregationData {
  totalCount: number;
  dailyStats: { _id: string; count: number }[];
  statusStats: { _id: string; count: number }[];
  // ✅ BAGO: Gender Stats
  genderStats: { _id: string; count: number }[];
  // ✅ BAGO: Course Stats (Para sa Physical Exams lang ito)
  courseStats?: { _id: string; count: number }[];
}

interface ChartProps {
  physicalData: AggregationData;
  monitoringData: AggregationData;
  certificateData: AggregationData;
}

const lineChartOptions: ChartOptions<"line"> = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: true,
      text: "Daily Submissions (This Month)",
      font: {
        size: 16,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
        callback: function (value: string | number) {
          if (typeof value === "number" && value % 1 === 0) {
            return value;
          }
        },
      },
    },
    x: {
      type: "category" as const,
      ticks: {
        autoSkip: true,
        maxRotation: 45,
        minRotation: 45,
      },
    },
  },
};

const doughnutChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: "bottom" as const,
    },
    title: {
      display: true,
      text: "Submission Status Breakdown (This Month)",
      font: {
        size: 16,
      },
    },
  },
};

const pieChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: "right" as const,
    },
    title: {
      display: true,
      text: "Patient Gender Breakdown",
      font: {
        size: 16,
      },
    },
  },
};

const barChartOptions = {
  indexAxis: "y" as const,
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: "Top 5 Physical Exam Submissions by Course (This Month)",
      font: {
        size: 16,
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      title: {
        display: true,
        text: "Number of Submissions",
      },
    },
  },
};

export const DashboardCharts: React.FC<ChartProps> = ({
  physicalData,
  monitoringData,
  certificateData,
}) => {
  // 1. Ihanda ang data para sa Line Chart
  const labels = physicalData.dailyStats.map((stat) => {
    const date = new Date(stat._id);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  const lineChartData = {
    labels,
    datasets: [
      {
        label: "Physical Exams",
        data: physicalData.dailyStats.map((stat) => stat.count),
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        fill: false,
      },
      {
        label: "Monitoring",
        data: monitoringData.dailyStats.map((stat) => stat.count),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        fill: false,
      },
      {
        label: "Certificates",
        data: certificateData.dailyStats.map((stat) => stat.count),
        borderColor: "rgb(255, 206, 86)",
        backgroundColor: "rgba(255, 206, 86, 0.5)",
        fill: false,
      },
    ],
  };

  // 2. Ihanda ang data para sa Submission Doughnut Chart
  const allStatusStats = [
    ...physicalData.statusStats,
    ...monitoringData.statusStats,
    ...certificateData.statusStats,
  ];

  const statusTotals = allStatusStats.reduce((acc, stat) => {
    acc[stat._id] = (acc[stat._id] || 0) + stat.count;
    return acc;
  }, {} as { [key: string]: number });

  const doughnutChartData = {
    labels: ["Pending", "Approved", "Rejected"],
    datasets: [
      {
        label: "Total Submissions",
        data: [
          statusTotals.pending || 0,
          statusTotals.approved || 0,
          statusTotals.rejected || 0,
        ],
        backgroundColor: [
          "rgba(255, 206, 86, 0.8)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(255, 99, 132, 0.8)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // 3. ✅ BAGO: Gender Pie Chart Data
  const allGenderStats = [
    ...physicalData.genderStats,
    ...monitoringData.genderStats,
    ...certificateData.genderStats,
  ];

  const genderTotals = allGenderStats.reduce((acc, stat) => {
    const key = stat._id || "N/A";
    if (key && key.trim().length > 0) {
      acc[key] = (acc[key] || 0) + stat.count;
    }
    return acc;
  }, {} as { [key: string]: number });

  const genderLabels = Object.keys(genderTotals).sort();
  const genderDataArray = genderLabels.map((key) => genderTotals[key]);

  const genderPieData = {
    labels: genderLabels,
    datasets: [
      {
        label: "Total Visits",
        data: genderDataArray,
        backgroundColor: [
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 99, 132, 0.8)",
          "rgba(75, 192, 192, 0.8)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // 4. ✅ BAGO: Course Bar Chart Data (Physical Exam Only)
  const courseData = physicalData.courseStats
    ?.sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const courseLabels = courseData?.map((stat) => stat._id) || [];
  const courseCounts = courseData?.map((stat) => stat.count) || [];

  const courseBarData = {
    labels: courseLabels,
    datasets: [
      {
        label: "Physical Exam Count",
        data: courseCounts,
        backgroundColor: "rgba(54, 162, 235, 0.7)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="row g-4">
      {/* 1. Line Chart: Daily Submissions */}
      <div className="col-12">
        <div className="card shadow-sm h-100">
          <div className="card-body">
            <Line options={lineChartOptions} data={lineChartData} />
          </div>
        </div>
      </div>

      {/* 2. Doughnut Chart: Submission Status */}
      <div className="col-lg-6 col-md-6 col-12">
        <div className="card shadow-sm h-100">
          <div
            className="card-body"
            style={{ maxHeight: "400px", margin: "auto" }}
          >
            <Doughnut options={doughnutChartOptions} data={doughnutChartData} />
          </div>
        </div>
      </div>

      {/* 3. ✅ BAGO: Gender Pie Chart */}
      <div className="col-lg-6 col-md-6 col-12">
        <div className="card shadow-sm h-100">
          <div
            className="card-body"
            style={{ maxHeight: "400px", margin: "auto" }}
          >
            <Pie options={pieChartOptions} data={genderPieData} />
          </div>
        </div>
      </div>

      {/* 4. ✅ BAGO: Top 5 Courses Bar Chart */}
      <div className="col-12">
        <div className="card shadow-sm h-100">
          <div className="card-body">
            <Bar options={barChartOptions} data={courseBarData} />
          </div>
        </div>
      </div>
    </div>
  );
};
