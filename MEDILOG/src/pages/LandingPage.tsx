import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/LandingPage.css";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // ✅ ADD THIS STATE: Para ma-track kung nag-scroll na
  const [isScrolled, setIsScrolled] = useState(false);

  // ✅ ADD THIS EFFECT: Event listener sa scroll
  useEffect(() => {
    const handleScroll = () => {
      // Kapag bumaba ng lampas 50px, magiging "scrolled" na siya
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="landing-container">
      {/* --- NAVBAR --- */}
      {/* ✅ UPDATED: Dinagdag ang logic sa className */}
      <nav className={`landing-nav ${isScrolled ? "scrolled" : ""}`}>
        <div className="nav-brand">
          <img
            src="/medilog-icon.svg"
            alt="Medilog Logo"
            className="nav-logo-img"
          />
          <span className="nav-title">MEDILOG</span>
        </div>

        <div className="nav-links d-none d-md-flex">
          <button
            onClick={() => scrollToSection("hero")}
            className="nav-link-item"
          >
            Home
          </button>
          <button
            onClick={() => scrollToSection("features")}
            className="nav-link-item"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection("programmers")}
            className="nav-link-item"
          >
            The Team
          </button>
        </div>

        <div className="nav-actions d-flex align-items-center gap-3">
          <ThemeToggle />
          <button
            className="btn-login-nav"
            onClick={() => navigate("/login/student")}
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section id="hero" className="hero-section">
        <div className="hero-background-elements">
          <div className="hero-pattern-grid"></div>
          <div className="floating-shape shape-circle-1"></div>
          <div className="floating-shape shape-dots-1"></div>
        </div>

        <div className="hero-content pe-lg-5 position-relative z-2">
          <span className="hero-badge">ISU CAMPUS INFIRMARY</span>
          <h1 className="hero-headline">MEDILOG</h1>
          <h2 className="hero-subtitle-large">
            A Medical Service Management System
          </h2>
          <p className="hero-subtext">
            Designed to streamline operations for campus infirmaries and
            healthcare units with modern technology.
          </p>
          <div className="hero-buttons">
            <button
              className="btn-get-started"
              onClick={() => navigate("/signup")}
            >
              Get Started Now <i className="bi bi-arrow-right"></i>
            </button>
            <button
              className="btn-learn-more"
              onClick={() => scrollToSection("features")}
            >
              Learn More
            </button>
          </div>
        </div>

        {/* --- HERO VISUAL CONTAINER (3D ORBIT INTERACTION) --- */}
        <div className="hero-visual-container position-relative z-2">
          {/* Center Logo (The Sun) */}
          <div className="orbit-center-logo">
            <img
              src="/medilog-icon.svg"
              alt="Medilog Official Logo"
              className="hero-logo-main"
            />
            <div className="logo-glow"></div>
          </div>

          {/* Orbit 1: Medicine Capsule */}
          <div className="orbit-ring ring-1">
            <div className="orbit-item item-1">
              <i className="bi bi-capsule"></i>
            </div>
          </div>

          {/* Orbit 2: Heart Pulse */}
          <div className="orbit-ring ring-2">
            <div className="orbit-item item-2">
              <i className="bi bi-heart-pulse-fill"></i>
            </div>
          </div>

          {/* Orbit 3: Secure Shield */}
          <div className="orbit-ring ring-3">
            <div className="orbit-item item-3">
              <i className="bi bi-shield-lock-fill"></i>
            </div>
          </div>

          {/* Decorative Floating Particles */}
          <div className="floating-particle p1"></div>
          <div className="floating-particle p2"></div>
          <div className="floating-particle p3"></div>
        </div>
      </section>

      {/* --- ✅ CORE FEATURES SECTION (HORIZONTAL GRID) --- */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Core Features of MEDILOG</h2>
            <p className="section-subtitle text-muted">
              Powerful tools integrated into one seamless platform for efficient
              infirmary management.
            </p>
            <div className="title-underline"></div>
          </div>

          <div className="features-grid">
            {/* Feature 1 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper icon-green mb-3">
                <i className="bi bi-folder2-open"></i>
              </div>
              <h3>Patient Records Management</h3>
              <p>
                Secure digital health records with easy search and update
                capabilities.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper icon-blue mb-3">
                <i className="bi bi-clipboard-pulse"></i>
              </div>
              <h3>Medical Transaction Logging</h3>
              <p>
                Tracks consultations, treatments, and medicines history
                automatically.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper icon-purple mb-3">
                <i className="bi bi-capsule"></i>
              </div>
              <h3>Inventory & Medicine Tracking</h3>
              <p>
                Monitor stock levels and expiration dates to prevent shortages.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="feature-card">
              <div className="feature-icon-wrapper icon-orange mb-3">
                <i className="bi bi-bar-chart-line"></i>
              </div>
              <h3>Reports & Analytics</h3>
              <p>
                Generate daily/monthly summaries and exportable PDF/Excel
                reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- DESIGNED FOR & BENEFITS SECTION --- */}
      <section id="benefits" className="designed-for-section">
        <div className="row align-items-center w-100 mx-0">
          <div className="col-lg-6 mb-4 mb-lg-0">
            <h2 className="section-title text-start mb-4">Designed For</h2>
            <div className="target-audience-list">
              <div className="audience-item">
                <i className="bi bi-hospital-fill text-success fs-4 me-3"></i>
                <span className="fs-5 fw-bold">Campus Infirmaries</span>
              </div>
              <div className="audience-item">
                <i className="bi bi-person-hearts text-danger fs-4 me-3"></i>
                <span className="fs-5 fw-bold">Nurses & Medical Staff</span>
              </div>
              <div className="audience-item">
                <i className="bi bi-mortarboard-fill text-primary fs-4 me-3"></i>
                <span className="fs-5 fw-bold">Educational Institutions</span>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="benefits-card">
              <h3 className="mb-4">Key Benefits</h3>
              <ul className="benefits-list">
                <li>
                  <i className="bi bi-stopwatch-fill me-2 text-warning"></i>{" "}
                  Faster medical transactions
                </li>
                <li>
                  <i className="bi bi-shield-lock-fill me-2 text-success"></i>{" "}
                  Secure and organized records
                </li>
                <li>
                  <i className="bi bi-graph-up-arrow me-2 text-info"></i> Better
                  decision-making with reports
                </li>
                <li>
                  <i className="bi bi-box-seam-fill me-2 text-primary"></i> No
                  more surprise out-of-stock medicines
                </li>
                <li>
                  <i className="bi bi-emoji-smile-fill me-2 text-purple"></i>{" "}
                  Reduced staff workload
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- PROGRAMMERS SECTION --- */}
      <section id="programmers" className="programmers-section">
        <div className="section-header">
          <h2 className="section-title">About the Programmers</h2>
          <div className="title-underline"></div>
        </div>

        <div className="programmers-grid">
          <div className="programmer-card">
            <div className="p-avatar">
              <i className="bi bi-person-circle"></i>
            </div>
            <h3 className="p-name">Ma. Richlyn Joyce C. Santos</h3>
            <span className="p-role">Front-end Developer | UI/UX Design</span>
            <div className="p-contact">
              <p>
                <i className="bi bi-envelope-fill"></i>{" "}
                marichlynjoyce.c.santos@isu.edu.ph
              </p>
              <p>
                <i className="bi bi-telephone-fill"></i> 09553273478
              </p>
            </div>
          </div>

          <div className="programmer-card">
            <div className="p-avatar">
              <i className="bi bi-person-circle"></i>
            </div>
            <h3 className="p-name">Lady Christaine G. Iñigo</h3>
            <span className="p-role">Front-end Developer | UI/UX Design</span>
            <div className="p-contact">
              <p>
                <i className="bi bi-envelope-fill"></i>{" "}
                ladychristaine.g.inigo@isu.edu.ph
              </p>
              <p>
                <i className="bi bi-telephone-fill"></i> 09853080160
              </p>
            </div>
          </div>

          <div className="programmer-card highlight-card">
            <div className="p-avatar">
              <i className="bi bi-person-fill-gear"></i>
            </div>
            <h3 className="p-name">Zyril Anne C. Villanueva</h3>
            <span className="p-role">Lead Programmer | Full Stack | UI/UX</span>
            <div className="p-contact">
              <p>
                <i className="bi bi-envelope-fill"></i>{" "}
                zyrilanne.c.villanueva@isu.edu.ph
              </p>
              <p>
                <i className="bi bi-telephone-fill"></i> 09812464999
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="landing-footer">
        <p>© 2026 MEDILOG - Isabela State University. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
