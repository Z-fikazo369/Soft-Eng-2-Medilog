import React from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../Logo";

const RoleSelection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="auth-card">
        <Logo />

        <div className="text-center mb-4">
          <h3>
            WELCOME TO MEDILOG
            <div className="d-flex justify-content-center gap-4">
              <button
                className="role-button"
                onClick={() => navigate("/login/student")}
              >
                <i className="bi bi-mortarboard-fill"></i>
                <span>Student</span>
              </button>

              <button
                className="role-button"
                onClick={() => navigate("/login/admin")}
              >
                <i className="bi bi-people-fill"></i>
                <span>Admin</span>
              </button>
            </div>
          </h3>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
