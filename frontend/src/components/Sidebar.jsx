import { Link, NavLink } from "react-router-dom";
import { FolderPlus, Home, Share2, Star, Settings, Files } from "lucide-react";
import { Brand, Avatar } from "./ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";

const NAV = [
  { to: "/app", label: "Home", Icon: Home, end: true },
  { to: "/app/files", label: "My Files", Icon: Files, end: false },
  { to: "/app/shared", label: "Shared", Icon: Share2, end: false },
  { to: "/app/starred", label: "Starred", Icon: Star, end: false },
];

export default function Sidebar({ onNewFolder }) {
  const { folders } = useLibrary();
  const { user } = useAuth();
  const recent = folders.slice(0, 4);

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "A";

  return (
    <aside className="sidebar">
      <div className="side-top">
        <Link to="/app" className="side-brand" aria-label="Lumen Vault home">
          <Brand />
        </Link>
        <nav className="side-nav" aria-label="Library">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="side-link">
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="side-sep" />
        <p className="side-title">
          Folders
          <button type="button" className="side-add" onClick={onNewFolder} aria-label="New folder">
            <FolderPlus size={16} />
          </button>
        </p>
        <nav className="side-nav side-folders" aria-label="Folders">
          {recent.map((folder) => (
            <NavLink key={folder._id} to={`/app/files/folder/${folder._id}`} className="side-link side-folder-link">
              <span className="side-dot" aria-hidden="true" />
              <span className="side-folder-name">{folder.name}</span>
              <b>{folder.fileCount ?? 0}</b>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="side-bottom">
        <NavLink to="/app/profile" className="side-account">
          <span className="avatar avatar-sm tone-0">{initials}</span>
          <span className="side-account-meta">
            <b>{user?.name ?? "Account"}</b>
            <small>{user?.email ?? ""}</small>
          </span>
          <Settings size={15} aria-hidden="true" />
        </NavLink>
      </div>
    </aside>
  );
}
