import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./components/pages/home";
import Login from "./components/pages/login";
import Register from "./components/pages/register";
import Modules from "./components/pages/modules";
import Chat from "./components/pages/chat";
import ProtectedRoute from "./ProtectedRoute";

function App() {
    const location = useLocation();

    const hideNavbar =
        location.pathname === "/" ||
        location.pathname === "/login";

    return (
        <>
            {!hideNavbar && <Navbar />}

            <Routes>

                {/* LOGIN */}
                <Route path="/" element={<Login />} />

                <Route path="/login" element={<Login />} />

                {/* PROTECTED HOME */}
                <Route
                    path="/home"
                    element={
                        <ProtectedRoute>
                            <Home />
                        </ProtectedRoute>
                    }
                />

                {/* PROTECTED MODULES */}
                <Route
                    path="/modules"
                    element={
                        <ProtectedRoute>
                            <Modules />
                        </ProtectedRoute>
                    }
                />

                {/* PROTECTED CHAT */}
                <Route
                    path="/chat"
                    element={
                        <ProtectedRoute>
                            <Chat />
                        </ProtectedRoute>
                    }
                />

                {/* PROTECTED REGISTER */}
                <Route
                    path="/register"
                    element={
                        <ProtectedRoute>
                            <Register />
                        </ProtectedRoute>
                    }
                />

                {/* ANY UNKNOWN URL */}
                <Route path="*" element={<Login />} />

            </Routes>
        </>
    );
}

export default App;