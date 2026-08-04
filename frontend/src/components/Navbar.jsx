import { useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav
        style={{
          background: "#0B0F19",
          borderBottom: "1px solid #26324A",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "15px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            className="logo"
            style={{
              fontSize: "30px",
              fontWeight: "800",
            }}
          >
            SmartyHood
          </div>

          {/* Desktop Menu */}
          <div className="desktop-menu">
            <Link className="nav-link" to="/">
              Home
            </Link>

            <Link className="nav-link" to="/modules">
              Modules
            </Link>

            <Link className="nav-link" to="/chat">
              Chat
            </Link>

            <Link to="/login">
              <button className="primary-btn">Login</button>
            </Link>
          </div>

          {/* Mobile Button */}
          <button
            className="menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {menuOpen && (
          <div className="mobile-menu">
            <Link
              className="nav-link"
              to="/"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>

            <Link
              className="nav-link"
              to="/modules"
              onClick={() => setMenuOpen(false)}
            >
              Modules
            </Link>

            <Link
              className="nav-link"
              to="/chat"
              onClick={() => setMenuOpen(false)}
            >
              Chat
            </Link>

            <Link to="/login" onClick={() => setMenuOpen(false)}>
              <button className="primary-btn">Login</button>
            </Link>
          </div>
        )}
      </nav>
    </>
  );
}

export default Navbar;