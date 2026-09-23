import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Brand, Button } from "../components/ui.jsx";

export default function NotFound() {
  return (
    <main className="notfound-page">
      <Brand />
      <span className="notfound-code" aria-hidden="true">
        404
      </span>
      <h1>That page moved or never existed</h1>
      <p>The link may be old. Your files are exactly where you left them.</p>
      <div className="notfound-actions">
        <Link to="/" className="btn btn-dark">
          Go home
        </Link>
        <Link to="/app" className="btn btn-ghost">
          Open my library
        </Link>
      </div>
    </main>
  );
}
