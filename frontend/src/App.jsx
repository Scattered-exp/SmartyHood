import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./components/pages/home";
import Modules from "./components/pages/modules";
import Chat from "./components/pages/chat";

function App() {
    return (
        <>
            <Navbar />

            <Routes>
                {/* Home */}
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />

                {/* Modules */}
                <Route path="/modules" element={<Modules />} />

                {/* Chat */}
                <Route path="/chat" element={<Chat />} />

                {/* Redirect unknown pages to Home */}
                <Route path="*" element={<Home />} />
            </Routes>
        </>
    );
}

export default App;