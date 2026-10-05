import { NavLink } from "react-router-dom";
import { Files, Home, Share2, UserRound } from "lucide-react";

// Four destinations like the mobile reference; Starred stays reachable
// from the Home quick actions since the bottom bar is a thumb zone.
const ITEMS = [
  { to: "/app", label: "Home", Icon: Home, end: true },
  { to: "/app/files", label: "Files", Icon: Files, end: false },
  { to: "/app/shared", label: "Shared", Icon: Share2, end: false },
  { to: "/app/profile", label: "Profile", Icon: UserRound, end: false },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {ITEMS.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `bn-item ${isActive ? "is-active" : ""}`.trim()}>
          <Icon size={21} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
