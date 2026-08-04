function Home() {
  return (
    <div style={{ fontFamily: "Arial" }}>
      
      {/* HERO SECTION */}
      <div
       style={{
  background: "linear-gradient(135deg, #050816, #0f172a, #111827)",
  color: "white",
  padding: "clamp(60px, 10vw, 120px) 20px",
  textAlign: "center",
  position: "relative",
  overflow: "hidden"
}}
      >
       <h1
  className="neon-text"
  style={{
    fontSize: "clamp(32px, 8vw, 64px)",
    fontWeight: "bold",
    marginBottom: "20px"
  }}
>
  Welcome to SmartyHood
</h1>

<p
  className="neon-pink"
  style={{
    maxWidth: "700px",
    margin: "auto",
    fontSize: "clamp(16px, 4vw, 22px)",
    lineHeight: "1.6"
  }}
>
  Your NEET Preparation Platform — Notes, PYQs & Community Chat
</p>
{/* MOTIVATION LINE */}
<div
  style={{
    marginTop: "40px",
    display: "inline-block",
    padding: "15px 20px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 0 25px rgba(168,85,247,0.25)"
  }}
>
  <p
    style={{
      fontSize: "clamp(15px, 4vw, 22px)",
      fontWeight: "600",
      lineHeight: "1.8",
      margin: 0,
      background:
        "linear-gradient(90deg, rgb(0,255,255), rgb(168,85,247), rgb(255,0,128))",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      letterSpacing: "0.5px"
    }}
  >
    “Never give up — your hard work today is the proof
    you’ll show the world tomorrow.”
  </p>
</div>
        

        <button
         style={{
  marginTop: "30px",
  padding: "12px 24px",
  fontSize: "clamp(14px,3vw,16px)",
  background: "linear-gradient(90deg, #06b6d4, #8b5cf6)",
  color: "white",
  border: "none",
  borderRadius: "12px",
  cursor: "pointer",
  fontWeight: "bold",
  boxShadow: "0 0 20px rgba(139,92,246,0.5)",
  transition: "0.3s"
}}
        >
          Explore Modules
        </button>
      </div>

      {/* FEATURES SECTION */}
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <h2
  className="neon-text"
  style={{
    fontSize: "clamp(28px,6vw,42px)",
    marginBottom: "20px"
  }}
>
  Why SmartyHood?
</h2>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            marginTop: "30px",
            flexWrap: "wrap"
          }}
        >
          <div style={cardStyle}>
            📚 Study Notes
          </div>

          <div style={cardStyle}>
            📝 PYQs Practice
          </div>

          <div style={cardStyle}>
            💬 Student Chat
          </div>

          <div style={cardStyle}>
            🎯 Exam Focused
          </div>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  padding: "30px",
  width: "100%",
maxWidth: "250px",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "20px",
  fontWeight: "bold",
  color: "white",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 0 20px rgba(0,255,255,0.15)",
  backdropFilter: "blur(10px)",
  transition: "0.3s",
  fontSize: "clamp(16px,4vw,22px)"
};

export default Home;