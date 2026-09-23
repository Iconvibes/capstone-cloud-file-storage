import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Brand, Button } from "./ui.jsx";

const LINKS = [
  { to: "/#features", label: "Features" },
  { to: "/#security", label: "Security" },
  { to: "/#how", label: "How it works" },
  { to: "/about", label: "About" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => setOpen(false);

  return (
    <header className={`site-head ${scrolled ? "is-scrolled" : ""}`.trim()}>
      <div className="site-head-in">
        <Link to="/" className="site-brand" onClick={close} aria-label="Lumen Vault home">
          <Brand />
        </Link>
        <nav className="site-links" aria-label="Primary">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="site-cta">
          <Link className="btn btn-ghost btn-sm" to="/login">
            Sign in
          </Link>
          <Link className="btn btn-dark btn-sm" to="/register">
            Get started
          </Link>
        </div>
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open ? (
        <div className="mobile-menu">
          {LINKS.map((link) => (
            <Link key={link.to} to={link.to} onClick={close}>
              {link.label}
            </Link>
          ))}
          <div className="mobile-menu-cta">
            <Link className="btn btn-ghost" to="/login" onClick={close}>
              Sign in
            </Link>
            <Link className="btn btn-dark" to="/register" onClick={close}>
              Get started
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
