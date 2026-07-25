import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./components/pages/home";
import Login from "./components/pages/login";
import Register from "./components/pages/register";
import Modules from "./components/pages/modules";
import Chat from "./components/pages/chat";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/modules" element={<Modules />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </>
  );
}

export default App;