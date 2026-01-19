// File: src/components/BackupRestoreView.tsx

import React, { useState, useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import { authAPI } from "../services/api";

// --- Interfaces ---
interface BackupFile {
  name: string;
  date: string;
  size: string; // e.g., "500 KB"
}

interface BackupRestoreViewProps {
  adminUsername: string;
}

const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({
  adminUsername,
}) => {
  // Used adminUsername to avoid the unused variable warning
  if (adminUsername) {
    // console.log(`Backup/Restore accessed by: ${adminUsername}`);
  }

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBackupList();
  }, []);

  // --- API Handlers ---

  const loadBackupList = async () => {
    try {
      setLoading(true);
      setError(""); // Clear previous errors
      const data = await authAPI.getBackupList();

      setBackups(data.backups || []);
    } catch (err: any) {
      console.error("Failed to load backup list:", err);
      setError(err.response?.data?.message || "Failed to load backup list.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (
      !window.confirm(
        "⚠️ Are you sure you want to generate a new system backup? This might take a moment."
      )
    )
      return;

    try {
      setLoading(true);
      setMessage("Creating backup... Please wait.");
      setError(""); // Clear previous errors

      const response = await authAPI.createSystemBackup();

      setMessage(response.message || "Backup created successfully!");
      loadBackupList();
    } catch (err: any) {
      console.error("Backup creation failed:", err);
      setError(err.response?.data?.message || "Failed to create backup.");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = async (filename: string) => {
    try {
      setError(""); // Clear previous errors
      const response = await authAPI.downloadBackup(filename);

      // File download logic (using blob)
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessage(`Successfully downloaded ${filename}.`);
      setError("");
    } catch (err: any) {
      console.error("Backup download failed:", err);
      setError(err.response?.data?.message || "Failed to download backup.");
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file && file.name.endsWith(".json")) {
      setSelectedFile(file);
      setError("");
    } else if (file) {
      setSelectedFile(null);
      setError("Invalid file type. Please select a JSON backup file.");
    } else {
      setError("");
    }
  };

  const handleRestoreSystem = async () => {
    if (!selectedFile) {
      setError("Please select a JSON file to restore.");
      return;
    }

    if (
      !window.confirm(
        `⚠️ CRITICAL ACTION: Are you absolutely sure you want to restore the system using "${selectedFile.name}"? This will permanently erase ALL current data.`
      )
    )
      return;

    try {
      setLoading(true);
      setMessage(
        `Restoring system from ${selectedFile.name}... DO NOT CLOSE THIS WINDOW.`
      );
      setError(""); // Clear previous errors

      const formData = new FormData();
      formData.append("backupFile", selectedFile);

      const response = await authAPI.restoreSystem(formData);

      setMessage(
        response.message || "System restored successfully! Please verify data."
      );
      setSelectedFile(null);
      fileInputRef.current && (fileInputRef.current.value = "");
      loadBackupList();
    } catch (err: any) {
      console.error("System restore failed:", err);
      setError(
        err.response?.data?.message ||
          "Failed to restore system. Please check the log."
      );
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  // --- JSX Render ---

  return (
    <div>
      <h3 className="mb-4 text-success">
        <i className="bi bi-gear-fill"></i> Backup & Restore
      </h3>
      <div className="row g-4">
        {/* Important Information Panel */}
        <div className="col-12">
          <div className="card shadow-sm border-warning">
            <div className="card-body">
              <h5 className="text-warning">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>{" "}
                Important Information
              </h5>
              <p className="mb-0">
                This page allows you to{" "}
                <strong>download backups of the MEDILOG system data</strong>.
                Exporting data from a backup is a manual process that must be
                performed by the system developer. If you require data
                restoration, please download the backup file and contact
                technical support.
              </p>
            </div>
          </div>
        </div>

        {/* Create Backup / Restore Panel */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-success text-white fw-bold">
              Create New Backup
            </div>
            <div className="card-body d-flex flex-column justify-content-between">
              <div>
                <p className="text-muted">
                  Generate a complete database backup of the MEDILOG system.
                </p>
                <p className="small">
                  This will create a comprehensive{" "}
                  <strong>JSON backup file</strong> containing all
                  system-related data, including{" "}
                  <strong>
                    medical records, student accounts, and system logs
                  </strong>
                  .
                </p>
                <button
                  className="btn btn-success w-100"
                  onClick={handleCreateBackup}
                  disabled={loading}
                >
                  {loading && message.includes("Creating") ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {message}
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cloud-upload me-2"></i> Create Backup
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* What gets backed up Panel */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-secondary text-white fw-bold">
              What Gets Backed Up?
            </div>
            <div className="card-body">
              <ul className="list-unstyled">
                <li>
                  <i className="bi bi-check-circle-fill text-success me-2"></i>{" "}
                  Student Account Profiles and Verification
                </li>
                <li>
                  <i className="bi bi-check-circle-fill text-success me-2"></i>{" "}
                  Physical Examination Records
                </li>
                <li>
                  <i className="bi bi-check-circle-fill text-success me-2"></i>{" "}
                  Medical Monitoring Records
                </li>
                <li>
                  <i className="bi bi-check-circle-fill text-success me-2"></i>{" "}
                  Medical Certificate Records
                </li>
                <li>
                  <i className="bi bi-check-circle-fill text-success me-2"></i>{" "}
                  System Activity/Audit Logs
                </li>
                <li>
                  <i className="bi bi-check-circle-fill text-success me-2"></i>{" "}
                  System Configuration and Settings
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* System Restore Panel */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100 border-danger">
            <div className="card-header bg-danger text-white fw-bold">
              System Restore (Critical)
            </div>
            <div className="card-body d-flex flex-column justify-content-between">
              <div>
                <p className="text-danger small fw-bold">
                  WARNING: Restoring the system will permanently erase the
                  current database. This should ONLY be done under technical
                  supervision.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileSelect}
                  className="form-control mb-3"
                />
                {selectedFile && (
                  <p className="small text-muted mb-3">
                    Selected file: <strong>{selectedFile.name}</strong>
                  </p>
                )}
                <button
                  className="btn btn-danger w-100"
                  onClick={handleRestoreSystem}
                  disabled={loading || !selectedFile}
                >
                  {loading && message.includes("Restoring") ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      {message}
                    </>
                  ) : (
                    <>
                      <i className="bi bi-arrow-counterclockwise me-2"></i>{" "}
                      Restore System
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status Messages - Error state is now rendered here */}
        <div className="col-12">
          {message && !loading && (
            <div className="alert alert-success mt-3">{message}</div>
          )}
          {error && <div className="alert alert-danger mt-3">{error}</div>}
          {loading &&
            !message.includes("Creating") &&
            !message.includes("Restoring") && (
              <div className="text-center py-3">
                <div className="spinner-border text-success me-2"></div>
                <p className="mt-2 text-muted">Loading...</p>
              </div>
            )}
        </div>

        {/* Existing Backups Table */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white fw-bold d-flex justify-content-between align-items-center">
              Existing Backups
              <button
                className="btn btn-sm btn-light"
                onClick={loadBackupList}
                disabled={loading}
              >
                <i
                  className={`bi bi-arrow-clockwise ${
                    loading ? "spinner-border spinner-border-sm" : ""
                  }`}
                ></i>{" "}
                Refresh
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-striped table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>File Name</th>
                      <th>Date Created</th>
                      <th>Size</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted">
                          No existing backup files found on the server.
                        </td>
                      </tr>
                    ) : (
                      backups.map((backup, index) => (
                        <tr key={backup.name}>
                          <td>{index + 1}</td>
                          <td>{backup.name}</td>
                          <td>{new Date(backup.date).toLocaleString()}</td>
                          <td>{backup.size}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleDownloadBackup(backup.name)}
                            >
                              <i className="bi bi-download"></i> Download
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupRestoreView;
