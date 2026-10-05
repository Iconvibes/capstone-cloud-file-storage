import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Bell, LogOut, Search, Settings, UserRound, X } from "lucide-react";
import { Avatar, IconButton } from "./ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// Global chrome: one recessed search field (desktop/tablet) that filters the
// Files screen live, a search icon on phones that hands the term over, the
// notifications dot and the account menu.
export default function TopBar({ title, right }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const { user, logout } = useAuth();

  const onFiles = location.pathname.startsWith("/app/files");
  const urlTerm = params.get("q") ?? "";

  // Adopt a term that arrived from elsewhere (mobile jump, back/forward).
  useEffect(() => {
    if (urlTerm) setTerm(urlTerm);
  }, [urlTerm]);

  // On the Files screen the field drives the query in place — one search box,
  // no second copy inside the page.
  useEffect(() => {
    if (!onFiles) return undefined;
    if (urlTerm === term.trim()) return undefined;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (term.trim()) next.set("q", term.trim());
      else next.delete("q");
      setParams(next, { replace: true });
    }, 350);
    return () => clearTimeout(timer);
  }, [term, onFiles, urlTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const goSearch = (value) => {
    const next = new URLSearchParams();
    next.set("focus", "search");
    if (value.trim()) next.set("q", value.trim());
    setTerm(value);
    navigate(`/app/files?${next.toString()}`);
  };

  const submit = (event) => {
    event.preventDefault();
    if (onFiles) {
      const next = new URLSearchParams(params);
      if (term.trim()) next.set("q", term.trim());
      else next.delete("q");
      setParams(next, { replace: true });
      return;
    }
    goSearch(term);
  };

  const clear = () => {
    setTerm("");
    if (onFiles) {
      const next = new URLSearchParams(params);
      next.delete("q");
      setParams(next, { replace: true });
    } else {
      navigate("/app/files");
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-side">
        <h1 className="topbar-title">{title}</h1>
        <form className="topbar-search" role="search" onSubmit={submit}>
          <Search size={17} aria-hidden="true" />
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search files, folders…"
            aria-label="Search files and folders"
          />
          {term ? (
            <button type="button" className="topbar-search-clear" onClick={clear} aria-label="Clear search">
              <X size={15} />
            </button>
          ) : null}
        </form>
        <IconButton
          label="Search your files"
          className="only-mobile"
          onClick={() => goSearch(urlTerm)}
        >
          <Search size={20} />
        </IconButton>
      </div>
      <div className="topbar-side">
        {right}
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
