import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Container } from "react-bootstrap";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/Auth/PrivateRoute";
import Dashboard from "./components/Dashboard";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Navbar from "./components/Navbar";
import Community from "./components/Community";
import Badges from "./components/Badges";
import ImpactJournal from "./components/ImpactJournal";
import "./index.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Container className="mt-4">
          <Routes>
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/community" element={<PrivateRoute><Community /></PrivateRoute>} />
            <Route path="/badges" element={<PrivateRoute><Badges /></PrivateRoute>} />
            <Route path="/journal" element={<PrivateRoute><ImpactJournal /></PrivateRoute>} />
          </Routes>
        </Container>
      </AuthProvider>
    </Router>
  );
}

export default App;