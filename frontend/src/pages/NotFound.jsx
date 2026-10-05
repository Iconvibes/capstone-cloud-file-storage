import { Link, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";
import { Brand } from "../components/ui.jsx";
import { CloudGlyph } from "../components/ClayArt.jsx";

export default function NotFound() {
  const { pathname } = useLocation();

  // The attempted path is genuinely useful when a link breaks, but it is
  // attacker-controlled, so it is rendered as text and clipped rather than
  // trusted as markup or allowed to stretch the layout.
  const attempted = pathname && pathname.length > 120 ? pathname.slice(0, 117) + "…" : pathname;

  return (
    <main className="notfound-page">
      <header className="notfound-top">
        <Link to="/" className="notfound-brand" aria-label="LumenVault home">
          <Brand />
        </Link>
      </header>

      <section className="notfound-card">
        <span className="notfound-art" aria-hidden="true">
          <CloudGlyph size={46} />
        </span>

        <p className="notfound-code">
          <span aria-hidden="true">404</span>
          <span className="sr-only">Page not found.</span>
        </p>

        <h1>We couldn&rsquo;t find that page</h1>
        <p className="notfound-lead">
          The link may be out of date. Nothing was deleted &mdash; your files are
          exactly where you left them.
        </p>

        {attempted ? (
          <p className="notfound-path">
            <span className="notfound-path-label">You asked for</span>
            <code title={pathname}>{attempted}</code>
          </p>
        ) : null}

        <div className="notfound-actions">
          <Link to="/app" className="btn btn-dark">
            <Compass size={17} aria-hidden="true" />
            Open my library
          </Link>
          <Link to="/" className="btn btn-ghost">
            Go home
          </Link>
        </div>
      </section>
    </main>
  );
}