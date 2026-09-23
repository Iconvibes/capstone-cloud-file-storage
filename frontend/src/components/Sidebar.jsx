import { Link, NavLink, useNavigate } from "react-router-dom";
import { FolderPlus, Home, Share2, Star, Trash2, Folder as FolderIcon, Settings, Files } from "lucide-react";
import { Brand, Button } from "./ui.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";

const NAV = [
  { to: "/app", label: "Home", Icon: Home, end: true },
  { to: "/app/files", label: "My Files", Icon: Files, end: false },
  { to: "/app/shared", label: "Shared", Icon: Share2, end: false },
  { to: "/app/starred", label: "Starred", Icon: Star, end: false },
  { to: "/app/trash", label: "Trash", Icon: Trash2, end: false },
];

export default function Sidebar({ onNewFolder, onUpload }) {
  const navigate = useNavigate();
  const { folders, storage, user } = useLibrary();
  const recent = folders.slice(0, 4);
  const usedPct = storage ? Math.min(100, Math.round((storage.usedGb / storage.totalGb) * 100)) : 0;

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
            <NavLink key={folder.id} to={`/app/files/folder/${folder.id}`} className="side-link side-folder-link">
              <span className="side-dot" aria-hidden="true" />
              <span className="side-folder-name">{folder.name}</span>
              <b>{folder.fileCount}</b>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="side-bottom">
        <button type="button" className="side-storage" onClick={() => navigate("/app/profile")}>
          <div className="side-storage-row">
            <span>Storage</span>
            <b>{storage ? `${storage.usedLabel} of ${storage.totalLabel}` : "—"}</b>
          </div>
          <span className="bar">
            <i style={{ width: `${usedPct}%` }} />
          </span>
          <span className="side-storage-cta">Manage storage</span>
        </button>
        <NavLink to="/app/profile" className="side-account">
          <span className="avatar avatar-sm tone-0">{user?.initials ?? "AN"}</span>
          <span className="side-account-meta">
            <b>{user?.name ?? "Account"}</b>
            <small>{user?.plan ?? "Free"} plan</small>
          </span>
          <Settings size={15} aria-hidden="true" />
        </NavLink>
      </div>
    </aside>
  );
}
