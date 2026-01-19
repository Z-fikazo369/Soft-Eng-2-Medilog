import React, { useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { authAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Logo from "../Logo";
import ReCAPTCHA from "react-google-recaptcha";
import "../../styles/AuthStyles.css";

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useParams<{ role: "student" | "admin" }>();
  const { login } = useAuth();

  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const isStudent = role === "student";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
    if (token) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!captchaToken) {
      setError("Please verify you are not a robot.");
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password,
        role: role || "student",
        captchaToken,
      });

      if (response.requiresOTP) {
        setShowOTP(true);
        setUserEmail(response.email || formData.email);
        setError("");
        alert("OTP sent to your email.");
      } else {
        login(response);
        const userRole = response.role;
        if (userRole === "student") {
          navigate("/student/dashboard");
        } else {
          navigate("/admin/dashboard");
        }
      }
    } catch (err: any) {
      console.error("Login failed", err);
      setError(
        err.response?.data?.message || "Invalid credentials. Please try again."
      );
      setCaptchaToken(null);
      recaptchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authAPI.verifyOTP({
        email: userEmail,
        otp: otp,
        rememberMe: rememberMe,
      });

      login(response);

      if (response.role === "student") {
        navigate("/student/dashboard");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  if (!recaptchaSiteKey) {
    return (
      <div className="alert alert-danger m-5">
        Error: RECAPTCHA key missing in .env
      </div>
    );
  }

  // --- RENDER OTP FORM ---
  if (showOTP) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card-centered" style={{ maxWidth: "600px" }}>
          {/* Back Button for OTP */}
          <button
            className="btn btn-link text-decoration-none mb-3 p-0"
            onClick={() => setShowOTP(false)}
            style={{ color: "var(--text-secondary)" }}
          >
            <i className="bi bi-arrow-left"></i> Back
          </button>

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
            <h2 className="auth-title">Verify OTP</h2>
            <p className="auth-subtitle">
              Enter the 6-digit code sent to <strong>{userEmail}</strong>
            </p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleOTPSubmit} className="auth-form">
            <div className="form-group">
              <input
                type="text"
                className="form-input text-center"
                placeholder="000000"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                required
                autoFocus
                style={{
                  fontSize: "1.5rem",
                  letterSpacing: "0.5rem",
                  fontWeight: "bold",
                }}
              />
            </div>

            <div className="form-group d-flex align-items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: "auto" }}
              />
              <label htmlFor="rememberMe" className="mb-0 text-muted">
                Trust this device
              </label>
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying..." : "Verify Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER LOGIN FORM ---
  return (
    <div className="auth-wrapper">
      <div className="auth-card-centered" style={{ maxWidth: "600px" }}>
        {/* ✅ FIX: Home Button inside Card */}
        <Link to="/" className="btn-back-home">
          <i className="bi bi-house-door-fill"></i> Home
        </Link>

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
          <h2 className="auth-title">
            {isStudent ? "Student Login" : "Staff Portal"}
          </h2>
          <p className="auth-subtitle">
            {isStudent ? "" : "Authorized personnel only"}
          </p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address {isStudent && "/ Student ID"}</label>
            <input
              type="text"
              name="email"
              className="form-input"
              placeholder={
                isStudent ? "Email or Student ID" : "name@isu.edu.ph"
              }
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder={
                isStudent ? "Enter LRN as password" : "Enter your password"
              }
              value={formData.password}
              onChange={handleChange}
              required
            />
            {isStudent && (
              <small
                className="text-muted d-block mt-1"
                style={{ fontSize: "0.8rem" }}
              >
                Default password is your LRN.
              </small>
            )}
          </div>

          <div className="form-group d-flex justify-content-center my-2">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={recaptchaSiteKey}
              onChange={handleCaptchaChange}
              theme="light"
            />
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={loading || !captchaToken}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          <p className="mb-2">
            <Link to="/forgot-password">Forgot Password?</Link>
          </p>

          <div>
            {isStudent ? (
              <p className="text-muted">
                Don't have an account? <Link to="/signup">Sign Up</Link> <br />
                <span className="small">or</span>{" "}
                <Link to="/login/admin" className="ms-1">
                  Staff/Admin Login
                </Link>
              </p>
            ) : (
              <p>
                Not a staff member?{" "}
                <Link to="/login/student">Student Login</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
