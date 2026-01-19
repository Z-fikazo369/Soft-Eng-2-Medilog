import React, { useState } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { authAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Logo from "../Logo";

const OTPVerification: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useParams<{ role: "student" | "admin" }>();
  const location = useLocation();
  const { login } = useAuth();

  const email = location.state?.email || "";
  const isAfterLogin = location.state?.isAfterLogin || false;

  const [otp, setOtp] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Tatawagin ang API
      const response = await authAPI.verifyOTP({
        email,
        otp,
        rememberMe,
      });

      // 2. ✅ Ito 'yung tamang logic para sa token
      login(response);

      // 3. Mag-navigate papunta sa tamang dashboard
      navigate(role === "admin" ? "/admin/dashboard" : "/student/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    setError("");

    try {
      await authAPI.resendOTP(email);
      alert("New OTP sent to your email!");
    } catch (err: any) {
      // ✅ AYOS NA DITO: Idinagdag na ang { }
      setError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <Logo />

        <div className="welcome-title">
          <div className="welcome-title-text">
            {isAfterLogin ? "Verify Your Login" : "Verify OTP"}
          </div>

          <div className="alert alert-info">
            <i className="bi bi-envelope-fill me-2"></i>
            OTP sent to: <strong>{email}</strong>
          </div>

          {isAfterLogin && (
            <div
              className="alert alert-success mb-3"
              style={{ fontSize: "0.9rem" }}
            >
              <i className="bi bi-shield-check me-2"></i>
              For security, please verify the OTP sent to your email before
              accessing your portal.
            </div>
          )}

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="text"
                className="form-control text-center"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                style={{ fontSize: "24px", letterSpacing: "8px" }}
              />
            </div>

            <div className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="rememberMe">
                Remember this device (skip OTP next time)
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary-custom w-100 mb-3"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying..." : "Verify"}
            </button>

            <div className="text-center">
              <button
                type="button"
                className="btn btn-link text-muted"
                onClick={handleResendOTP}
                disabled={resending}
              >
                {resending ? "Resending..." : "Resend OTP"}
              </button>
            </div>
          </form>
        </div>

        <div className="back-link">
          <Link to="/" className="text-muted small">
            <i className="bi bi-arrow-left"></i> Back to role selection
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
