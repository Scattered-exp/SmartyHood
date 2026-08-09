import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
    const authenticated = localStorage.getItem("authenticated");

    if (authenticated !== "true") {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;