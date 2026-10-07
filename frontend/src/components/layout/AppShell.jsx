import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3, History, Home, LogOut, Menu, Moon, Sparkles,
  Sun, UserRound, X,
} from "lucide-react";
import BrandLogo from "../common/BrandLogo";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";


const navigation = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/insights", label: "Data Insights", icon: BarChart3 },
  { to: "/predict", label: "Predict", icon: Sparkles },
  { to: "/history", label: "History", icon: History },
];

const pageNames = {
  "/": "Dashboard",
  "/insights": "Data Insights",
  "/predict": "Customer Prediction",
  "/predict/result": "Prediction Result",
  "/history": "Prediction History",
};

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-viewport">
      <div className="app-layout">
        <button className={`mobile-overlay ${menuOpen ? "visible" : ""}`} aria-label="Close menu" onClick={() => setMenuOpen(false)} />
        <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
          <div className="brand">
            <BrandLogo variant="light" />
            <button className="icon-btn sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X /></button>
          </div>
          <nav aria-label="Primary navigation">
            <span className="nav-label">Workspace</span>
            {navigation.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <Icon size={19} /><span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="user-card">
              <span className="avatar">{user?.full_name?.charAt(0).toUpperCase()}</span>
              <div><strong>{user?.full_name}</strong><span>{user?.email}</span></div>
            </div>
            <button className="nav-item logout-button" onClick={handleLogout}><LogOut size={19} /><span>Logout</span></button>
          </div>
        </aside>

        <div className="workspace">
          <header className="topbar">
            <div className="topbar-left">
              <button className="icon-btn menu-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button>
              <div className="topbar-title"><span>DepositIQ / Workspace</span><strong>{pageNames[location.pathname] || "Dashboard"}</strong></div>
            </div>
            <div className="topbar-actions">
              <button className="icon-btn theme-button" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
                {theme === "dark" ? <Sun /> : <Moon />}
              </button>
              <span className="topbar-user"><span className="topbar-avatar"><UserRound size={16} /></span><span><small>Signed in as</small><strong>{user?.full_name?.split(" ")[0]}</strong></span></span>
            </div>
          </header>
          <main className="content"><div className="route-view" key={location.pathname}><Outlet /></div></main>
        </div>
      </div>
    </div>
  );
}
