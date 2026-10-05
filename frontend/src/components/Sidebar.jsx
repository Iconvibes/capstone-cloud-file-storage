import { Link, NavLink, useLocation } from "react-router-dom";
import { FolderPlus, Home, Share2, Star, Settings, Files, Clock3 } from "lucide-react";
import { Brand, Avatar } from "./ui.jsx";
import { ClayFolder, CloudGlyph } from "./ClayArt.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";

// "My Files" and "Recent" are the same pathname split by the sort param.
// NavLink only matches on pathname, so both would light up at once — these
// predicates decide which one owns the current route.
const isFiles = (pathname, params) => pathname === "/app/files";
const isFilesDefault = (pathname, params) => isFiles(pathname, params) && params.get("sort") !== "newest";
const isFilesNewest = (pathname, params) => isFiles(pathname, params) && params.get("sort") === "newest";

const NAV = [
  { to: "/app", label: "Home", Icon: Home, end: true },
  { to: "/app/files", label: "My Files", Icon: Files, end: false, activeWhen: isFilesDefault },
  { to: "/app/shared", label: "Shared with me", Icon: Share2, end: false },
  { to: "/app/starred", label: "Starred", Icon: Star, end: false },
  { to: "/app/files?sort=newest", label: "Recent", Icon: Clock3, end: false, activeWhen: isFilesNewest },
];

export default function Sidebar({ onNewFolder }) {
  const { pathname, search } = useLocation();
  const params = new URLSearchParams(search);
  const { folders } = useLibrary();
  const { user } = useAuth();
  const recent = folders.slice(0, 5);

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
          {NAV.map(({ to, label, Icon, end, activeWhen }) => {
            // Entries that share a pathname can't use NavLink's automatic
            // aria-current, or both links would be marked as current.
            if (activeWhen) {
              const on = activeWhen(pathname, params);
              return (
                <Link
                  key={label}
                  to={to}
                  className={`side-link${on ? " active" : ""}`}
                  aria-current={on ? "page" : undefined}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            }
            return (
              <NavLink key={label} to={to} end={end} className="side-link">
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            );
          })}
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
            <NavLink
              key={folder._id}
              to={`/app/files/folder/${folder._id}`}
              className="side-link side-folder-link"
            >
              <ClayFolder seed={folder.name} size={22} className="side-folder-ic" />
              <span className="side-folder-name">{folder.name}</span>
              <b>{folder.fileCount ?? 0}</b>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="side-bottom">
        <div className="side-secure" aria-hidden="true">
          <CloudGlyph size={34} className="side-secure-cloud" />
          <b>Your files, your control</b>
          <small>Secure · Private · Always accessible</small>
        </div>
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
