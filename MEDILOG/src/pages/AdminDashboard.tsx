import { useState, useEffect, useRef } from "react";
import type { ChangeEvent, DragEvent, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { medicalAPI, authAPI, userAPI, type SortConfig } from "../services/api";
import "../styles/adminportal.css";
import PaginationControls from "../components/PaginationControls";
import {
  DashboardCharts,
  type AggregationData,
} from "../components/DashboardCharts";
import KmeansCharts, { type KmeansResponse } from "../components/KmeansCharts";
import BackupRestoreView from "../components/BackupRestoreView";
import AnalyticsAssistant from "../components/AnalyticsAssistant";
import FaceCaptureModal from "../components/common/FaceCaptureModal";
import AdminActivityLogs from "../components/AdminActivityLogs";

// --- Interfaces ---

interface MedicalRecord {
  _id: string;
  studentId: {
    _id: string;
    username: string;
    email: string;
  };
  studentName: string;
  studentEmail: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  [key: string]: any;
}

interface StudentAccount {
  _id: string;
  username: string;
  email: string;
  lrn: string;
  studentId: string;
  defaultLoginMethod?: "email" | "studentId";
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  idPictureUrl?: string;
}

// ✅ I-UPDATE: Idagdag ang 'backup' sa ViewType
type ViewType =
  | "dashboard"
  | "patientRecords"
  | "accounts"
  | "backup"
  | "activityLogs";
type RecordType = "physicalExam" | "monitoring" | "certificate";

const AdminDashboard: React.FC = () => {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState<ViewType>("dashboard");
  const [recordType, setRecordType] = useState<RecordType>("physicalExam");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // --- State para sa Patient Records (Pagination + Sorting) ---
  const [patientRecords, setPatientRecords] = useState<MedicalRecord[]>([]);
  const [patientCurrentPage, setPatientCurrentPage] = useState(1);
  const [patientTotalPages, setPatientTotalPages] = useState(0);
  const [patientTotalCount, setPatientTotalCount] = useState(0);
  const [patientRowsPerPage, setPatientRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig[]>([
    { key: "createdAt", order: "desc" },
  ]);

  // --- State para sa Accounts (Pagination) ---
  const [studentAccounts, setStudentAccounts] = useState<StudentAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountCurrentPage, setAccountCurrentPage] = useState(1);
  const [accountTotalPages, setAccountTotalPages] = useState(0);
  const [accountTotalCount, setAccountTotalCount] = useState(0);
  const [accountRowsPerPage, setAccountRowsPerPage] = useState(10);
  const [pendingCount, setPendingCount] = useState(0);

  // --- State para sa Modals & Uploads ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(
    null
  );
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showIdModal, setShowIdModal] = useState<string | null>(null);
  const [showFaceCaptureModal, setShowFaceCaptureModal] = useState(false);

  // ✅ STATE PARA SA DASHBOARD STATS
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [physicalData, setPhysicalData] = useState<AggregationData | null>(
    null
  );
  const [monitoringData, setMonitoringData] = useState<AggregationData | null>(
    null
  );
  const [certificateData, setCertificateData] =
    useState<AggregationData | null>(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [kmeansData, setKmeansData] = useState<KmeansResponse | null>(null);

  // --- Data Loading Effects ---

  // ✅ I-UPDATE ang fetchDashboardData para tumanggap ng 'isSilent' parameter
  //    Para kapag nag-auto refresh, hindi iikot yung malaking loading spinner.
  const fetchDashboardData = async (isSilent = false) => {
    try {
      // Kapag silent refresh (auto-reload), wag ipakita ang loading spinner
      if (!isSilent) setLoadingDashboard(true);

      // KUNIN: Total Registered Accounts
      const totalCountResponse = await authAPI.getTotalStudentCount();
      setTotalStudents(totalCountResponse.totalCount);

      // KUNIN: Pending Counts (Quick Card)
      authAPI
        .getPendingAccounts()
        .then((data) => setPendingCount(data.count || 0));

      // KUNIN: Aggregation Data (Current Month Charts)
      const [phys, mon, cert, kmeansRes] = await Promise.all([
        medicalAPI.getAggregation("physicalExam"),
        medicalAPI.getAggregation("monitoring"),
        medicalAPI.getAggregation("certificate"),
        medicalAPI.getEnhancedClusteringAnalysis(),
      ]);

      setPhysicalData(phys);
      setMonitoringData(mon);
      setCertificateData(cert);
      setKmeansData(kmeansRes);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      // Wag mag-alert kapag silent refresh lang para hindi nakaka-istorbo
      if (!isSilent) {
        // alert("Failed to load dashboard data.");
      }
    } finally {
      if (!isSilent) setLoadingDashboard(false);
    }
  };

  // ✅ I-UPDATE ang useEffect para sa Auto-Refresh
  useEffect(() => {
    if (!user) return;

    if (view === "dashboard") {
      // Initial Load (May spinner)
      fetchDashboardData();

      // Auto-Refresh every 10 seconds (Walang spinner / Silent)
      const intervalId = setInterval(() => {
        fetchDashboardData(true);
      }, 10000);

      // Cleanup: Itigil ang timer kapag lumipat ng ibang page
      return () => clearInterval(intervalId);
    }
  }, [view, user]);

  useEffect(() => {
    if (view === "patientRecords") {
      setPatientCurrentPage(1);
      setSortConfig([{ key: "createdAt", order: "desc" }]);
      // ✅ Load records immediately when view changes
      loadRecords(1, [{ key: "createdAt", order: "desc" }], patientRowsPerPage);
    } else if (view === "accounts") {
      setAccountCurrentPage(1);
      loadStudentAccounts(1);
      loadPendingCount();
    }
  }, [view, recordType, patientRowsPerPage]);

  useEffect(() => {
    if (view === "patientRecords") {
      loadRecords(patientCurrentPage, sortConfig, patientRowsPerPage);
    }
  }, [patientCurrentPage, sortConfig, recordType, patientRowsPerPage]);

  useEffect(() => {
    if (view === "accounts") {
      loadStudentAccounts(accountCurrentPage, accountRowsPerPage);
    }
  }, [accountCurrentPage, accountRowsPerPage]);

  // --- API Functions ---

  const loadRecords = async (
    page: number,
    sort: SortConfig[],
    limit: number = patientRowsPerPage
  ) => {
    try {
      setLoading(true);
      const response = await medicalAPI.getAllRecords(
        recordType,
        page,
        sort,
        limit
      );
      setPatientRecords(response.records || []);
      setPatientCurrentPage(response.currentPage);
      setPatientTotalPages(response.totalPages);
      setPatientTotalCount(response.totalCount);
    } catch (error) {
      console.error("Failed to load records:", error);
      alert("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const loadPendingCount = async () => {
    try {
      const response = await authAPI.getPendingAccounts();
      setPendingCount(response.count || 0);
    } catch (error) {
      console.error("Failed to load pending account count:", error);
    }
  };

  const loadStudentAccounts = async (
    page: number,
    limit: number = accountRowsPerPage
  ) => {
    try {
      setLoadingAccounts(true);
      const response = await authAPI.getAllStudentAccounts(page, limit);
      setStudentAccounts(response.accounts || []);
      setAccountTotalPages(response.totalPages || 0);
      setAccountTotalCount(response.totalCount || 0);
      setAccountCurrentPage(response.currentPage || 1);
    } catch (error) {
      console.error("Failed to load student accounts:", error);
      alert("Failed to load student accounts. Please check your connection.");
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleApproveAccount = async (
    accountId: string,
    username: string,
    defaultLoginMethod?: "email" | "studentId"
  ) => {
    const method = defaultLoginMethod || "email";

    if (
      !window.confirm(
        `⚠️ HAVE YOU VERIFIED THIS STUDENT'S ID?\n\nApprove account for ${username}?\n\nStudent's chosen login method: ${
          method === "studentId" ? "Student ID" : "Email"
        }\nPassword will be set to their LRN.\n\nAn email notification will be sent.`
      )
    )
      return;

    try {
      await authAPI.approveAccount(accountId, user?._id || "");

      alert(
        `✅ Account approved!\n\n${username} can now login using:\n• ${
          method === "studentId" ? "Student ID" : "Email"
        }\n• LRN as password\n\n📧 An approval email has been sent. OTP will be required at login.`
      );

      loadStudentAccounts(accountCurrentPage);
      loadPendingCount();
    } catch (error: any) {
      console.error("Failed to approve account:", error);
      alert(error.response?.data?.message || "Failed to approve account");
    }
  };

  const handleRejectAccount = async (accountId: string, username: string) => {
    if (
      !window.confirm(
        `Reject account for ${username}? This action cannot be undone.`
      )
    )
      return;

    try {
      await authAPI.rejectAccount(accountId, user?._id || "");
      alert(`Account for ${username} has been rejected.`);
      loadStudentAccounts(accountCurrentPage);
      loadPendingCount();
    } catch (error: any) {
      console.error("Failed to reject account:", error);
      alert(error.response?.data?.message || "Failed to reject account");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this single record?"
      )
    )
      return;
    try {
      await medicalAPI.deleteRecord(id, recordType);
      alert("Record deleted successfully");
      loadRecords(patientCurrentPage, sortConfig);
    } catch (error) {
      alert("Failed to delete record");
    }
  };

  const handleEdit = (record: MedicalRecord) => {
    setEditingRecord(record);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    try {
      await medicalAPI.updateRecord(
        editingRecord._id,
        recordType,
        editingRecord
      );
      alert("Record updated successfully");
      setShowEditModal(false);
      setEditingRecord(null);
      loadRecords(patientCurrentPage, sortConfig);
    } catch (error) {
      alert("Failed to update record");
    }
  };

  // ✅ PRINT FEATURE FUNCTION (FIXED) - FOR SINGLE RECORD (MODAL)
  const handlePrint = () => {
    if (!editingRecord) return;

    const printableContent = document.getElementById("printable-record");

    if (printableContent) {
      const printContents = printableContent.innerHTML;

      const printWindow = window.open("", "", "height=600,width=800");
      if (printWindow) {
        printWindow.document.write("<html><head><title>Print Record</title>");
        printWindow.document.write(
          '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/5.0.0-alpha1/css/bootstrap.min.css">'
        );
        printWindow.document.write("<style>");
        printWindow.document.write("@media print {");
        // FIX: Ito ang CSS na nag-aayos ng display para sa print.
        printWindow.document.write("  .modal-footer { display: none; }");
        printWindow.document.write(
          "  .form-control, .form-select, input, select, textarea { border: none !important; padding: 0 !important; background: transparent !important; box-shadow: none !important; resize: none !important; }"
        );
        printWindow.document.write("  .col-md-6 { padding-bottom: 5px; }");
        printWindow.document.write(
          "  label { font-weight: bold; margin-top: 5px; display: block; }"
        );
        printWindow.document.write(
          "  input, select, textarea { margin-top: 0; }"
        );
        printWindow.document.write("}");
        printWindow.document.write("</style>");
        printWindow.document.write("</head><body>");
        printWindow.document.write('<div class="container mt-5">');

        printWindow.document.write(
          `<h1 class="text-success mb-4">MEDILOG - ${getRecordTitle()}</h1>`
        );
        printWindow.document.write(
          `<h5>Student: ${editingRecord.studentName} (${editingRecord.studentEmail})</h5><hr>`
        );

        printWindow.document.write(printContents);
        printWindow.document.write("</div></body></html>");
        printWindow.document.close();

        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    } else {
      alert("Printable content not found.");
    }
  };

  const handleExport = async (format: "csv" | "excel") => {
    try {
      const date = new Date().toISOString().split("T")[0];
      const extension = format === "csv" ? "csv" : "xlsx";
      const recordName =
        recordType.charAt(0).toUpperCase() + recordType.slice(1);

      const primarySortKey = sortConfig[0]?.key || "default";
      const defaultName = `${recordName}_Sort-${primarySortKey}_${date}.${extension}`;

      let fileName = window.prompt(
        "Please enter a filename for your export:",
        defaultName
      );

      if (!fileName) {
        return;
      }
      if (!fileName.endsWith(`.${extension}`)) {
        fileName += `.${extension}`;
      }

      const response = await medicalAPI.exportRecords(
        recordType,
        format,
        sortConfig
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Failed to export records");
    }
  };

  // ✅ IDINAGDAG: PRINT FUNCTION PARA SA BUONG TABLE VIEW
  const handlePrintTable = () => {
    const recordTitle = getRecordTitle();
    // Kukunin ang content ng table. Ang '.table-responsive' ang pinakamadaling i-target.
    const tableContainer = document.querySelector(".table-responsive");
    // Kukunin din natin ang pagination, pero kailangan itong i-hide sa print.
    const paginationControls = document.querySelector(".pagination-controls");

    if (tableContainer) {
      // Kinokopya ang inner HTML ng table at controls
      let printContents = tableContainer.innerHTML;
      if (paginationControls) {
        printContents += paginationControls.outerHTML;
      }

      const printWindow = window.open("", "", "height=700,width=1000");
      if (printWindow) {
        printWindow.document.write(
          "<html><head><title>Print Table - " + recordTitle + "</title>"
        );
        // Importahan ang Bootstrap CSS
        printWindow.document.write(
          '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/5.0.0-alpha1/css/bootstrap.min.css">'
        );
        printWindow.document.write("<style>");
        printWindow.document.write("@media print {");
        // FIX: Tinatago ang 'Actions' column at ang pagination sa print view.
        printWindow.document.write(
          "  .actions-cell, .pagination-controls { display: none !important; }"
        );
        // Pinipigilan ang sticky header issue at inaayos ang table overflow
        printWindow.document.write("  .table thead th { position: static; }");
        printWindow.document.write(
          "  .table-responsive { overflow: visible !important; }"
        );
        printWindow.document.write("}");
        printWindow.document.write("</style>");
        printWindow.document.write("</head><body>");

        printWindow.document.write('<div class="container-fluid mt-4">');
        printWindow.document.write(
          `<h4 class="text-success">${recordTitle}</h4><hr>`
        );

        // Isasama ang table at pagination controls
        printWindow.document.write(printContents);

        printWindow.document.write("</div></body></html>");
        printWindow.document.close();

        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    } else {
      alert("Table content not found.");
    }
  };
  // --- File Upload Handlers ---

  // --- File Upload Handlers (FIXED) ---

  const handleFile = (file: File | null) => {
    if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
        setUploadError("");
      } else {
        setSelectedFile(null);
        setUploadError("Invalid file type. Please upload a PNG, JPG, or JPEG.");
      }
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files ? e.target.files[0] : null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFile(e.dataTransfer.files ? e.dataTransfer.files[0] : null);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || !user?._id) {
      setUploadError("Please select a file.");
      return;
    }
    setUploading(true);
    setUploadError("");
    const formData = new FormData();

    // ✅✅✅ ITO 'YUNG FIX ✅✅✅
    // Dapat "image" ang key para tumugma sa backend (userRoutes.js)
    formData.append("image", selectedFile);
    // 🛑 Dati: formData.append("profilePicture", selectedFile);

    try {
      const response = await userAPI.uploadProfilePicture(user._id, formData);

      if (login && response.user) {
        const token = localStorage.getItem("authToken");
        if (token) {
          login({
            user: response.user,
            token: token,
            message: "Profile updated",
          });
        } else {
          logout();
        }
      }

      alert(response.message || "Upload successful!");
      setShowUploadModal(false);
      setSelectedFile(null);
    } catch (err: any) {
      // ✅ Pinalitan din natin 'to para ibigay 'yung error na "Server did not receive file"
      const serverMessage = err.response?.data?.message;
      let errorMessage = "Upload failed. Please try again.";

      if (serverMessage === "No file uploaded") {
        errorMessage =
          "Upload failed: Server did not receive the file. (Check backend key or Multer setup.)";
      } else if (serverMessage) {
        errorMessage = `Upload failed: ${serverMessage}`;
      }

      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // ✅ NEW: Handle face capture callback
  const handleFaceCapture = (imageBlob: Blob) => {
    const file = new File([imageBlob], "face-capture.jpg", {
      type: "image/jpeg",
    });
    setSelectedFile(file);
    setShowFaceCaptureModal(false);
    setUploadError("");
  };
  // --- Helper Functions ---

  const getAvatarSrc = () => {
    if (user?.profilePictureUrl) {
      return user.profilePictureUrl;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.username || "Admin"
    )}&background=2c5f2d&color=fff&size=200&font-size=0.4&bold=true`;
  };

  const filteredRecords = patientRecords.filter((record) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.studentName?.toLowerCase().includes(searchLower) ||
      record.studentEmail?.toLowerCase().includes(searchLower) ||
      record.name?.toLowerCase().includes(searchLower) ||
      record.patientName?.toLowerCase().includes(searchLower)
    );
  });

  const getRecordTitle = () => {
    switch (recordType) {
      case "physicalExam":
        return "Physical Examination Records";
      case "monitoring":
        return "Medical Monitoring Records";
      case "certificate":
        return "Medical Certificate Records";
      default:
        return "Records";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        // ✅ ADDED rounded-pill to badge classes
        return "badge bg-success";
      case "rejected":
        return "badge bg-danger";
      case "pending":
      default:
        return "badge bg-warning text-dark";
    }
  };

  const handleSort = (event: MouseEvent, key: string) => {
    const shiftKey = event.shiftKey;

    setSortConfig((prevConfig) => {
      let newConfig = [...prevConfig];
      const existingIndex = newConfig.findIndex((s) => s.key === key);

      if (!shiftKey) {
        const isSameKey = newConfig.length === 1 && newConfig[0].key === key;
        const currentOrder = newConfig[0]?.order;

        return [
          {
            key,
            order: isSameKey && currentOrder === "asc" ? "desc" : "asc",
          },
        ];
      } else {
        if (existingIndex > -1) {
          newConfig[existingIndex].order =
            newConfig[existingIndex].order === "asc" ? "desc" : "asc";
        } else {
          newConfig.push({ key, order: "asc" });
        }
        return newConfig;
      }
    });
    setPatientCurrentPage(1);
  };

  const getSortInfo = (key: string) => {
    const sortRule = sortConfig.find((s) => s.key === key);

    if (!sortRule) {
      return <i className="bi bi-three-dots-vertical"></i>;
    }

    const icon = sortRule.order === "asc" ? "bi-sort-up" : "bi-sort-down";
    const priority = sortConfig.findIndex((s) => s.key === key) + 1;

    return (
      <>
        <i className={`bi ${icon}`}></i>
        {sortConfig.length > 1 && (
          <span className="sort-priority">{priority}</span>
        )}
      </>
    );
  };

  // --- JSX Render ---

  return (
    <div className="d-flex">
      {/* --- Sidebar --- */}
      <div className="sidebar p-3">
        <div className="d-flex align-items-center justify-content-center mb-4 gap-2">
          <div style={{ width: "40px", height: "40px" }}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 70 70"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="70" height="70" fill="white" rx="8" />
              <path d="M70 0L70 22L48 0L70 0Z" fill="#2c5f2d" />
              <rect x="31" y="20" width="8" height="30" rx="2" fill="#2c5f2d" />
              <rect x="20" y="31" width="30" height="8" rx="2" fill="#2c5f2d" />
            </svg>
          </div>
          <h4 className="mb-0 fw-bold">MEDI-LOG</h4>
        </div>
        <hr className="border-white opacity-25 mb-4" />
        <ul className="nav flex-column sidebar-nav-list">
          <li className="nav-item">
            <label
              onClick={() => setView("dashboard")}
              className={`nav-link ${view === "dashboard" ? "active" : ""}`}
              style={{ cursor: "pointer" }}
            >
              <i className="bi bi-speedometer2"></i> Dashboard
            </label>
          </li>
          <li className="nav-item">
            <label
              onClick={() => setView("accounts")}
              className={`nav-link ${view === "accounts" ? "active" : ""}`}
              style={{ cursor: "pointer" }}
            >
              <i className="bi bi-people"></i> Manage Accounts
              {pendingCount > 0 && (
                <span className="badge bg-danger ms-2">{pendingCount}</span>
              )}
            </label>
          </li>
          <li className="nav-item dropdown">
            <a
              className="nav-link dropdown-toggle"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              style={{ cursor: "pointer" }}
            >
              <i className="bi bi-person"></i> Patient Records
            </a>
            <ul className="dropdown-menu">
              <li>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setView("patientRecords");
                    setRecordType("physicalExam");
                  }}
                >
                  Physical Examination
                </a>
              </li>
              <li>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setView("patientRecords");
                    setRecordType("monitoring");
                  }}
                >
                  Medical Monitoring
                </a>
              </li>
              <li>
                <a
                  className="dropdown-item"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setView("patientRecords");
                    setRecordType("certificate");
                  }}
                >
                  Medical Certificate
                </a>
              </li>
            </ul>
          </li>
          {/* ✅ IDINAGDAG: BACKUP / RESTORE LINK */}
          <li className="nav-item">
            <label
              onClick={() => setView("backup")}
              className={`nav-link ${view === "backup" ? "active" : ""}`}
              style={{ cursor: "pointer" }}
            >
              <i className="bi bi-cloud-arrow-up"></i> Backup / Restore
            </label>
          </li>
          {/* ✅ IDINAGDAG: ACTIVITY LOGS LINK */}
          <li className="nav-item">
            <label
              onClick={() => setView("activityLogs")}
              className={`nav-link ${view === "activityLogs" ? "active" : ""}`}
              style={{ cursor: "pointer" }}
            >
              <i className="bi bi-file-text"></i> Activity Logs
            </label>
          </li>
          <li className="nav-item mt-4">
            <a href="#" onClick={handleLogout} className="nav-link text-danger">
              <i className="bi bi-box-arrow-right"></i> Logout
            </a>
          </li>
        </ul>
      </div>

      <div className="flex-grow-1 d-flex flex-column">
        {/* --- Header --- */}
        <header
          className="main-header d-flex justify-content-between align-items-center px-4 py-3 bg-white"
          style={{
            position: "relative",
            zIndex: 10,
            boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
          }}
        >
          <h3 className="mb-0 text-success">Admin Portal</h3>
          <div className="user-info d-flex align-items-center gap-3">
            <div className="text-end d-none d-md-block">
              <div className="fw-semibold">{user?.username}</div>
              <small className="text-muted">{user?.email}</small>
            </div>

            <div
              onClick={() => setShowUploadModal(true)}
              title="Change profile picture"
              style={{ cursor: "pointer" }}
            >
              <img
                src={getAvatarSrc()}
                alt={user?.username}
                className="rounded-circle border border-3 border-success shadow-sm"
                style={{ width: "45px", height: "45px", objectFit: "cover" }}
              />
            </div>
          </div>
        </header>

        <div className="content flex-grow-1 p-4">
          {/* ✅✅✅ DASHBOARD VIEW (FINAL VERSION) ✅✅✅ */}
          {view === "dashboard" && (
            <div>
              <h3 className="mb-4 text-success">
                <i className="bi bi-speedometer2"></i> Dashboard Overview
              </h3>

              {loadingDashboard ||
              !physicalData ||
              !monitoringData ||
              !certificateData ||
              !kmeansData ? (
                <div className="text-center py-5">
                  <div
                    className="spinner-border text-success"
                    style={{ width: "3rem", height: "3rem" }}
                  ></div>
                  <p className="mt-2">Loading Dashboard Stats...</p>
                </div>
              ) : (
                <div className="row g-4">
                  {/* --- Col 1: Main Charts (Gitna) --- */}
                  <div className="col-lg-8">
                    <AnalyticsAssistant />
                    {/* Aggregation Charts (Daily/Status/Gender/Courses) */}
                    <DashboardCharts
                      physicalData={physicalData}
                      monitoringData={monitoringData}
                      certificateData={certificateData}
                    />
                    {/* ✅ K-MEANS CLUSTERING (Idinagdag sa ilalim) */}
                    <div className="mt-4">
                      <KmeansCharts
                        kmeansData={kmeansData}
                        loading={loadingDashboard}
                      />
                    </div>
                  </div>

                  {/* --- Col 2: Cards (Kanan) --- */}
                  <div className="col-lg-4">
                    <div className="row g-4">
                      <div className="col-12">
                        <div className="card shadow-sm border-0">
                          <div
                            className="card-body text-white"
                            style={{
                              background:
                                "linear-gradient(135deg, #2c5f2d 0%, #4a9d4f 100%)",
                              borderRadius: "10px",
                            }}
                          >
                            <h2 className="mb-2">
                              Welcome back, {user?.username}! 👋
                            </h2>
                            <p className="mb-0">
                              Here's what's happening in the clinic.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ✅ BAGO: TOTAL REGISTERED STUDENTS CARD */}
                      <div className="col-12 col-md-6 col-lg-12">
                        <div className="card shadow-sm h-100 border-success">
                          <div className="card-body text-center">
                            <i
                              className="bi bi-person-lines-fill text-success"
                              style={{ fontSize: "3rem" }}
                            ></i>
                            <h3 className="mt-3 text-success">
                              {totalStudents}
                            </h3>
                            <p className="text-muted mb-0">
                              Total Registered Students
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Pending Accounts Card */}
                      <div className="col-12 col-md-6 col-lg-12">
                        <div className="card shadow-sm h-100 border-warning">
                          <div className="card-body text-center">
                            <i
                              className="bi bi-person-check text-warning"
                              style={{ fontSize: "3rem" }}
                            ></i>
                            <h3 className="mt-3 text-warning">
                              {pendingCount}
                            </h3>
                            <p className="text-muted mb-0">Pending Accounts</p>
                          </div>
                        </div>
                      </div>

                      {/* Physical Exams Card */}
                      <div className="col-12 col-md-6 col-lg-12">
                        <div className="card shadow-sm h-100 border-primary">
                          <div className="card-body text-center">
                            <i
                              className="bi bi-file-medical text-primary"
                              style={{ fontSize: "3rem" }}
                            ></i>
                            <h3 className="mt-3 text-primary">
                              {physicalData?.totalCount}
                            </h3>
                            <p className="text-muted mb-0">
                              Physical Exams (This Month)
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Monitoring Card */}
                      <div className="col-12 col-md-6 col-lg-12">
                        <div className="card shadow-sm h-100 border-success">
                          <div className="card-body text-center">
                            <i
                              className="bi bi-heart-pulse text-success"
                              style={{ fontSize: "3rem" }}
                            ></i>
                            <h3 className="mt-3 text-success">
                              {monitoringData?.totalCount}
                            </h3>
                            <p className="text-muted mb-0">
                              Monitoring (This Month)
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Certificates Card */}
                      <div className="col-12 col-md-6 col-lg-12">
                        <div className="card shadow-sm h-100 border-info">
                          <div className="card-body text-center">
                            <i
                              className="bi bi-award text-info"
                              style={{ fontSize: "3rem" }}
                            ></i>
                            <h3 className="mt-3 text-info">
                              {certificateData?.totalCount}
                            </h3>
                            <p className="text-muted mb-0">
                              Certificates (This Month)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- Accounts View --- */}
          {view === "accounts" && (
            <div>
              <h3 className="mb-4 text-success">
                <i className="bi bi-people"></i> Manage Student Accounts
              </h3>
              {loadingAccounts ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-success"></div>
                </div>
              ) : studentAccounts.length === 0 ? (
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>No student accounts
                  found.
                </div>
              ) : (
                <>
                  {/* ✅ CLEAN TABLE CLASSES */}
                  <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                      <thead className="table-light fw-bold">
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Student ID</th>
                          <th>LRN</th>
                          <th>Date Applied</th>
                          <th>View ID</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentAccounts.map((account, index) => (
                          <tr key={account._id}>
                            <td>
                              {(accountCurrentPage - 1) * accountRowsPerPage +
                                index +
                                1}
                            </td>
                            <td className="text-start">{account.username}</td>
                            <td className="text-start">{account.email}</td>
                            <td>{account.studentId}</td>
                            <td>{account.lrn}</td>
                            <td>
                              {new Date(account.createdAt).toLocaleDateString()}
                            </td>
                            <td>
                              {account.idPictureUrl ? (
                                <button
                                  className="btn btn-info btn-sm text-white"
                                  onClick={() =>
                                    setShowIdModal(account.idPictureUrl || null)
                                  }
                                >
                                  <i className="bi bi-eye"></i> View
                                </button>
                              ) : (
                                <span className="text-muted">N/A</span>
                              )}
                            </td>
                            <td>
                              <span
                                // ✅ ADDED rounded-pill
                                className={`${getStatusBadge(
                                  account.status
                                )} rounded-pill`}
                                style={{ textTransform: "capitalize" }}
                              >
                                {account.status}
                              </span>
                            </td>
                            <td>
                              {account.status === "pending" ? (
                                <div
                                  className="btn-group btn-group-sm"
                                  role="group"
                                >
                                  <button
                                    className="btn btn-success"
                                    title="Approve"
                                    onClick={() =>
                                      handleApproveAccount(
                                        account._id,
                                        account.username,
                                        account.defaultLoginMethod
                                      )
                                    }
                                  >
                                    <i className="bi bi-check-circle"></i>
                                    {/* Removed 'me-1' to make it smaller */}
                                  </button>
                                  <button
                                    className="btn btn-danger"
                                    title="Reject"
                                    onClick={() =>
                                      handleRejectAccount(
                                        account._id,
                                        account.username
                                      )
                                    }
                                  >
                                    <i className="bi bi-x-circle"></i>
                                    {/* Removed 'me-1' to make it smaller */}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted fst-italic">
                                  N/A
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <PaginationControls
                    currentPage={accountCurrentPage}
                    totalPages={accountTotalPages}
                    onPageChange={(page) => setAccountCurrentPage(page)}
                    totalCount={accountTotalCount}
                    pageSize={accountRowsPerPage}
                    onPageSizeChange={(newSize) => {
                      setAccountRowsPerPage(newSize);
                      setAccountCurrentPage(1);
                    }}
                  />
                </>
              )}
            </div>
          )}

          {/* --- Patient Records View (FINAL MODIFIED VERSION) --- */}
          {view === "patientRecords" && (
            <div>
              <h3 className="mb-4 text-success">{getRecordTitle()}</h3>

              {/* ✅ UPDATED LAYOUT: Search on the left, Export/Print on the right */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search..."
                    style={{ maxWidth: "300px" }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="btn btn-success" disabled={!searchTerm}>
                    <i className="bi bi-search"></i> Search
                  </button>
                </div>

                <div className="d-flex gap-2">
                  {/* Ginawang compact: btn-sm at inayos ang padding */}
                  <button
                    className="btn btn-primary px-3 btn-sm"
                    onClick={handlePrintTable}
                  >
                    <i className="bi bi-printer"></i> Print Table
                  </button>
                  <button
                    className="btn btn-info px-3 text-white btn-sm"
                    onClick={() => handleExport("csv")}
                  >
                    <i className="bi bi-download"></i> CSV
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-success"></div>
                </div>
              ) : (
                <div className="table-responsive">
                  {/* === Physical Exam Table (MODIFIED) === */}
                  {recordType === "physicalExam" && (
                    <>
                      {/* ✅ CLEAN TABLE CLASSES: Removed bordered, text-center. Added hover */}
                      <table className="table table-striped table-hover align-middle">
                        <thead className="table-light fw-bold">
                          <tr>
                            <th>#</th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "studentEmail")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "studentEmail")}
                            >
                              Email {getSortInfo("studentEmail")}
                            </th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "name")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "name")}
                            >
                              Name {getSortInfo("name")}
                            </th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "gender")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "gender")}
                            >
                              Gender {getSortInfo("gender")}
                            </th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "course")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "course")}
                            >
                              Course {getSortInfo("course")}
                            </th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "year")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "year")}
                            >
                              Year {getSortInfo("year")}
                            </th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "date")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "date")}
                            >
                              Date {getSortInfo("date")}
                            </th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "status")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "status")}
                            >
                              Status {getSortInfo("status")}
                            </th>
                            <th className="actions-cell">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecords.length === 0 ? (
                            <tr>
                              <td
                                colSpan={9}
                                className="text-muted py-4 text-start"
                              >
                                No records found.
                              </td>
                            </tr>
                          ) : (
                            filteredRecords.map((record, index) => (
                              <tr key={record._id}>
                                <td>
                                  {(patientCurrentPage - 1) *
                                    patientRowsPerPage +
                                    index +
                                    1}
                                </td>
                                <td className="text-start">
                                  {record.studentEmail}
                                </td>
                                <td className="text-start">{record.name}</td>
                                <td>{record.gender}</td>
                                <td>{record.course}</td>
                                <td>{record.year}</td>
                                <td>{record.date}</td>
                                <td>
                                  {/* ✅ Added rounded-pill */}
                                  <span
                                    className={`${getStatusBadge(
                                      record.status
                                    )} rounded-pill`}
                                  >
                                    {record.status}
                                  </span>
                                </td>
                                <td className="actions-cell">
                                  {/* ✅ COMPACT BUTTONS: btn-group-sm */}
                                  <div
                                    className="btn-group btn-group-sm"
                                    role="group"
                                  >
                                    <button
                                      className="btn btn-primary"
                                      title="Edit"
                                      onClick={() => handleEdit(record)}
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </button>
                                    <button
                                      className="btn btn-danger"
                                      title="Delete"
                                      onClick={() => handleDelete(record._id)}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>

                      <PaginationControls
                        currentPage={patientCurrentPage}
                        totalPages={patientTotalPages}
                        onPageChange={(page) => setPatientCurrentPage(page)}
                        totalCount={patientTotalCount}
                        pageSize={patientRowsPerPage}
                        onPageSizeChange={(newSize) => {
                          setPatientRowsPerPage(newSize);
                          setPatientCurrentPage(1);
                        }}
                      />
                    </>
                  )}

                  {/* === Monitoring Table (MODIFIED) === */}
                  {recordType === "monitoring" && (
                    <>
                      {/* ✅ CLEAN TABLE CLASSES */}
                      <table className="table table-striped table-hover align-middle">
                        <thead className="table-light fw-bold">
                          <tr>
                            <th>#</th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "arrival")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "arrival")}
                            >
                              Arrival {getSortInfo("arrival")}
                            </th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "patientName")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "patientName")}
                            >
                              Name {getSortInfo("patientName")}
                            </th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "sex")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "sex")}
                            >
                              Sex {getSortInfo("sex")}
                            </th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "degree")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "degree")}
                            >
                              Degree {getSortInfo("degree")}
                            </th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "studentNo")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "studentNo")}
                            >
                              Student No. {getSortInfo("studentNo")}
                            </th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "symptoms")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "symptoms")}
                            >
                              Symptoms {getSortInfo("symptoms")}
                            </th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "action")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "action")}
                            >
                              Action {getSortInfo("action")}
                            </th>
                            <th>Meds</th>
                            <th>Exit</th>
                            <th>Duration</th>
                            <th>Personnel</th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "status")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "status")}
                            >
                              Status {getSortInfo("status")}
                            </th>
                            <th className="actions-cell">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecords.length === 0 ? (
                            <tr>
                              <td
                                colSpan={14}
                                className="text-muted py-4 text-start"
                              >
                                No records found.
                              </td>
                            </tr>
                          ) : (
                            filteredRecords.map((record, index) => (
                              <tr key={record._id}>
                                <td>
                                  {(patientCurrentPage - 1) *
                                    patientRowsPerPage +
                                    index +
                                    1}
                                </td>
                                <td className="text-start">{record.arrival}</td>
                                <td className="text-start">
                                  {record.patientName}
                                </td>
                                <td>{record.sex}</td>
                                <td>{record.degree}</td>
                                <td>{record.studentNo}</td>
                                <td>{record.symptoms}</td>
                                <td>{record.action}</td>
                                <td>{record.meds || "-"}</td>
                                <td>{record.exit || "-"}</td>
                                <td>{record.duration || "-"}</td>
                                <td>{record.personnel || "-"}</td>
                                <td>
                                  {/* ✅ Added rounded-pill */}
                                  <span
                                    className={`${getStatusBadge(
                                      record.status
                                    )} rounded-pill`}
                                  >
                                    {record.status}
                                  </span>
                                </td>
                                <td className="actions-cell">
                                  {/* ✅ COMPACT BUTTONS */}
                                  <div
                                    className="btn-group btn-group-sm"
                                    role="group"
                                  >
                                    <button
                                      className="btn btn-primary"
                                      title="Edit"
                                      onClick={() => handleEdit(record)}
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </button>
                                    <button
                                      className="btn btn-danger"
                                      title="Delete"
                                      onClick={() => handleDelete(record._id)}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>

                      <PaginationControls
                        currentPage={patientCurrentPage}
                        totalPages={patientTotalPages}
                        onPageChange={(page) => setPatientCurrentPage(page)}
                        totalCount={patientTotalCount}
                        pageSize={patientRowsPerPage}
                        onPageSizeChange={(newSize) => {
                          setPatientRowsPerPage(newSize);
                          setPatientCurrentPage(1);
                        }}
                      />
                    </>
                  )}

                  {/* === Certificate Table (MODIFIED) === */}
                  {recordType === "certificate" && (
                    <>
                      {/* ✅ CLEAN TABLE CLASSES */}
                      <table className="table table-striped table-hover align-middle">
                        <thead className="table-light fw-bold">
                          <tr>
                            <th>#</th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "name")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "name")}
                            >
                              Name {getSortInfo("name")}
                            </th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "age")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "age")}
                            >
                              Age {getSortInfo("age")}
                            </th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "sex")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "sex")}
                            >
                              Sex {getSortInfo("sex")}
                            </th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "civilStatus")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "civilStatus")}
                            >
                              Civil Status {getSortInfo("civilStatus")}
                            </th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "school")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "school")}
                            >
                              School {getSortInfo("school")}
                            </th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "idNumber")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "idNumber")}
                            >
                              ID Number {getSortInfo("idNumber")}
                            </th>
                            <th>Diagnosis</th>
                            <th>Remarks</th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "date")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "date")}
                            >
                              Date {getSortInfo("date")}
                            </th>
                            <th
                              className={`th-sortable ${
                                sortConfig.find((s) => s.key === "status")
                                  ? "active"
                                  : ""
                              }`}
                              onClick={(e) => handleSort(e, "status")}
                            >
                              Status {getSortInfo("status")}
                            </th>
                            <th className="actions-cell">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecords.length === 0 ? (
                            <tr>
                              <td
                                colSpan={12}
                                className="text-muted py-4 text-start"
                              >
                                No records found.
                              </td>
                            </tr>
                          ) : (
                            filteredRecords.map((record, index) => (
                              <tr key={record._id}>
                                <td>
                                  {(patientCurrentPage - 1) *
                                    patientRowsPerPage +
                                    index +
                                    1}
                                </td>
                                <td className="text-start">{record.name}</td>
                                <td>{record.age}</td>
                                <td>{record.sex}</td>
                                <td>{record.civilStatus}</td>
                                <td>{record.school}</td>
                                <td>{record.idNumber}</td>
                                <td>{record.diagnosis || "-"}</td>
                                <td>{record.remarks || "-"}</td>
                                <td>{record.date}</td>
                                <td>
                                  {/* ✅ Added rounded-pill */}
                                  <span
                                    className={`${getStatusBadge(
                                      record.status
                                    )} rounded-pill`}
                                  >
                                    {record.status}
                                  </span>
                                </td>
                                <td className="actions-cell">
                                  {/* ✅ COMPACT BUTTONS */}
                                  <div
                                    className="btn-group btn-group-sm"
                                    role="group"
                                  >
                                    <button
                                      className="btn btn-primary"
                                      title="Edit"
                                      onClick={() => handleEdit(record)}
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </button>
                                    <button
                                      className="btn btn-danger"
                                      title="Delete"
                                      onClick={() => handleDelete(record._id)}
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>

                      <PaginationControls
                        currentPage={patientCurrentPage}
                        totalPages={patientTotalPages}
                        onPageChange={(page) => setPatientCurrentPage(page)}
                        totalCount={patientTotalCount}
                        pageSize={patientRowsPerPage}
                        onPageSizeChange={(newSize) => {
                          setPatientRowsPerPage(newSize);
                          setPatientCurrentPage(1);
                        }}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ✅ BAGONG VIEW: BACKUP & RESTORE */}
          {view === "backup" && user && (
            <BackupRestoreView adminUsername={user.username} />
          )}

          {/* ✅ BAGONG VIEW: ACTIVITY LOGS */}
          {view === "activityLogs" && (
            <div>
              <h3 className="mb-4 text-success">
                <i className="bi bi-file-text"></i> Admin Activity Logs
              </h3>
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  padding: "2rem",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <AdminActivityLogs />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Modals --- */}
      {showEditModal && editingRecord && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">Edit/View Record</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>

              {/* ✅ PRINT FEATURE AREA ID: printable-record */}
              <div className="modal-body" id="printable-record">
                <div className="row g-3">
                  <div className="col-12 mb-3">
                    <span className="badge bg-secondary me-2">
                      Record ID: {editingRecord._id}
                    </span>
                    <span
                      // ✅ Added rounded-pill here as well
                      className={`badge ${getStatusBadge(
                        editingRecord.status
                      )} rounded-pill`}
                    >
                      {editingRecord.status}
                    </span>
                  </div>

                  {/* Physical Exam Fields */}
                  {recordType === "physicalExam" && (
                    <>
                      <div className="col-md-6">
                        <label>Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.name || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              name: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Gender</label>
                        <select
                          className="form-control"
                          value={editingRecord.gender || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              gender: e.target.value,
                            })
                          }
                          // FIX: Tinanggal ang readOnly sa select
                          disabled={editingRecord.status !== "pending"}
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label>Course</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.course || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              course: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Year</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.year || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              year: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={editingRecord.date || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              date: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                    </>
                  )}
                  {/* Monitoring Fields */}
                  {recordType === "monitoring" && (
                    <>
                      <div className="col-md-6">
                        <label>Patient Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.patientName || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              patientName: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Sex</label>
                        <select
                          className="form-control"
                          value={editingRecord.sex || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              sex: e.target.value,
                            })
                          }
                          disabled={editingRecord.status !== "pending"}
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label>Degree</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.degree || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              degree: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Student No</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.studentNo || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              studentNo: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Arrival</label>
                        <input
                          type="time"
                          className="form-control"
                          value={editingRecord.arrival || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              arrival: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Exit</label>
                        <input
                          type="time"
                          className="form-control"
                          value={editingRecord.exit || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              exit: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-12">
                        <label>Symptoms</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={editingRecord.symptoms || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              symptoms: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-12">
                        <label>Action</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={editingRecord.action || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              action: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-12">
                        <label>Meds</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={editingRecord.meds || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              meds: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Duration</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.duration || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              duration: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Personnel</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.personnel || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              personnel: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                  {/* Certificate Fields */}
                  {recordType === "certificate" && (
                    <>
                      <div className="col-md-6">
                        <label>Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.name || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              name: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Age</label>
                        <input
                          type="number"
                          className="form-control"
                          value={editingRecord.age || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              age: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label>Sex</label>
                        <select
                          className="form-control"
                          value={editingRecord.sex || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              sex: e.target.value,
                            })
                          }
                          disabled={editingRecord.status !== "pending"}
                        >
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label>Civil Status</label>
                        <select
                          className="form-control"
                          value={editingRecord.civilStatus || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              civilStatus: e.target.value,
                            })
                          }
                          disabled={editingRecord.status !== "pending"}
                        >
                          <option value="">Select</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Widowed">Widowed</option>
                          <option value="Separated">Separated</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label>School</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.school || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              school: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-6">
                        <label>ID Number</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingRecord.idNumber || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              idNumber: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-12">
                        <label>Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={editingRecord.date || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              date: e.target.value,
                            })
                          }
                          readOnly={editingRecord.status !== "pending"}
                        />
                      </div>
                      <div className="col-md-12">
                        <label>Diagnosis</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={editingRecord.diagnosis || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              diagnosis: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-md-12">
                        <label>Remarks</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={editingRecord.remarks || ""}
                          onChange={(e) =>
                            setEditingRecord({
                              ...editingRecord,
                              remarks: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                  <div className="col-md-12">
                    <label>Status</label>
                    <select
                      className="form-control"
                      value={editingRecord.status || "pending"}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          status: e.target.value as any,
                        })
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ✅ FINAL MODAL FOOTER WITH PRINT BUTTON */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-info me-auto" // Nilagay sa left
                  onClick={handlePrint} // 👈 Ang Print Function
                  title="Print this record as a formal document"
                >
                  <i className="bi bi-printer me-2"></i>Print Record
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleSaveEdit}
                >
                  <i className="bi bi-save me-2"></i>Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showIdModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowIdModal(null)}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Student ID Verification</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowIdModal(null)}
                ></button>
              </div>
              <div className="modal-body text-center p-4">
                <img
                  src={showIdModal}
                  alt="Student ID"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "80vh",
                    objectFit: "contain",
                    borderRadius: "8px",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Upload Profile Picture</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setUploadError("");
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {uploadError && (
                  <div className="alert alert-danger">{uploadError}</div>
                )}

                <div
                  className={`upload-drop-zone ${
                    isDragging ? "is-dragging" : ""
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileSelect}
                >
                  <div className="upload-icon">
                    <i className="bi bi-cloud-arrow-up"></i>
                  </div>
                  <p>Choose a file or drag & drop it here</p>
                  <span className="upload-formats">JPEG, PNG, or JPG only</span>
                  <span
                    className="btn-browse"
                    style={{ pointerEvents: "none" }}
                  >
                    Browse File
                  </span>
                  <input
                    type="file"
                    id="pfpFile"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                </div>

                <div className="text-center my-3">
                  <span className="text-muted">or</span>
                </div>

                {/* ✅ NEW: Camera Capture Button */}
                <button
                  type="button"
                  className="btn btn-info w-100 mb-3"
                  onClick={() => setShowFaceCaptureModal(true)}
                >
                  <i className="bi bi-camera me-2"></i>Capture Photo with Camera
                </button>

                {selectedFile && (
                  <div className="file-preview">
                    Selected: {selectedFile.name}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setUploadError("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleUploadSubmit}
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW: Face Capture Modal */}
      <FaceCaptureModal
        show={showFaceCaptureModal}
        onClose={() => setShowFaceCaptureModal(false)}
        onCapture={handleFaceCapture}
      />
    </div>
  );
};

export default AdminDashboard;
