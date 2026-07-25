function Modules() {
  return (
    <div style={{ padding: "40px", fontFamily: "Arial", color: "white" }}>

      <h1 className="neon-text">Study Modules</h1>

      <p>Download NEET Notes, PYQs and Study Material</p>

      <div style={{ marginTop: "30px" }}>

        {/* MODULE CARD 1 */}
        <div className="glass" style={cardStyle}>
          <h3 className="neon-text">Biology - Animal Kingdom</h3>
          <p>NEET Important Notes PDF</p>
          
           <a href="/pdfs/animal-kingdom.pdf" download>
    <button style={btnStyle}>
      Download
    </button>
  </a>
        </div>

        {/* MODULE CARD 2 */}
        <div className="glass" style={cardStyle}>
          <h3 className="neon-text">Chemistry - Organic Basics</h3>
          <p>Reaction Mechanism Notes</p>
          <button style={btnStyle}>Download</button>
        </div>

        {/* MODULE CARD 3 */}
        <div className="glass" style={cardStyle}>
          <h3 className="neon-text">Physics - Motion</h3>
          <p>Important Formulas + PYQs</p>
          <button style={btnStyle}>Download</button>
        </div>

      </div>
    </div>
  );
}

const cardStyle = {
  padding: "20px",
  marginBottom: "15px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  backdropFilter: "blur(10px)"
};

const btnStyle = {
  marginTop: "10px",
  padding: "8px 15px",
  background: "#00f5ff",
  color: "#000",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "bold"
};

export default Modules;