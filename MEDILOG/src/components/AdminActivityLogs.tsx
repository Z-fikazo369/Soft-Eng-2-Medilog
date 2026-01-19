import React, { useState, useEffect } from "react";
import { adminActivityAPI } from "../services/api";
import "../styles/adminActivityLogs.css";

interface ActivityLog {
  _id: string;
  adminId: string;
  adminEmail: string;
  adminUsername: string;
  action: string;
  actionDetails: any;
  ipAddress: string;
  status: "success" | "failed";
  createdAt: string;
}

interface AdminActivityLogsProps {
  adminId?: string;
}

export const AdminActivityLogs: React.FC<AdminActivityLogsProps> = ({
  adminId,
}) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [filterDays, setFilterDays] = useState(7);

  useEffect(() => {
    loadActivityLogs();
  }, [page, selectedAction, filterDays, adminId]);

  const loadActivityLogs = async () => {
    try {
      setLoading(true);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - filterDays);

      const response = await adminActivityAPI.getActivityLogs(
        page,
        15,
        adminId,
        selectedAction,
        startDate.toISOString(),
        new Date().toISOString()
      );

      setLogs(response.logs || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error("Failed to load activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      LOGIN: "success",
      LOGOUT: "secondary",
      CREATE_RECORD: "primary",
      UPDATE_RECORD: "info",
      DELETE_RECORD: "danger",
      APPROVE_ACCOUNT: "success",
      REJECT_ACCOUNT: "danger",
      VIEW_RECORDS: "light",
      BULK_DELETE_RECORDS: "danger",
      BULK_UPDATE_STATUS: "warning",
      EXPORT_RECORDS: "primary",
      CREATE_BACKUP: "info",
      RESTORE_BACKUP: "warning",
      VIEW_ANALYTICS: "light",
    };
    return colors[action] || "secondary";
  };

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      LOGIN: "🔓",
      LOGOUT: "🔒",
      CREATE_RECORD: "➕",
      UPDATE_RECORD: "✏️",
      DELETE_RECORD: "🗑️",
      APPROVE_ACCOUNT: "✅",
      REJECT_ACCOUNT: "❌",
      VIEW_RECORDS: "👁️",
      BULK_DELETE_RECORDS: "🗑️🗑️",
      BULK_UPDATE_STATUS: "🔄",
      EXPORT_RECORDS: "📥",
      CREATE_BACKUP: "💾",
      RESTORE_BACKUP: "↩️",
      VIEW_ANALYTICS: "📊",
    };
    return icons[action] || "📋";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="admin-activity-logs">
      <div className="activity-header">
        <h5>📋 Admin Activity Logs</h5>
      </div>

      {/* Filters */}
      <div className="activity-filters mb-3">
        <div className="row g-2">
          <div className="col-md-6">
            <label className="form-label" style={{ fontSize: "0.85rem" }}>
              Filter by Action
            </label>
            <select
              className="form-select form-select-sm"
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="CREATE_RECORD">Create Record</option>
              <option value="UPDATE_RECORD">Update Record</option>
              <option value="DELETE_RECORD">Delete Record</option>
              <option value="APPROVE_ACCOUNT">Approve Account</option>
              <option value="REJECT_ACCOUNT">Reject Account</option>
              <option value="BULK_DELETE_RECORDS">Bulk Delete</option>
              <option value="BULK_UPDATE_STATUS">Bulk Update Status</option>
              <option value="EXPORT_RECORDS">Export Records</option>
              <option value="CREATE_BACKUP">Create Backup</option>
              <option value="RESTORE_BACKUP">Restore Backup</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label" style={{ fontSize: "0.85rem" }}>
              Last N Days
            </label>
            <select
              className="form-select form-select-sm"
              value={filterDays}
              onChange={(e) => {
                setFilterDays(parseInt(e.target.value));
                setPage(1);
              }}
            >
              <option value={1}>Last 24 Hours</option>
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="activity-list">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : logs.length > 0 ? (
          <div className="activity-items">
            {logs.map((log) => (
              <div
                key={log._id}
                className={`activity-item alert alert-${getActionColor(
                  log.action
                )} mb-2`}
                style={{ marginBottom: "0.5rem", padding: "0.75rem" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    gap: "0.5rem",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span
                        style={{ fontSize: "1.1rem", marginRight: "0.5rem" }}
                      >
                        {getActionIcon(log.action)}
                      </span>
                      <strong>{log.adminUsername}</strong> - {log.action}
                    </div>

                    <div
                      style={{
                        fontSize: "0.8rem",
                        opacity: 0.8,
                        marginBottom: "0.25rem",
                      }}
                    >
                      {formatDate(log.createdAt)}
                    </div>

                    {log.actionDetails?.recordType && (
                      <div style={{ fontSize: "0.8rem", opacity: 0.85 }}>
                        <span className="badge bg-dark">
                          {log.actionDetails.recordType}
                        </span>
                        {log.actionDetails.count && (
                          <span
                            className="badge bg-secondary ms-2"
                            style={{ marginLeft: "0.25rem" }}
                          >
                            Count: {log.actionDetails.count}
                          </span>
                        )}
                      </div>
                    )}

                    {log.actionDetails?.details && (
                      <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                        <em>{log.actionDetails.details}</em>
                      </div>
                    )}

                    <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                      IP: {log.ipAddress}
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                      minWidth: "60px",
                    }}
                  >
                    <span
                      className={`badge bg-${
                        log.status === "success" ? "success" : "danger"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted">
            <small>No activity logs found</small>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-3">
          <button
            className="btn btn-sm btn-outline-primary"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            ← Previous
          </button>
          <span className="align-self-center" style={{ fontSize: "0.9rem" }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-sm btn-outline-primary"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminActivityLogs;
