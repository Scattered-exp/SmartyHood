
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch("http://localhost:5000/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    username,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Invalid username or password");
                setLoading(false);
                return;
            }

            // Login successful
            localStorage.setItem("authenticated", "true");

            navigate("/home");

        } catch (error) {
            console.error("Login error:", error);
            setError("Unable to connect to server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "#0d0d1a",
                fontFamily: "Arial, sans-serif",
                padding: "20px",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "400px",
                    background: "#11112a",
                    padding: "35px",
                    borderRadius: "16px",
                    border: "1px solid #2d2d52",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                }}
            >
                <h1
                    style={{
                        color: "#e2e8f0",
                        textAlign: "center",
                        marginBottom: "8px",
                    }}
                >
                    SmartyHood
                </h1>

                <p
                    style={{
                        color: "#718096",
                        textAlign: "center",
                        marginBottom: "30px",
                    }}
                >
                    Login to continue
                </p>

                <form onSubmit={handleLogin}>
                    <label
                        style={{
                            color: "#e2e8f0",
                            fontSize: "14px",
                            display: "block",
                            marginBottom: "8px",
                        }}
                    >
                        Username
                    </label>

                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        required
                        style={{
                            width: "100%",
                            padding: "12px",
                            marginBottom: "18px",
                            borderRadius: "8px",
                            border: "1px solid #2d2d52",
                            background: "#1a1a2e",
                            color: "#e2e8f0",
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />

                    <label
                        style={{
                            color: "#e2e8f0",
                            fontSize: "14px",
                            display: "block",
                            marginBottom: "8px",
                        }}
                    >
                        Password
                    </label>

                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        required
                        style={{
                            width: "100%",
                            padding: "12px",
                            marginBottom: "18px",
                            borderRadius: "8px",
                            border: "1px solid #2d2d52",
                            background: "#1a1a2e",
                            color: "#e2e8f0",
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />

                    {error && (
                        <p
                            style={{
                                color: "#f87171",
                                fontSize: "13px",
                                marginBottom: "15px",
                                textAlign: "center",
                            }}
                        >
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "none",
                            borderRadius: "8px",
                            background: loading ? "#4a5568" : "#a78bfa",
                            color: "#0d0d1a",
                            fontSize: "15px",
                            fontWeight: "600",
                            cursor: loading ? "default" : "pointer",
                        }}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;

