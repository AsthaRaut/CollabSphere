import { Link, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AppLayout from "./components/AppLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Projects from "./pages/Projects.jsx";
import ProjectLayout from "./pages/ProjectLayout.jsx";
import ProjectOverview from "./pages/ProjectOverview.jsx";
import Notes from "./pages/Notes.jsx";
import Files from "./pages/Files.jsx";
import Analytics from "./pages/Analytics.jsx";
import AIStudio from "./pages/AIStudio.jsx";
import PublicProject from "./pages/PublicProject.jsx";
import Logo from "./components/Logo.jsx";

function Home() {
  const { user, ready } = useAuth();
  if (ready && user) return <Navigate to="/app" replace />;
  return <Landing />;
}

function NotFound() {
  return (
    <div className="fullscreen">
      <div className="empty" style={{ border: 0, background: "transparent" }}>
        <Logo />
        <h1 style={{ fontSize: "4rem", marginTop: 16 }}>404</h1>
        <p>We could not find that page.</p>
        <Link to="/" className="btn btn-primary">Back to home</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/p/:slug" element={<PublicProject />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectLayout />}>
            <Route index element={<ProjectOverview />} />
            <Route path="notes" element={<Notes />} />
            <Route path="files" element={<Files />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
          <Route path="ai" element={<AIStudio />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
