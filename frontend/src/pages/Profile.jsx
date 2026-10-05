import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, CircleHelp, KeyRound, LogOut, Moon, ShieldCheck, Sun } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import { Avatar, Button } from "../components/ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";
import { useTheme } from "../theme.js";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { pushToast } = useLibrary();
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";

  const signOut = () => {
    logout();
    navigate("/");
  };

  return (
    <main className="app-page">
      <TopBar title="Profile" />
      <div className="page-pad">
        <header className="profile-hero">
          <Avatar name={user?.name ?? "A N"} size="xl" />
          <div>
            <h1>{user?.name}</h1>
            <p>{user?.email}</p>
          </div>
        </header>

        <section className="settings-group">
          <h2>Account</h2>
          <div className="settings-card">
            <button
              type="button"
              className="settings-row"
              onClick={() => pushToast({ message: "Password changes aren't available yet" })}
            >
              <span className="settings-ic">
                <KeyRound size={17} />
              </span>
              <span className="settings-meta">
                <b>Sign in & security</b>
                <small>Password, verification, devices</small>
              </span>
              <ChevronRight size={17} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="settings-row"
              onClick={() => pushToast({ message: "Sharing defaults aren't available yet" })}
            >
              <span className="settings-ic">
                <ShieldCheck size={17} />
              </span>
              <span className="settings-meta">
                <b>Sharing defaults</b>
                <small>Who can use your links by default</small>
              </span>
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </div>
        </section>

        <section className="settings-group">
          <h2>Preferences</h2>
          <div className="settings-card">
            <button
              type="button"
              className="settings-row"
              role="switch"
              aria-checked={dark}
              onClick={() => setTheme(dark ? "light" : "dark")}
            >
              <span className="settings-ic">
                {dark ? <Moon size={17} /> : <Sun size={17} />}
              </span>
              <span className="settings-meta">
                <b>Dark mode</b>
                <small>{dark ? "On — deep charcoal clay" : "Off — soft, dimmed clay"}</small>
              </span>
              <span className={`switch ${dark ? "is-on" : ""}`.trim()} aria-hidden="true">
                <i />
              </span>
            </button>
            <Link to="/about" className="settings-row">
              <span className="settings-ic">
                <CircleHelp size={17} />
              </span>
              <span className="settings-meta">
                <b>About Lumen Vault</b>
                <small>What the product is built on</small>
              </span>
              <ChevronRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="settings-group">
          <Button variant="ghost" className="btn-block" onClick={signOut}>
            <LogOut size={16} /> Sign out
          </Button>
        </section>
      </div>
    </main>
  );
}
