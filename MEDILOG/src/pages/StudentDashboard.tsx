import React, { useState, useEffect, useRef } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/studentportal.css";
import { medicalAPI, userAPI } from "../services/api";
import FaceCaptureModal from "../components/common/FaceCaptureModal";

// --- Interfaces ---
interface NewStudentData {
  _id?: string;
  name: string;
  gender: string;
  course: string;
  year: string;
  date: string;
  status?: string;
  submissionDate?: string;
}

interface MonitoringData {
  _id?: string;
  arrival: string;
  patientName: string;
  sex: string;
  degree: string;
  studentNo: string;
  symptoms: string;
  action: string;
  meds?: string;
  exit?: string;
  duration?: string;
  personnel?: string;
  status?: string;
  submissionDate?: string;
}

interface CertificateData {
  _id?: string;
  name: string;
  age: string;
  sex: string;
  civilStatus?: string;
  school: string;
  idNumber: string;
  date: string;
  diagnosis?: string;
  remarks?: string;
  status?: string;
  submissionDate?: string;
}

interface Notification {
  _id: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  recordType: string;
}

type StudentView =
  | "landing"
  | "profile"
  | "formOptions"
  | "newStudent"
  | "monitoring"
  | "certificate"
  | "history"
  | "notifications";

const StudentDashboard: React.FC = () => {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState<StudentView>("landing");

  const [newStudentHistory, setNewStudentHistory] = useState<NewStudentData[]>(
    []
  );
  const [monitoringHistory, setMonitoringHistory] = useState<MonitoringData[]>(
    []
  );
  const [certificateHistory, setCertificateHistory] = useState<
    CertificateData[]
  >([]);

  // States para sa History Filter at Pagination
  type HistoryType = "physicalExam" | "monitoring" | "certificate";
  const [activeHistoryType, setActiveHistoryType] =
    useState<HistoryType>("physicalExam");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  // States for Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(false);

  // States for Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showFaceCaptureModal, setShowFaceCaptureModal] = useState(false);

  // States para sa drag and drop
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // --- Form Handlers (Unchanged) ---
  const handleNewStudentSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      studentId: user?._id || "",
      studentName: user?.username || "",
      studentEmail: user?.email || "",
      recordType: "physicalExam" as const,
      name: formData.get("name") as string,
      gender: formData.get("gender") as string,
      course: formData.get("course") as string,
      year: formData.get("year") as string,
      date: formData.get("date") as string,
    };
    try {
      await medicalAPI.createRecord(data);
      alert("New Student form submitted successfully!");
      form.reset();
      loadStudentHistory();
      setActiveView("history");
    } catch (error: any) {
      alert("Failed to submit form: " + error.message);
    }
  };
  const handleMedMonitoringSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      studentId: user?._id || "",
      studentName: user?.username || "",
      studentEmail: user?.email || "",
      recordType: "monitoring" as const,
      arrival: formData.get("arrival") as string,
      patientName: formData.get("patientName") as string,
      sex: formData.get("sex") as string,
      degree: formData.get("degree") as string,
      studentNo: formData.get("studentNo") as string,
      symptoms: formData.get("symptoms") as string,
      action: formData.get("action") as string,
    };
    try {
      await medicalAPI.createRecord(data);
      alert("Medical Monitoring form submitted successfully!");
      form.reset();
      loadStudentHistory();
      setActiveView("history");
    } catch (error: any) {
      alert("Failed to submit form: " + error.message);
    }
  };
  const handleMedCertSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      studentId: user?._id || "",
      studentName: user?.username || "",
      studentEmail: user?.email || "",
      recordType: "certificate" as const,
      name: formData.get("name") as string,
      age: formData.get("age") as string,
      sex: formData.get("sex") as string,
      civilStatus: formData.get("status") as string,
      school: formData.get("school") as string,
      idNumber: formData.get("idNumber") as string,
      date: formData.get("date") as string,
    };
    try {
      await medicalAPI.createRecord(data);
      alert("Medical Certificate form submitted successfully!");
      form.reset();
      loadStudentHistory();
      setActiveView("history");
    } catch (error: any) {
      alert("Failed to submit form: " + error.message);
    }
  };
  // --- End Form Handlers ---

  // --- Data Loading and Notification Logic (Unchanged) ---
  const loadStudentHistory = async () => {
    if (!user?._id) return;
    try {
      const response = await medicalAPI.getStudentRecords(user._id);
      setNewStudentHistory(response.physicalExams || []);
      setMonitoringHistory(response.monitoring || []);
      setCertificateHistory(response.certificates || []);
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  const loadNotifications = async () => {
    if (!user?._id) return;
    try {
      const response = await medicalAPI.getStudentNotifications(user._id);
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const handleMarkAsRead = async () => {
    const currentStudentId = user?.studentId || user?.username;
    if (!currentStudentId || unreadCount === 0) return;
    try {
      await medicalAPI.markNotificationsAsRead(currentStudentId);
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  useEffect(() => {
    if (!user) return;

    // 1. Initial Fetch
    fetchStudentData();
    // ✅ Load history records on component mount
    loadStudentHistory();

    // 2. ✅ AUTO-REFRESH: Kukuha ng bagong data every 10 seconds
    const intervalId = setInterval(() => {
      // Tahimik na mag-refresh (walang loading spinner para di nakaka-istorbo)
      fetchStudentData(true);
    }, 10000);

    // Cleanup pag umalis sa page
    return () => clearInterval(intervalId);
  }, [user]);

  // ✅ Add effect to reload history when activeHistoryType or rowsPerPage changes
  useEffect(() => {
    if (!user) return;
    loadStudentHistory();
    setCurrentPage(1); // Reset to page 1 when history type changes
  }, [activeHistoryType, rowsPerPage]);

  // ✅ I-UPDATE ANG FETCH FUNCTION para supportahan ang silent refresh
  const fetchStudentData = async (isSilent = false) => {
    try {
      // 1. Kung hindi silent (first load), pakita loading spinner
      if (!isSilent) setStatsLoading(true);

      // Siguraduhin na may user ID tayo
      const currentStudentId = user?.studentId || user?.username;
      if (!currentStudentId) return;

      // 2. FETCH SABAY-SABAY (Para mabilis)
      const [notifsRes, unreadRes] = await Promise.all([
        medicalAPI.getStudentNotifications(currentStudentId), // Get list
        medicalAPI.getUnreadCount(currentStudentId), // Get number (count)
      ]);

      // 3. Update State
      setNotifications(notifsRes.notifications || notifsRes); // Update ang listahan sa modal
      setUnreadCount(unreadRes.count || 0); // ✅ Update ang BADGE number agad! (API returns 'count')

      // (Dito mo isusunod yung iba pang fetch calls para sa tables mo kung meron man...)
    } catch (error) {
      console.error("Error fetching student data:", error);
    } finally {
      if (!isSilent) setStatsLoading(false);
    }
  };

  // HANDLER PARA SA CUSTOM DROPDOWN (Unchanged)
  const handleHistoryTypeChange = (type: HistoryType) => {
    setActiveHistoryType(type);
    setCurrentPage(1);
  };
  // --- End Data Loading and Notification Logic ---

  // --- Upload Handlers ---
  // Central file handler with validation
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
    } else {
      setSelectedFile(null);
      setUploadError("");
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

  // ✅✅✅ FIX #1 (Auth Logout Issue) APPLIED HERE ✅✅✅
  const handleUploadSubmit = async () => {
    if (!selectedFile || !user?._id) {
      setUploadError("Please select a file.");
      return;
    }
    setUploading(true);
    setUploadError("");
    const formData = new FormData();

    formData.append("image", selectedFile);

    try {
      const response = await userAPI.uploadProfilePicture(user._id, formData);

      if (login && response.user) {
        const token = localStorage.getItem("authToken");
        if (token) {
          login({
            user: response.user,
            token: token,
            message: response.message,
          });
        } else {
          logout();
        }
      }

      alert(response.message || "Upload successful!");
      setShowUploadModal(false);
      setSelectedFile(null);
    } catch (err: any) {
      const serverMessage = err.response?.data?.message;
      const status = err.response?.status;

      let errorMessage = "Upload failed. Please try again.";
      if (status === 400 && serverMessage === "No file uploaded") {
        errorMessage = `Upload failed: Server did not receive the file. (Check backend key or Multer setup.)`;
      } else if (serverMessage) {
        errorMessage = `Upload failed: ${serverMessage}`;
      } else if (status === 400) {
        errorMessage = "Upload failed (Bad Request).";
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
  // --- End Upload Handlers ---

  // Avatar Source Logic (Unchanged)
  const getAvatarSrc = () => {
    if (user?.profilePictureUrl) {
      return user.profilePictureUrl;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.username || "User"
    )}&background=2c5f2d&color=fff&size=128&bold=true`;
  };

  // --- Render View Function (SYNTAX FIX + PROFILE UPDATE) ---
  const renderView = () => {
    // ✅✅✅ SYNTAX FIX: Idinagdag pabalik 'yung "switch (activeView) {"
    switch (activeView) {
      case "profile":
        return (
          <div className="section profilePage" style={{ display: "block" }}>
            <div className="profile-header">
              <div
                className="profile-avatar-container"
                onClick={() => setShowUploadModal(true)}
                title="Change profile picture"
              >
                <img
                  src={getAvatarSrc()}
                  alt="Profile"
                  className="profile-avatar"
                />
                <div className="profile-avatar-edit-icon">
                  <i className="bi bi-pencil-fill"></i>
                </div>
              </div>
              <h4>{user?.username}</h4>
              <p>{user?.role}</p>
            </div>

            <div className="profile-list-group">
              <div
                className="profile-list-item"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <span
                  className="profile-list-item-label"
                  style={{ flexShrink: 0, marginRight: "20px" }}
                >
                  Email
                </span>
                <span
                  className="profile-list-item-value"
                  style={{ textAlign: "right" }}
                >
                  {user?.email}
                </span>
              </div>

              <div
                className="profile-list-item"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <span
                  className="profile-list-item-label"
                  style={{ flexShrink: 0, marginRight: "20px" }}
                >
                  Student ID
                </span>
                <span
                  className="profile-list-item-value"
                  style={{ textAlign: "right" }}
                >
                  {user?.studentId}
                </span>
              </div>

              <div
                className="profile-list-item"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <span
                  className="profile-list-item-label"
                  style={{ flexShrink: 0, marginRight: "20px" }}
                >
                  LRN
                </span>
                <span
                  className="profile-list-item-value"
                  style={{ textAlign: "right" }}
                >
                  {user?.lrn}
                </span>
              </div>

              <div
                className="profile-list-item"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <span
                  className="profile-list-item-label"
                  style={{ flexShrink: 0, marginRight: "20px" }}
                >
                  Department
                </span>
                <span
                  className="profile-list-item-value"
                  style={{ textAlign: "right" }}
                >
                  {user?.department || "N/A"}
                </span>
              </div>

              <div
                className="profile-list-item"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <span
                  className="profile-list-item-label"
                  style={{ flexShrink: 0, marginRight: "20px" }}
                >
                  Program
                </span>
                <span
                  className="profile-list-item-value"
                  style={{ textAlign: "right" }}
                >
                  {user?.program || "N/A"}
                </span>
              </div>

              <div
                className="profile-list-item"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <span
                  className="profile-list-item-label"
                  style={{ flexShrink: 0, marginRight: "20px" }}
                >
                  Year Level
                </span>
                <span
                  className="profile-list-item-value"
                  style={{ textAlign: "right" }}
                >
                  {user?.yearLevel || "N/A"}
                </span>
              </div>
            </div>
          </div>
        );

      case "formOptions":
        return (
          <div
            className="section onlineFormSection"
            style={{ display: "block" }}
          >
            {/* Ito 'yung original structure ninyo */}
            <div className="option-cards-container">
              <div className="row mb-4 option-cards">
                {/* --- CARD 1: Physical Exam --- */}
                <div className="col-md-4">
                  <div
                    onClick={() => setActiveView("newStudent")}
                    className="card option-card shadow-sm"
                  >
                    {/* Ito 'yung bagong design sa loob */}
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <div className="option-card-icon text-success">
                          <i className="bi bi-person-vcard"></i>
                        </div>
                        <div className="flex-grow-1">
                          <h5 className="card-title mb-1">
                            Physical Examinations of New Student
                          </h5>
                          <p className="text-muted mb-0">
                            Record physical examination
                          </p>
                        </div>
                        <div className="option-card-arrow">
                          <i className="bi bi-chevron-right"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- CARD 2: Medical Monitoring --- */}
                <div className="col-md-4">
                  <div
                    onClick={() => setActiveView("monitoring")}
                    className="card option-card shadow-sm"
                  >
                    {/* Ito 'yung bagong design sa loob */}
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <div className="option-card-icon text-success">
                          <i className="bi bi-heart-pulse"></i>
                        </div>
                        <div className="flex-grow-1">
                          <h5 className="card-title mb-1">
                            Medical Monitoring
                          </h5>
                          <p className="text-muted mb-0">
                            For Medical Consultations Treatment
                          </p>
                        </div>
                        <div className="option-card-arrow">
                          <i className="bi bi-chevron-right"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- CARD 3: Medical Certificate --- */}
                <div className="col-md-4">
                  <div
                    onClick={() => setActiveView("certificate")}
                    className="card option-card shadow-sm"
                  >
                    {/* Ito 'yung bagong design sa loob */}
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <div className="option-card-icon text-success">
                          <i className="bi bi-file-earmark-medical"></i>
                        </div>
                        <div className="flex-grow-1">
                          <h5 className="card-title mb-1">
                            Medical Certificate
                          </h5>
                          <p className="text-muted mb-0">
                            Record medical consultations
                          </p>
                        </div>
                        <div className="option-card-arrow">
                          <i className="bi bi-chevron-right"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "newStudent":
        return (
          <div className="section onlineFormSection">
            <div
              className="form-section newStudentForm"
              style={{ display: "block" }}
            >
              <div className="card mb-4 shadow-sm">
                <div className="card-header bg-success text-white">
                  New Student
                </div>
                <div className="card-body">
                  <form onSubmit={handleNewStudentSubmit}>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Name</label>
                        <input
                          type="text"
                          name="name"
                          className="form-control"
                          placeholder="Enter name"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Gender</label>
                        <select name="gender" className="form-select" required>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="LGBTQ+">LGBTQ+</option>
                        </select>
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Course</label>
                        <select name="course" className="form-select" required>
                          <option value="">Select Course</option>
                          <option>
                            Doctor of Philosophy in Animal Science
                          </option>
                          <option>Doctor of Philosophy in Crop Science</option>
                          <option>Doctor of Philosophy in Education</option>
                          <option>Doctor of Public Administration</option>
                          <option>
                            Doctor of Philosophy in Resource Management
                          </option>
                          <option>Master of Arts in Education</option>
                          <option>
                            Master of Arts in Teaching Livelihood Education
                          </option>
                          <option>
                            Master of Science Major in Mathematics Education,
                            Biology Education and Chemistry Education
                          </option>
                          <option>Master of Science in Animal Science</option>
                          <option>Master of Science in Crop Science</option>
                          <option>
                            Master of Science in Agricultural Engineering
                          </option>
                          <option>Master in Business Administration</option>
                          <option>Master in Public Administration</option>
                          <option>Master of Arts in Psychology</option>
                          <option>Master of Arts in English</option>
                          <option>Master in Chemistry</option>
                          <option>Master in Mathematics</option>
                          <option>Master of Biology</option>
                          <option>Master in Psychology</option>
                          <option>Master in Information Technology</option>
                          <option>Doctor of Veterinary Medicine</option>
                          <option>
                            Bachelor of Science in Animal Husbandry
                          </option>
                          <option>Bachelor of Science in Agriculture</option>
                          <option>Bachelor of Science in Agribusiness</option>
                          <option>Bachelor of Science in Forestry</option>
                          <option>
                            Bachelor of Science in Environmental Science
                          </option>
                          <option>Bachelor of Science in Biology</option>
                          <option>Bachelor of Science in Mathematics</option>
                          <option>Bachelor of Science in Chemistry</option>
                          <option>Bachelor of Science in Psychology</option>
                          <option>Bachelor of Arts in Communication</option>
                          <option>
                            Bachelor of Arts in English Language Studies
                          </option>
                          <option>B.S. in Business Administration</option>
                          <option>Bachelor in Public Administration</option>
                          <option>B.S. in Management Accounting</option>
                          <option>B.S. in Entrepreneurship</option>
                          <option>B.S. in Accountancy</option>
                          <option>B.S. in Hospitality Management</option>
                          <option>B.S. in Tourism Management</option>
                          <option>
                            Bachelor of Science in Agricultural and Biosystems
                            Engineering
                          </option>
                          <option>B.S. in Civil Engineering</option>
                          <option>Bachelor of Elementary Education</option>
                          <option>Bachelor of Secondary Education</option>
                          <option>Bachelor of Physical Education</option>
                          <option>
                            Bachelor of Technology and Livelihood Education
                          </option>
                          <option>
                            Bachelor of Science in Information Technology
                          </option>
                          <option>
                            Bachelor of Science in Information Systems
                          </option>
                          <option>
                            Bachelor of Science in Computer Science
                          </option>
                          <option>
                            Bachelor of Library and Information Science
                          </option>
                          <option>
                            B.S. in Fisheries and Aquatic Sciences
                          </option>
                          <option>B.S. in Criminology</option>
                          <option>
                            Bachelor of Science in Law Enforcement
                            Administration
                          </option>
                          <option>Bachelor of Science in Nursing</option>
                          <option>
                            3 Year Diploma in Agricultural Technology
                          </option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Year</label>
                        <select name="year" className="form-select" required>
                          <option value="">Select Year</option>
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                          <option value="5th Year">5th Year</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Date</label>
                      <input
                        type="date"
                        name="date"
                        className="form-control"
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">
                      Submit
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary ms-2"
                      onClick={() => setActiveView("formOptions")}
                    >
                      Back
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        );

      case "monitoring":
        return (
          <div className="section onlineFormSection">
            <div
              className="form-section MedMonitoringForm"
              style={{ display: "block" }}
            >
              <div className="card mb-4 shadow-sm">
                <div className="card-header bg-success text-white fw-bold">
                  Medical Monitoring
                </div>
                <div className="card-body">
                  <form onSubmit={handleMedMonitoringSubmit}>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Time of Arrival</label>
                        <input
                          type="time"
                          name="arrival"
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Name of Patient</label>
                        <input
                          type="text"
                          name="patientName"
                          className="form-control"
                          required
                        />
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Sex</label>
                        <select name="sex" className="form-select" required>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Degree/Program</label>
                        <select name="degree" className="form-select" required>
                          <option value="">Select Program</option>
                          <option>
                            Doctor of Philosophy in Animal Science
                          </option>
                          <option>Doctor of Philosophy in Crop Science</option>
                          <option>Doctor of Philosophy in Education</option>
                          <option>Doctor of Public Administration</option>
                          <option>
                            Doctor of Philosophy in Resource Management
                          </option>
                          <option>Master of Arts in Education</option>
                          <option>
                            Master of Arts in Teaching Livelihood Education
                          </option>
                          <option>
                            Master of Science Major in Mathematics Education,
                            Biology Education and Chemistry Education
                          </option>
                          <option>Master of Science in Animal Science</option>
                          <option>Master of Science in Crop Science</option>
                          <option>
                            Master of Science in Agricultural Engineering
                          </option>
                          <option>Master in Business Administration</option>
                          <option>Master in Public Administration</option>
                          <option>Master of Arts in Psychology</option>
                          <option>Master of Arts in English</option>
                          <option>Master in Chemistry</option>
                          <option>Master in Mathematics</option>
                          <option>Master of Biology</option>
                          <option>Master in Psychology</option>
                          <option>Master in Information Technology</option>
                          <option>Doctor of Veterinary Medicine</option>
                          <option>
                            Bachelor of Science in Animal Husbandry
                          </option>
                          <option>Bachelor of Science in Agriculture</option>
                          <option>Bachelor of Science in Agribusiness</option>
                          <option>Bachelor of Science in Forestry</option>
                          <option>
                            Bachelor of Science in Environmental Science
                          </option>
                          <option>Bachelor of Science in Biology</option>
                          <option>Bachelor of Science in Mathematics</option>
                          <option>Bachelor of Science in Chemistry</option>
                          <option>Bachelor of Science in Psychology</option>
                          <option>Bachelor of Arts in Communication</option>
                          <option>
                            Bachelor of Arts in English Language Studies
                          </option>
                          <option>B.S. in Business Administration</option>
                          <option>Bachelor in Public Administration</option>
                          <option>B.S. in Management Accounting</option>
                          <option>B.S. in Entrepreneurship</option>
                          <option>B.S. in Accountancy</option>
                          <option>B.S. in Hospitality Management</option>
                          <option>B.S. in Tourism Management</option>
                          <option>
                            Bachelor of Science in Agricultural and Biosystems
                            Engineering
                          </option>
                          <option>B.S. in Civil Engineering</option>
                          <option>Bachelor of Elementary Education</option>
                          <option>Bachelor of Secondary Education</option>
                          <option>Bachelor of Physical Education</option>
                          <option>
                            Bachelor of Technology and Livelihood Education
                          </option>
                          <option>
                            Bachelor of Science in Information Technology
                          </option>
                          <option>
                            Bachelor of Science in Information Systems
                          </option>
                          <option>
                            Bachelor of Science in Computer Science
                          </option>
                          <option>
                            Bachelor of Library and Information Science
                          </option>
                          <option>
                            B.S. in Fisheries and Aquatic Sciences
                          </option>
                          <option>B.S. in Criminology</option>
                          <option>
                            Bachelor of Science in Law Enforcement
                            Administration
                          </option>
                          <option>Bachelor of Science in Nursing</option>
                          <option>
                            3 Year Diploma in Agricultural Technology
                          </option>
                        </select>
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Student Number</label>
                        <input
                          type="text"
                          name="studentNo"
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Signs/Symptoms</label>
                        <input
                          type="text"
                          name="symptoms"
                          className="form-control"
                          required
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Action</label>
                      <input
                        type="text"
                        name="action"
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Meds/Treatment</label>
                      <input
                        type="text"
                        name="meds"
                        className="form-control text-muted"
                        placeholder="Only Admin can fill out this."
                        readOnly
                      />
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Time of Exit</label>
                        <input
                          type="time"
                          name="exit"
                          className="form-control text-muted"
                          placeholder="Only admin can fill this out"
                          readOnly
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">
                          Duration of Service
                        </label>
                        <select
                          name="duration"
                          className="form-control text-muted"
                          disabled
                        >
                          <option>Only admin can select</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Attending Medical Personnel
                      </label>
                      <input
                        type="text"
                        name="personnel"
                        className="form-control text-muted"
                        placeholder="Only Admin can fill out this."
                        readOnly
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">
                      Submit
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary ms-2"
                      onClick={() => setActiveView("formOptions")}
                    >
                      Back
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        );

      case "certificate":
        return (
          <div className="section onlineFormSection">
            <div
              className="form-section medCertForm"
              style={{ display: "block" }}
            >
              <div className="card mb-4 shadow-sm">
                <div className="card-header bg-success text-white">
                  Medical Certificate
                </div>
                <div className="card-body">
                  <form onSubmit={handleMedCertSubmit}>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Name of Patient</label>
                        <input
                          type="text"
                          name="name"
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Age</label>
                        <input
                          type="text"
                          name="age"
                          className="form-control"
                          required
                        />
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Sex</label>
                        <select name="sex" className="form-select" required>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Civil Status</label>
                        <select name="status" className="form-select" required>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                        </select>
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">
                          Student/Employee of:
                        </label>
                        <input
                          type="text"
                          name="school"
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">
                          Student/Employee ID Number
                        </label>
                        <input
                          type="text"
                          name="idNumber"
                          className="form-control"
                          required
                        />
                      </div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Date</label>
                        <input
                          type="date"
                          name="date"
                          className="form-control"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Diagnosis</label>
                        <input
                          type="text"
                          name="diagnosis"
                          className="form-control text-muted"
                          placeholder="Only Admin can fill out this."
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Remarks</label>
                      <input
                        type="text"
                        name="remarks"
                        className="form-control text-muted"
                        placeholder="Only Admin can fill out this."
                        readOnly
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">
                      Submit
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary ms-2"
                      onClick={() => setActiveView("formOptions")}
                    >
                      Back
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        );

      case "history":
        // 1. Alamin kung aling data array ang gagamitin
        let activeHistoryData: (
          | NewStudentData
          | MonitoringData
          | CertificateData
        )[] = [];
        let activeTitle = "";

        // BINAGO ANG LOGIC PARA SA TITLE (WALANG COUNT)
        switch (activeHistoryType) {
          case "physicalExam":
            activeHistoryData = newStudentHistory;
            activeTitle = "Physical Examination";
            break;
          case "monitoring":
            activeHistoryData = monitoringHistory;
            activeTitle = "Medical Monitoring";
            break;
          case "certificate":
            activeHistoryData = certificateHistory;
            activeTitle = "Medical Certificate";
            break;
        }

        // 2. Pagination Calculations
        const totalItems = activeHistoryData.length;
        const totalPages = Math.ceil(totalItems / rowsPerPage);
        const paginatedItems = activeHistoryData.slice(
          (currentPage - 1) * rowsPerPage,
          currentPage * rowsPerPage
        );

        // 3. Helper function para i-render 'yung tamang row
        const renderRow = (entry: any, index: number) => {
          // Kunin 'yung tamang index number para sa page
          const globalIndex = (currentPage - 1) * rowsPerPage + index + 1;

          switch (activeHistoryType) {
            case "physicalExam":
              const pe = entry as NewStudentData;
              return (
                <div key={pe._id || index} className="isu-row">
                  <div className="isu-col index">{globalIndex}.</div>
                  <div className="isu-col main">
                    <div className="isu-title fw-semibold">{pe.name}</div>
                    <div className="isu-meta">
                      {pe.gender} &nbsp;|&nbsp; {pe.course} &nbsp;|&nbsp;{" "}
                      {pe.year}
                    </div>
                    <div className="isu-date text-muted small">{pe.date}</div>
                  </div>
                  <div className="isu-col status">
                    <span
                      className={`badge px-3 py-2 ${
                        pe.status === "approved"
                          ? "bg-success"
                          : pe.status === "rejected"
                            ? "bg-danger"
                            : "bg-warning text-dark"
                      }`}
                    >
                      {pe.status || "pending"}
                    </span>
                  </div>
                </div>
              );
            case "monitoring":
              const mon = entry as MonitoringData;
              return (
                <div key={mon._id || index} className="isu-row">
                  <div className="isu-col index">{globalIndex}.</div>
                  <div className="isu-col main">
                    <div className="isu-title fw-semibold">
                      {mon.patientName}
                    </div>
                    <div className="isu-meta">
                      {mon.sex} &nbsp;|&nbsp; {mon.degree} &nbsp;|&nbsp; Student
                      No: {mon.studentNo}
                    </div>
                    <div className="isu-date text-muted small">
                      Arrival: {mon.arrival} — Symptoms: {mon.symptoms} —
                      Action: {mon.action}
                    </div>
                  </div>
                  <div className="isu-col status">
                    <span
                      className={`badge px-3 py-2 ${
                        mon.status === "approved"
                          ? "bg-success"
                          : mon.status === "rejected"
                            ? "bg-danger"
                            : "bg-warning text-dark"
                      }`}
                    >
                      {mon.status || "pending"}
                    </span>
                  </div>
                </div>
              );

            // ✅ *** ITO 'YUNG PART NA INAYOS *** ✅
            case "certificate":
              const cert = entry as CertificateData;
              return (
                <div key={cert._id || index} className="isu-row">
                  <div className="isu-col index">{globalIndex}.</div>
                  <div className="isu-col main">
                    <div className="isu-title fw-semibold">{cert.name}</div>
                    <div className="isu-meta">
                      {cert.sex} &nbsp;|&nbsp; {cert.civilStatus} &nbsp;|&nbsp;{" "}
                      {cert.school}
                    </div>
                    <div className="isu-date text-muted small">
                      ID: {cert.idNumber} — Date: {cert.date}
                    </div>

                    {/* ✅ *** ITO 'YUNG IDINAGDAG NA FIX *** ✅ */}
                    {/* Ipakita lang 'pag 'approved' na at may data */}
                    {cert.status === "approved" &&
                      (cert.diagnosis || cert.remarks) && (
                        <div className="isu-admin-notes mt-2">
                          {cert.diagnosis && (
                            <div>
                              <strong>Diagnosis:</strong> {cert.diagnosis}
                            </div>
                          )}
                          {cert.remarks && (
                            <div>
                              <strong>Remarks:</strong> {cert.remarks}
                            </div>
                          )}
                        </div>
                      )}
                    {/* ✅ *** END NG FIX *** ✅ */}
                  </div>
                  <div className="isu-col status">
                    <span
                      className={`badge px-3 py-2 ${
                        cert.status === "approved"
                          ? "bg-success"
                          : cert.status === "rejected"
                            ? "bg-danger"
                            : "bg-warning text-dark"
                      }`}
                    >
                      {cert.status || "pending"}
                    </span>
                  </div>
                </div>
              );
            default:
              return null;
          }
        };

        // 4. Helper function para sa Pagination Controls
        const renderPagination = () => {
          // Ito 'yung logic na nagtatago ng pagination kung 1 page lang
          if (totalPages <= 1) return null;

          return (
            <nav aria-label="Page navigation" className="mt-3">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                {/* ✅ NEW: Rows Per Page Selector */}
                <div className="d-flex align-items-center gap-2">
                  <label
                    htmlFor="rowsPerPageStudent"
                    className="text-muted small mb-0"
                  >
                    Rows per page:
                  </label>
                  <select
                    id="rowsPerPageStudent"
                    className="form-select form-select-sm"
                    style={{ width: "auto" }}
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(parseInt(e.target.value, 10));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={3}>3</option>
                    <option value={6}>6</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                  </select>
                </div>

                <ul className="pagination justify-content-end mb-0">
                  <li
                    className={`page-item ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>
                  <li
                    className={`page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </div>
            </nav>
          );
        };

        // 5. Ito 'yung final JSX na ipapakita
        return (
          <div className="section visitHistory" style={{ display: "block" }}>
            {/* --- NILIPAT ANG DROPDOWN DITO (ITAAS-KANAN) --- */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="text-start mb-0">Visit History</h2>

              <div className="history-filter-dropdown">
                <div className="dropdown">
                  <button
                    className="btn dropdown-toggle" // Tinanggal ang w-100
                    type="button"
                    id="historyDropdownMenuButton"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {activeTitle} {/* Ito 'yung title na nagbabago */}
                  </button>
                  <ul
                    className="dropdown-menu dropdown-menu-end" // Idinagdag ang dropdown-menu-end
                    aria-labelledby="historyDropdownMenuButton"
                  >
                    {/* TINANGGAL ANG COUNTS SA LAHAT NG ITEMS */}
                    <li>
                      <a
                        className={`dropdown-item ${
                          activeHistoryType === "physicalExam" ? "active" : ""
                        }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleHistoryTypeChange("physicalExam");
                        }}
                      >
                        Physical Examination
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item ${
                          activeHistoryType === "monitoring" ? "active" : ""
                        }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleHistoryTypeChange("monitoring");
                        }}
                      >
                        Medical Monitoring
                      </a>
                    </li>
                    <li>
                      <a
                        className={`dropdown-item ${
                          activeHistoryType === "certificate" ? "active" : ""
                        }`}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleHistoryTypeChange("certificate");
                        }}
                      >
                        Medical Certificate
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            {/* --- END NG DROPDOWN --- */}

            {/* Ito 'yung card na nag-a-update base sa filter */}
            <div className="card mb-4 shadow-sm">
              <div className="card-header bg-success text-white fw-bold">
                {/* Pinalitan din ang title dito para 'di kasama 'yung "History" */}
                {activeTitle} History
              </div>
              <div className="card-body">
                {paginatedItems.length === 0 ? (
                  <p className="text-muted text-center py-3">
                    No records found for this type.
                  </p>
                ) : (
                  <div className="isu-style-table">
                    {/* I-render 'yung 6 na items para sa current page */}
                    {paginatedItems.map((entry, index) =>
                      renderRow(entry, index)
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* --- ITO 'YUNG PAGINATION CONTROLS --- */}
            {renderPagination()}
          </div>
        );

      case "notifications":
        return (
          <div
            className="section notificationsPage"
            style={{ display: "block" }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="text-start mb-0">Notifications</h2>
            </div>

            <div className="card shadow-sm">
              <div className="card-body">
                {notifications.length === 0 ? (
                  <p className="text-muted text-center py-4">
                    You have no notifications.
                  </p>
                ) : (
                  <div className="notification-list">
                    {notifications.map((notif) => (
                      <div
                        key={notif._id}
                        className={`notification-item ${
                          !notif.isRead ? "unread" : ""
                        }`}
                      >
                        <div className="notification-icon">
                          {notif.recordType === "physicalExam" ? (
                            <i className="bi bi-person-vcard text-success"></i>
                          ) : notif.recordType === "monitoring" ? (
                            <i className="bi bi-heart-pulse text-success"></i>
                          ) : (
                            <i className="bi bi-file-earmark-medical text-success"></i>
                          )}
                        </div>
                        <div className="notification-content">
                          <p className="mb-0">{notif.message}</p>
                          <small className="text-muted">
                            {new Date(notif.createdAt).toLocaleString()}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "landing":
      default:
        return (
          <div className="landing-page" style={{ display: "block" }}>
            <div className="card shadow-sm">
              <div className="card-header bg-success text-white">
                INFIRMARY STAFF
              </div>
              <div className="card-body">
                {/* Staff 1 */}
                <div className="border rounded p-3 mb-3">
                  <h4 className="mb-1">Debie-lyn P. Dolojan</h4>
                  <p className="text-muted mb-2">Nurse </p>
                  <div
                    style={{ maxWidth: "350px" }}
                    className="d-flex flex-column gap-2 mt-2"
                  >
                    <span className="badge bg-success-subtle text-dark px-3 py-2 w-auto">
                      Schedule: TTH 8am - 4pm & F 7:30a - 5pm
                    </span>
                    <span className="badge bg-success-subtle text-dark px-3 py-2 w-auto">
                      Counter: 3
                    </span>
                    <span className="badge bg-success-subtle text-dark px-3 py-2 w-auto">
                      Number: 0983245729
                    </span>
                  </div>
                  <h6 className="mt-3">SERVICES:</h6>
                  <ul className="list-group mt-2">
                    <li className="list-group-item">
                      <span className="fw-bold">Emergency & Critical Care</span>
                    </li>
                    <li className="list-group-item">
                      <span className="fw-bold">
                        Emotional & Psychological Support
                      </span>
                    </li>
                    <li className="list-group-item">
                      <span className="fw-bold">
                        Emergency & First Aid Care
                      </span>
                    </li>
                  </ul>
                </div>
                {/* Staff 2 */}
                <div className="border rounded p-3 mb-3">
                  <h4 className="mb-1">Frequin C. Ramos</h4>
                  <p className="text-muted mb-2">Dentist</p>
                  <div
                    style={{ maxWidth: "350px" }}
                    className="d-flex flex-column gap-2 mt-2"
                  >
                    <span className="badge bg-success-subtle text-dark px-3 py-2 w-auto">
                      Schedule: T 7am - 4pm & W 8:30a - 5pm
                    </span>
                    <span className="badge bg-success-subtle text-dark px-3 py-2 w-auto">
                      Counter: 1
                    </span>
                    <span className="badge bg-success-subtle text-dark px-3 py-2 w-auto">
                      Number: 0932756434
                    </span>
                  </div>
                  <h6 className="mt-3">SERVICES:</h6>
                  <ul className="list-group mt-2">
                    <li className="list-group-item">
                      <span className="fw-bold">
                        Emergency dental care (relief of pain, swelling, broken
                        teeth)
                      </span>
                    </li>
                    <li className="list-group-item">
                      <span className="fw-bold">Preventive Care</span>
                    </li>
                    <li className="list-group-item">
                      <span className="fw-bold">Root canal treatment</span>
                    </li>
                  </ul>
                </div>
                {/* Staff 3 */}
                <div className="border rounded p-3 mb-3">
                  <h4 className="mb-1">Precious S. Paguyo</h4>
                  <p className="text-muted mb-2">Nurse</p>
                  <div
                    style={{ maxWidth: "350px" }}
                    className="d-flex flex-column gap-2 mt-2"
                  >
                    <span className="badge bg-success-subtle text-dark px-3 py-2 w-auto">
                      Schedule: MW 7am - 4pm & T 8:30a - 5pm
                    </span>
                    <span className="badge bg-success-subtle text-dark px-3 py-2 w-auto">
                      Counter: 1
                    </span>
                    <span className="badge bg-success-subtle text-dark px-3 py-2 w-auto">
                      Number: 09853080160
                    </span>
                  </div>
                  <h6 className="mt-3">SERVICES:</h6>
                  <ul className="list-group mt-2">
                    <li className="list-group-item">
                      <span className="fw-bold">Oral Health Education</span>
                    </li>
                    <li className="list-group-item">
                      <span className="fw-bold">
                        Administrative & Record-Keeping
                      </span>
                    </li>
                    <li className="list-group-item">
                      <span className="fw-bold">Patient Care & Monitoring</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            {/* Description Section */}
            <div className="card shadow-sm mt-4">
              <div className="card-header bg-success text-white">
                DESCRIPTION
              </div>
              <div className="card-body">
                <div className="border rounded p-3 mb-3">
                  <h5 className="mb-1">
                    PHYSICAL EXAMINATION OF NEW STUDENT'S
                  </h5>
                  <p className="text-muted mb-2">
                    This form is specifically designed for all new enrollees of
                    ISU. It serves as a requirement to evaluate the student's
                    overall physical health and fitness before being officially
                    admitted.
                  </p>
                </div>
                <div className="border rounded p-3 mb-3">
                  <h5 className="mb-1">MEDICAL MONITORING</h5>
                  <p className="text-muted mb-2">
                    This form is intended for students undergoing On-the-Job
                    Training (OJT) and those enrolled in the National Service
                    Training Program (NSTP).
                  </p>
                </div>
                <div className="border rounded p-3 mb-3">
                  <h5 className="mb-1">MEDICAL CERTIFICATE</h5>
                  <p className="text-muted mb-2">
                    This form is available for all ISU staff and students who
                    may need proof of their medical evaluation or fitness.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="sidebar p-3">
        {/* BINALIK ANG LOGO */}
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

        <ul className="nav flex-column">
          <li className="nav-item">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveView("landing");
              }}
              className="nav-link"
            >
              <i className="bi bi-house-door"></i> Home
            </a>
          </li>
          <li className="nav-item">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveView("formOptions");
              }}
              className="nav-link"
            >
              <i className="bi bi-pencil-square"></i> Online Form
            </a>
          </li>
          <li className="nav-item">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveView("history");
              }}
              className="nav-link"
            >
              <i className="bi bi-clock-history"></i> View Visit History
            </a>
          </li>

          {/* ✅ *** DITO LILITAW 'YUNG BADGE *** */}
          <li className="nav-item">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveView("notifications");
                loadNotifications(); // I-load 'yung listahan
                handleMarkAsRead(); // ✅ I-mark as read pag-click (para mawala 'yung badge)
              }}
              className="nav-link"
            >
              <i className="bi bi-bell"></i> Notifications
              {/* ✅ ITO 'YUNG LOGIC PARA SA NUMBER BADGE */}
              {unreadCount > 0 && (
                <span className="badge bg-danger ms-2">{unreadCount}</span>
              )}
            </a>
          </li>

          <li className="nav-item mt-4">
            <a href="#" onClick={handleLogout} className="nav-link logout-link">
              <i className="bi bi-box-arrow-right"></i> Logout
            </a>
          </li>
        </ul>
      </div>

      {/* Main Container */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* Header */}
        <header
          className="main-header d-flex justify-content-between align-items-center px-4 py-2 bg-white"
          style={{
            position: "relative",
            zIndex: 10,
            boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
          }}
        >
          <h3 className="mb-0 text-capitalize">
            {activeView === "formOptions"
              ? "Online Forms"
              : activeView === "newStudent"
                ? "New Student Form"
                : activeView === "monitoring"
                  ? "Monitoring Form"
                  : activeView === "certificate"
                    ? "Certificate Form"
                    : activeView === "history"
                      ? "Visit History"
                      : activeView === "profile"
                        ? "My Profile"
                        : activeView === "notifications" // Idagdag 'yung title
                          ? "Notifications"
                          : "Student Portal"}
          </h3>

          <div className="user-info d-flex align-items-center gap-2">
            <span className="fw-semibold">{user?.username}</span>
            <div
              className="position-relative profile-picture-container"
              onClick={() => setActiveView("profile")}
              title="View Profile"
              style={{ cursor: "pointer" }}
            >
              <img
                src={getAvatarSrc()}
                alt={user?.username}
                className="rounded-circle border border-2 border-success"
                style={{
                  width: "40px",
                  height: "40px",
                  objectFit: "cover",
                }}
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="content flex-grow-1 p-4">{renderView()}</div>
      </div>

      {/* PFP Upload Modal */}
      {showUploadModal && (
        <div className="modal-backdrop">
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
              {/* ✅✅✅ FIX #2 (UI Warning Issue) APPLIED HERE ✅✅✅ */}
              {/* Dati: {(uploadError || !selectedFile) && ...} */}
              {/* Ngayon, 'uploadError' lang ang titingnan */}
              {uploadError && (
                <div className="alert alert-danger mb-3">{uploadError}</div>
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

                <span className="btn-browse" style={{ pointerEvents: "none" }}>
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

export default StudentDashboard;
