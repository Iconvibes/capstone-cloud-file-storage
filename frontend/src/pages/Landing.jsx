import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CloudUpload,
  Folder,
  FolderLock,
  Gauge,
  Link2,
  MonitorSmartphone,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import AppMockup from "../components/AppMockup.jsx";
import { useReveal } from "../components/hooks.js";

function Reveal({ as: Tag = "div", className = "", children, ...rest }) {
  const ref = useReveal();
  return (
    <Tag ref={ref} className={`reveal ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}

export default function Landing() {
  return (
    <div className="marketing">
      <Navbar />

      {/* HERO */}
      <section className="hero">
        <div className="hero-in">
          <Reveal className="hero-copy">
            <p className="eyebrow">
              <Sparkles size={14} aria-hidden="true" /> Cloud storage that stays out of the way
            </p>
            <h1>
              Everything you need,
              <br />
              right where you left it.
            </h1>
            <p className="hero-lede">
              Lumen Vault keeps your documents, photos and projects in one calm place — organized,
              easy to find, and ready on every device you use.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-dark btn-lg">
                Create free account <ArrowRight size={17} />
              </Link>
              <Link to="/login" className="btn btn-quiet btn-lg">
                Sign in
              </Link>
            </div>
            <p className="hero-note">
              <Check size={14} aria-hidden="true" /> Free for personal use <i /> <Check size={14} aria-hidden="true" /> No
              card required
            </p>
          </Reveal>
          <Reveal className="hero-visual">
            <div className="hero-tilt">
              <AppMockup />
            </div>
            <div className="hero-chip hero-chip-1">
              <CloudUpload size={16} />
              <span>
                <b>Product Demo.mp4</b>
                <small>Uploaded just now</small>
              </span>
            </div>
            <div className="hero-chip hero-chip-2">
              <Link2 size={16} />
              <span>
                <b>Link copied</b>
                <small>Brand Guidelines.pdf</small>
              </span>
            </div>
            <div className="hero-chip hero-chip-3">
              <Search size={16} />
              <span>
                <b>12 results · 0.2s</b>
                <small>“proposal”</small>
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="trust">
        <p>TRUSTED FOR EVERYDAY WORK</p>
        <div>
          <span>Personal files</span>
          <span>Client projects</span>
          <span>Design assets</span>
          <span>Research</span>
          <span>Family photos</span>
        </div>
      </section>

      {/* FEATURES */}
      <section className="landing-sec" id="features">
        <Reveal className="sec-head">
          <p className="kicker">Features</p>
          <h2>Simple tools that respect your attention</h2>
          <p className="sec-lede">
            The things you do with files every week — save them, find them, send them — without the clutter of an
            enterprise console.
          </p>
        </Reveal>
        <div className="feat-grid">
          <Reveal className="feat feat-wide">
            <div className="feat-copy">
              <span className="feat-ic">
                <Search size={19} />
              </span>
              <h3>Find files in seconds</h3>
              <p>
                Search reaches every folder the moment you start typing, so nothing is ever more than a few keystrokes
                away.
              </p>
            </div>
            <div className="feat-demo feat-demo-search" aria-hidden="true">
              <div className="feat-search-row">
                <Search size={14} /> proposal
              </div>
              {["Project Proposal.pdf", "Proposal – draft notes.docx", "Proposal budget.xlsx"].map((name, i) => (
                <div className="feat-search-hit" key={name} style={{ animationDelay: `${i * 90}ms` }}>
                  {name}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal className="feat">
            <span className="feat-ic">
              <Folder size={19} />
            </span>
            <h3>Folders that make sense</h3>
            <p>Keep projects, clients and life in their own tidy spaces, nested as deep as you need.</p>
          </Reveal>
          <Reveal className="feat">
            <span className="feat-ic">
              <Share2 size={19} />
            </span>
            <h3>Share on your terms</h3>
            <p>Send a clean link, choose view or edit, and take access back whenever the work is done.</p>
          </Reveal>
          <Reveal className="feat">
            <span className="feat-ic">
              <MonitorSmartphone size={19} />
            </span>
            <h3>Every screen you own</h3>
            <p>Start on your phone, finish on your laptop. Your library looks the same everywhere.</p>
          </Reveal>
          <Reveal className="feat">
            <span className="feat-ic">
              <Gauge size={19} />
            </span>
            <h3>Storage you can read</h3>
            <p>A clear view of what is using space, so you are never surprised by a full account.</p>
          </Reveal>
        </div>
      </section>

      {/* SECURITY */}
      <section className="landing-sec sec-alt" id="security">
        <div className="sec-split">
          <Reveal className="sec-head">
            <p className="kicker">Security</p>
            <h2>Private by default, careful by design</h2>
            <p className="sec-lede">
              Your files are yours. Sharing is always an explicit action, account access is protected, and everything
              you store stays in your control.
            </p>
            <ul className="sec-list">
              {[
                "Private storage — nothing is public unless you share it",
                "Links you can revoke at any time",
                "Account protection with sign-in verification",
                "Recovery options that keep you in charge",
              ].map((item) => (
                <li key={item}>
                  <ShieldCheck size={16} aria-hidden="true" /> {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="sec-visual">
            <div className="sec-card">
              <span className="sec-card-ic">
                <FolderLock size={22} />
              </span>
              <b>Private by default</b>
              <p>Files stay in your library until you decide to share one.</p>
            </div>
            <div className="sec-card">
              <span className="sec-card-ic">
                <Link2 size={22} />
              </span>
              <b>Links you control</b>
              <p>View or edit, per person, revocable in one tap.</p>
            </div>
            <div className="sec-card">
              <span className="sec-card-ic">
                <ShieldCheck size={22} />
              </span>
              <b>Protected sign-in</b>
              <p>Verification and recovery that keep your account yours.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="landing-sec" id="how">
        <Reveal className="sec-head">
          <p className="kicker">How it works</p>
          <h2>Three steps and you are organized</h2>
        </Reveal>
        <div className="how-grid">
          {[
            {
              Icon: CloudUpload,
              n: "01",
              title: "Upload",
              body: "Drag files in or add them from your phone. Progress is clear and every file lands where you put it.",
            },
            {
              Icon: Folder,
              n: "02",
              title: "Organize",
              body: "Group work into folders, star what matters, and rename anything in place.",
            },
            {
              Icon: MonitorSmartphone,
              n: "03",
              title: "Access",
              body: "Preview, download or share from any device — your library is identical everywhere.",
            },
          ].map(({ Icon, n, title, body }, index) => (
            <Reveal className="how-step" key={n} style={{ transitionDelay: `${index * 90}ms` }}>
              <span className="how-n">{n}</span>
              <span className="how-ic">
                <Icon size={20} />
              </span>
              <h3>{title}</h3>
              <p>{body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* USE CASES */}
      <section className="landing-sec sec-alt">
        <Reveal className="sec-head">
          <p className="kicker">Use cases</p>
          <h2>One home for every kind of work</h2>
        </Reveal>
        <div className="use-grid">
          {[
            { title: "Personal files", body: "ID copies, leases, warranties — the documents life runs on, findable in seconds." },
            { title: "Work documents", body: "Contracts, reports and decks that follow you from one meeting to the next." },
            { title: "Creative projects", body: "Moodboards, drafts and exports for the things you make." },
            { title: "Research & study", body: "Papers, notes and datasets kept together until the work is done." },
          ].map((use, index) => (
            <Reveal className="use-card" key={use.title} style={{ transitionDelay: `${index * 80}ms` }}>
              <h3>{use.title}</h3>
              <p>{use.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PRODUCT PREVIEW */}
      <section className="landing-sec">
        <Reveal className="sec-head">
          <p className="kicker">Product preview</p>
          <h2>Designed to feel light on every screen</h2>
          <p className="sec-lede">A quick look at the workspace you will actually open every day.</p>
        </Reveal>
        <Reveal className="preview-duo">
          <div className="preview-phone-wrap">
            <AppMockup compact />
          </div>
          <div className="preview-desk">
            <div className="preview-desk-bar">
              <span /> <span /> <span />
              <em>lumenvault.app/app/files</em>
            </div>
            <div className="preview-desk-body">
              <div className="preview-desk-side">
                <b>Lumen Vault</b>
                {["Home", "My Files", "Shared", "Starred", "Trash"].map((item, i) => (
                  <span key={item} className={i === 1 ? "is-active" : ""}>
                    {item}
                  </span>
                ))}
                <div className="preview-desk-storage">
                  <span>Storage</span>
                  <span className="bar">
                    <i style={{ width: "38%" }} />
                  </span>
                  <small>38.4 GB of 100 GB</small>
                </div>
              </div>
              <div className="preview-desk-main">
                {["Project Proposal.pdf", "Brand Guidelines.pdf", "Financial Report.xlsx", "Roadmap 2026.pptx"].map(
                  (name, i) => (
                    <div className="preview-desk-row" key={name}>
                      <span className={`file-ic tone-${["red", "red", "green", "orange"][i]} sm`}>
                        <b>{["PDF", "PDF", "XLS", "PPT"][i]}</b>
                      </span>
                      <span className="preview-desk-name">{name}</span>
                      <span className="preview-desk-size">{["2.4 MB", "8.5 MB", "1.5 MB", "11 MB"][i]}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta" id="cta">
        <Reveal className="final-cta-in">
          <h2>Put your files somewhere calm</h2>
          <p>Set up takes about a minute. Your first 20 GB are free.</p>
          <div className="hero-actions center">
            <Link to="/register" className="btn btn-light btn-lg">
              Get started free <ArrowRight size={17} />
            </Link>
            <Link to="/login" className="btn btn-quiet-light btn-lg">
              I already have an account
            </Link>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
