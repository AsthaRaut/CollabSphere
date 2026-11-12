import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Icon from "./Icon.jsx";
import Logo from "./Logo.jsx";
import { Avatar } from "./ui.jsx";
import useTheme from "./useTheme.js";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);

  const signOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <div className="aurora" />
      <div className="shell">
        {open && <div className="scrim" onClick={() => setOpen(false)} />}

        <aside className={`sidebar ${open ? "open" : ""}`}>
          <NavLink to="/app" aria-label="CollabSphere home">
            <Logo />
          </NavLink>

          <nav className="nav">
            <span className="nav-label">Workspace</span>
            <NavLink to="/app" end>
              <Icon name="home" /> Dashboard
            </NavLink>
            <NavLink to="/app/projects">
              <Icon name="folder" /> Projects
            </NavLink>
            <NavLink to="/app/ai">
              <Icon name="spark" /> AI Studio
            </NavLink>
          </nav>

          <div className="sidebar-foot">
            <div className="user-card">
              <Avatar name={user?.name} size={38} />
              <div className="meta">
                <strong>{user?.name}</strong>
                <span>{user?.email}</span>
              </div>
            </div>
            <div className="foot-row">
              <button className="btn btn-sm" style={{ flex: 1 }} onClick={toggle}>
                <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
                {theme === "dark" ? "Light" : "Dark"}
              </button>
              <button className="btn btn-sm" style={{ flex: 1 }} onClick={signOut}>
                <Icon name="logout" size={15} /> Log out
              </button>
            </div>
            <p className="credit">
              Built by <b>Astha</b>
            </p>
          </div>
        </aside>

        <div>
          <div className="topbar">
            <Logo size={30} />
            <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Open menu">
              <Icon name="menu" />
            </button>
          </div>
          <main className="main">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
