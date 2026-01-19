import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../../services/api";
import Logo from "../Logo";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword({ email });
      setMessage(response.message);
      setStep("reset");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.resetPassword({
        email,
        otp,
        newPassword,
      });
      setMessage(response.message);

      setTimeout(() => {
        navigate("/login/student");
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <Logo />

        <div className="welcome-title">
          <div className="welcome-title-text">
            {step === "email" ? "Forgot Password" : "Reset Password"}
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {message && (
            <div className="alert alert-success" role="alert">
              {message}
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleRequestOTP}>
              <p className="text-muted text-center mb-4">
                Enter your email address and we'll send you an OTP to reset your
                password.
              </p>

              <div className="mb-3">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary-custom w-100 mb-3"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>

              <div className="text-center">
                <Link to="/login/student" className="text-muted">
                  <i className="bi bi-arrow-left me-2"></i>
                  Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="alert alert-info mb-4">
                <i className="bi bi-envelope-fill me-2"></i>
                OTP sent to: <strong>{email}</strong>
              </div>

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

              <div className="mb-3">
                <input
                  type="password"
                  className="form-control"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                {/* ✅ MINOR IMPROVEMENT ADDED HERE */}
                <small className="text-muted">
                  Must be at least 6 characters
                </small>
              </div>

              <div className="mb-3">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary-custom w-100 mb-3"
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  className="btn btn-link text-muted"
                  onClick={() => setStep("email")}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Use different email
                </button>
              </div>
            </form>
          )}
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

export default ForgotPassword;
