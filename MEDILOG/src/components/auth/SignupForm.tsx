import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../../services/api";
import Logo from "../Logo";
import "../../styles/AuthStyles.css";

const SignupForm: React.FC = () => {
  const navigate = useNavigate();

  const [userType, setUserType] = useState<"student" | "staff">("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [idPicture, setIdPicture] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    contactNumber: "",
    lrn: "",
    studentId: "",
    department: "",
    program: "",
    yearLevel: "",
    employeeId: "",
    position: "",
    preferredLoginMethod: "email" as "email" | "studentId",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIdPicture(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!idPicture) throw new Error("Please upload a valid ID picture.");

      const data = new FormData();
      data.append("username", formData.username);
      data.append("email", formData.email);
      data.append("role", userType);
      data.append("idPicture", idPicture);

      if (userType === "student") {
        if (formData.lrn.length !== 12)
          throw new Error("LRN must be exactly 12 digits");
        if (!formData.studentId) throw new Error("Student ID is required.");

        data.append("lrn", formData.lrn);
        data.append("studentId", formData.studentId);
        data.append("department", formData.department);
        data.append("program", formData.program);
        data.append("yearLevel", formData.yearLevel);
        data.append("preferredLoginMethod", formData.preferredLoginMethod);
      } else {
        if (!formData.position) throw new Error("Please select a position.");
        if (!formData.employeeId)
          throw new Error("Employee ID / License No. is required.");

        data.append("employeeId", formData.employeeId);
        data.append("position", formData.position);
      }

      await authAPI.signup(data);
      alert(
        `Account created successfully! Please wait for Admin Verification.`
      );
      navigate("/");
    } catch (err: any) {
      setError(err.message || err.response?.data?.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card-centered">
        {/* ✅ FIX: Home Button inside the card (Top Left) */}
        <Link to="/" className="btn-back-home">
          <i className="bi bi-house-door-fill"></i> Home
        </Link>

        {/* Logo Centered */}
        <div className="auth-header">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "1rem",
            }}
          >
            <Logo />
          </div>
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join the ISU Infirmary System</p>
        </div>

        {/* Role Toggle */}
        <div className="role-toggle-wrapper">
          <div
            className={`role-toggle-btn ${
              userType === "student" ? "active" : ""
            }`}
            onClick={() => setUserType("student")}
          >
            <span>Student</span>
            <div className="role-circle"></div>
          </div>
          <div
            className={`role-toggle-btn ${
              userType === "staff" ? "active" : ""
            }`}
            onClick={() => setUserType("staff")}
          >
            <span>Infirmary Staff</span>
            <div className="role-circle"></div>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group half">
              <label>Full Name</label>
              <input
                type="text"
                name="username"
                className="form-input"
                placeholder="Juan Dela Cruz"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group half">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="juan@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {userType === "student" && (
            <div className="d-flex flex-column gap-3">
              <div className="form-row">
                <div className="form-group half">
                  <label>Student ID</label>
                  <input
                    type="text"
                    name="studentId"
                    className="form-input"
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group half">
                  <label>LRN (12 Digits)</label>
                  <input
                    type="text"
                    name="lrn"
                    maxLength={12}
                    className="form-input"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Department</label>
                <select
                  name="department"
                  className="form-select"
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Department</option>
                  <option value="College of Education">
                    College of Education
                  </option>
                  <option value="College of Business, Accountancy and Public Administration">
                    College of Business, Accountancy and Public Administration
                  </option>
                  <option value="College of Agriculture">
                    College of Agriculture
                  </option>
                  <option value="College of Computing Studies, Information and Communication Technology">
                    College of Computing Studies, Information and Communication
                    Technologys
                  </option>
                  <option value="School of Veterinary Medicine">
                    School of Veterinary Medicine
                  </option>
                  <option value="College of Engineering">
                    College of Engineering
                  </option>
                  <option value="College of Criminal Justice Education">
                    College of Criminal Justice Education
                  </option>
                  <option value="College of Nursing">College of Nursing</option>
                  <option value="Institute of Fisheries">
                    Institute of Fisheries
                  </option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Program</label>
                  <select
                    name="program"
                    className="form-select"
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Program</option>
                    <option>Doctor of Philosophy in Animal Science</option>
                    <option>Doctor of Philosophy in Crop Science</option>
                    <option>Doctor of Philosophy in Education</option>
                    <option>Doctor of Public Administration</option>
                    <option>Doctor of Philosophy in Resource Management</option>
                    <option>Master of Arts in Education</option>
                    <option>
                      Master of Arts in Teaching Livelihood Education
                    </option>
                    <option>
                      Master of Science Major in Mathematics Education, Biology
                      Education and Chemistry Education
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
                    <option>Bachelor of Science in Animal Husbandry</option>
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
                    <option>Bachelor of Science in Information Systems</option>
                    <option>Bachelor of Science in Computer Science</option>
                    <option>Bachelor of Library and Information Science</option>
                    <option>B.S. in Fisheries and Aquatic Sciences</option>
                    <option>B.S. in Criminology</option>
                    <option>
                      Bachelor of Science in Law Enforcement Administration
                    </option>
                    <option>Bachelor of Science in Nursing</option>
                    <option>3 Year Diploma in Agricultural Technology</option>
                  </select>
                </div>
                <div className="form-group half">
                  <label>Year Level</label>
                  <select
                    name="yearLevel"
                    className="form-select"
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select...</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="5th Year">5th Year</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Preferred Login Method</label>
                <select
                  name="preferredLoginMethod"
                  className="form-select"
                  value={formData.preferredLoginMethod}
                  onChange={handleChange}
                  required
                >
                  <option value="email">Email Address</option>
                  <option value="studentId">Student ID Number</option>
                </select>
              </div>
            </div>
          )}

          {userType === "staff" && (
            <div className="d-flex flex-column gap-3">
              <div className="form-row">
                <div className="form-group half">
                  <label>Employee ID / License</label>
                  <input
                    type="text"
                    name="employeeId"
                    className="form-input"
                    placeholder="PRC License or ID No."
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group half">
                  <label>Position</label>
                  <select
                    name="position"
                    className="form-select"
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Role...</option>
                    <option value="Nurse">Nurse</option>
                    <option value="Nurse Attendant">Nurse Attendant</option>
                    <option value="Administrative Aide">
                      Administrative Aide
                    </option>
                    <option value="Head Director">Head Director</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Upload ID Verification</label>
            <input
              type="file"
              className="form-input"
              style={{ padding: "10px" }}
              onChange={handleFileChange}
              required
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Processing..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/login/student">Sign In</Link>
          <span className="mx-2">|</span>
          <Link to="/login/admin">Admin Login</Link>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
