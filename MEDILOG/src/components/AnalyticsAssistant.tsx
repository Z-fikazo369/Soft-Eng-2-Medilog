import React, { useState, useEffect } from "react";
import { analyticsAPI, type DashboardInsights } from "../services/api";

const AnalyticsAssistant: React.FC = () => {
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const data = await analyticsAPI.getDashboardInsights();
        setInsights(data);
      } catch (err) {
        console.error("Failed to fetch analytics insights:", err);
        setError("Could not load insights.");
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  const renderSymptomTrend = () => {
    if (!insights) return null;
    const { changePercentage } = insights.symptomTrend;

    if (changePercentage > 0) {
      return (
        <li className="list-group-item d-flex align-items-center">
          <i className="bi bi-graph-up-arrow text-danger me-3 fs-4"></i>
          <div>
            There is a{" "}
            <strong className="text-danger">
              {changePercentage}% increase
            </strong>{" "}
            in respiratory-related symptoms (e.g., cough, fever) compared to
            last week.
          </div>
        </li>
      );
    } else if (changePercentage < 0) {
      return (
        <li className="list-group-item d-flex align-items-center">
          <i className="bi bi-graph-down-arrow text-success me-3 fs-4"></i>
          <div>
            Good news! There is a{" "}
            <strong className="text-success">
              {Math.abs(changePercentage)}% decrease
            </strong>{" "}
            in respiratory-related symptoms compared to last week.
          </div>
        </li>
      );
    } else {
      return (
        <li className="list-group-item d-flex align-items-center">
          <i className="bi bi-graph-up text-muted me-3 fs-4"></i>
          <div>
            Respiratory-related symptoms are stable with no significant change
            from last week.
          </div>
        </li>
      );
    }
  };

  const renderTopProgram = () => {
    if (!insights || insights.topProgram.count === 0) return null;
    const { name, count } = insights.topProgram;

    return (
      <li className="list-group-item d-flex align-items-center">
        <i className="bi bi-award-fill text-primary me-3 fs-4"></i>
        <div>
          Students from <strong>{name || "N/A"}</strong> have the highest
          monitoring submissions with {count} records.
        </div>
      </li>
    );
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-success-subtle d-flex align-items-center">
        <i className="bi bi-robot me-2 fs-5 text-success"></i>
        <h5 className="mb-0 text-success fw-bold">Analytics Assistant</h5>
      </div>
      <div className="card-body">
        {loading && (
          <div className="text-center py-3">
            <div
              className="spinner-border spinner-border-sm text-success"
              role="status"
            >
              <span className="visually-hidden">Loading insights...</span>
            </div>
            <span className="ms-2 text-muted">Analyzing data...</span>
          </div>
        )}

        {error && <div className="alert alert-warning mb-0">{error}</div>}

        {!loading && !error && insights && (
          <ul className="list-group list-group-flush">
            {renderSymptomTrend()}
            {renderTopProgram()}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AnalyticsAssistant;
