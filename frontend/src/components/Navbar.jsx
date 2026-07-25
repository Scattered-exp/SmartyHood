import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav
      style={{
        height: "80px",
        padding: "0 70px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#0B0F19",
        borderBottom: "1px solid #26324A",
        position: "sticky",
        top: 0,
        zIndex: 1000
      }}
    >
      <div className="logo">SmartyHood</div>

      <div
        style={{
          display: "flex",
          gap: "40px",
          alignItems: "center"
        }}
      >
        <Link className="nav-link" to="/">Home</Link>
        <Link className="nav-link" to="/modules">Modules</Link>
        <Link className="nav-link" to="/chat">Chat</Link>
      </div>

      <Link to="/login">
        <button className="primary-btn">
          Login
        </button>
      </Link>
    </nav>
  );
}

export default Navbar;