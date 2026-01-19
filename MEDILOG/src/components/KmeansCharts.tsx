
import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

// --- Interfaces (Galing sa code natin kanina) ---
export interface ClusterDetail {
  clusterId: number;
  label: string; // e.g., "Frequent Visitors with Serious Conditions"
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  count: number;
  percentage: string;
  avgVisits: string;
  avgSeverity: string;
  sampleStudents: Array<{ id: string; name: string; email: string }>;
  centroid: string[];
}

export interface KmeansResponse {
  success: boolean;
  period: string; // e.g., "Current Month (November)"
  totalStudents: number;
  numberOfClusters: number;
  clusters: ClusterDetail[];
  featureLabels: string[];
}

interface KmeansChartProps {
  kmeansData: KmeansResponse;
  loading: boolean;
}

const KmeansCharts: React.FC<KmeansChartProps> = ({ kmeansData, loading }) => {
  const { clusters, totalStudents, period } = kmeansData;

  // 1. Ihanda ang data para sa Risk Profile Doughnut Chart
  const riskLabels = ["Critical", "High", "Medium", "Low"];
  const riskColors = [
    "rgba(255, 99, 132, 0.8)", // Critical (Red)
    "rgba(255, 159, 64, 0.8)", // High (Orange)
    "rgba(54, 162, 235, 0.8)", // Medium (Blue)
    "rgba(75, 192, 192, 0.8)", // Low (Green)
  ];

  // Groupahin ang clusters by risk level
  const riskBreakdown = clusters.reduce((acc, cluster) => {
    acc[cluster.riskLevel] = (acc[cluster.riskLevel] || 0) + cluster.count;
    return acc;
  }, {} as { [key: string]: number });

  const doughnutData = {
    labels: riskLabels,
    datasets: [
      {
        data: riskLabels.map((label) => riskBreakdown[label] || 0),
        backgroundColor: riskColors,
        borderColor: riskColors.map((color) => color.replace("0.8", "1")),
        borderWidth: 1,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { position: "right" as const },
      title: {
        display: true,
        text: `Student Health Risk Profile (${period})`,
        font: { size: 16 },
      },
    },
  };

  // 2. Ihanda ang data para sa Actionable Table (Critical & High Risk lang)
  const highRiskClusters = clusters.filter(
    (c) => c.riskLevel === "Critical" || c.riskLevel === "High"
  );
  const totalHighRiskStudents = highRiskClusters.reduce(
    (sum, c) => sum + c.count,
    0
  );

  if (loading) {
    return (
      <div className="text-center py-5">
        <div
          className="spinner-border text-primary"
          style={{ width: "3rem", height: "3rem" }}
        ></div>
        <p className="mt-2">Running K-Means Clustering for Analysis...</p>
      </div>
    );
  }

  if (totalStudents === 0) {
    return (
      <div className="alert alert-info mt-4">
        <i className="bi bi-info-circle me-2"></i>No patient data available this
        month for health risk analysis.
      </div>
    );
  }

  return (
    <div className="row g-4">
      {/* 1. Risk Profile Doughnut Chart */}
      <div className="col-lg-6 col-12">
        <div className="card shadow-sm h-100">
          <div
            className="card-body"
            style={{ maxHeight: "450px", margin: "auto" }}
          >
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <p className="text-center text-muted small mt-2">
              Total Students Analyzed: {totalStudents}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Actionable High Risk Table */}
      <div className="col-lg-6 col-12">
        <div className="card shadow-sm h-100 border-danger">
          <div className="card-header bg-danger text-white">
            <h5 className="mb-0">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              High Priority Action Groups ({totalHighRiskStudents} Students)
            </h5>
          </div>
          <div className="card-body p-0 table-responsive">
            {highRiskClusters.length > 0 ? (
              <table className="table table-sm table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "60%" }}>Cluster Description</th>
                    <th>Students</th>
                    <th>Severity Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {highRiskClusters.map((cluster) => (
                    <tr
                      key={cluster.clusterId}
                      className={`table-${
                        cluster.riskLevel === "Critical" ? "danger" : "warning"
                      }-light`}
                    >
                      <td className="fw-semibold">
                        {cluster.label}
                        <span
                          className={`badge bg-${
                            cluster.riskLevel === "Critical"
                              ? "danger"
                              : "warning"
                          } ms-2`}
                        >
                          {cluster.riskLevel}
                        </span>
                      </td>
                      <td>{cluster.count}</td>
                      <td>{cluster.avgSeverity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="alert alert-success m-3">
                <i className="bi bi-check-circle me-2"></i>Great news! No
                students currently detected in Critical or High Risk groups this
                month.
              </div>
            )}
          </div>
          <div className="card-footer text-muted small">
            Risk is based on visit frequency and condition severity.
          </div>
        </div>
      </div>
    </div>
  );
};

export default KmeansCharts;
