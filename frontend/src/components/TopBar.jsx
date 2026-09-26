import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, LogOut, Moon, Search, Settings, Sun, UserRound } from "lucide-react";
import { Avatar, IconButton } from "./ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

export default function TopBar({ title, right, onSearch }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="topbar">
      <div className="topbar-side">
        {onSearch ? (
          <IconButton label="Search your files" onClick={onSearch} className="only-mobile">
            <Search size={20} />
          </IconButton>
        ) : null}
        <h1 className="topbar-title">{title}</h1>
      </div>
      <div className="topbar-side">
        {right}
        <IconButton
          label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </IconButton>
        <IconButton label="Notifications" className="hide-sm">
          <Bell size={19} />
          <span className="dot-badge" aria-hidden="true" />
        </IconButton>
        <div className="account-anchor">
          <button
            type="button"
            className="avatar-btn"
            aria-expanded={menuOpen}
            aria-label="Account menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Avatar name={user?.name ?? "A N"} size="sm" />
          </button>
          {menuOpen ? (
            <div className="menu-pop" role="menu">
              <div className="menu-pop-head">
                <b>{user?.name}</b>
                <small>{user?.email}</small>
              </div>
              <Link to="/app/profile" role="menuitem" onClick={() => setMenuOpen(false)}>
                <UserRound size={16} /> Profile
              </Link>
              <Link to="/app/profile" role="menuitem" onClick={() => setMenuOpen(false)}>
                <Settings size={16} /> Settings
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                  navigate("/");
                }}
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
