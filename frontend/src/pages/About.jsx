import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { useReveal } from "../components/hooks.js";

function Reveal({ as: Tag = "div", className = "", children, ...rest }) {
  const ref = useReveal();
  return (
    <Tag ref={ref} className={`reveal ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}

export default function About() {
  return (
    <div className="marketing">
      <Navbar />
      <section className="about-hero">
        <Reveal>
          <p className="kicker">About Lumen Vault</p>
          <h1>
            Storage should be
            <br />
            quietly capable.
          </h1>
        </Reveal>
        <Reveal className="about-lede">
          <p>
            Files are the raw material of good work — contracts, photos, drafts, plans. They deserve a home that is
            fast to search, calm to look at, and private without asking. That is the whole idea behind Lumen Vault.
          </p>
        </Reveal>
      </section>

      <section className="about-principles">
        {[
          {
            n: "01",
            title: "Speed is a feature",
            body: "Every screen is built to answer one question fast: where is that file? Search, recents and folders are one tap away, always.",
          },
          {
            n: "02",
            title: "Calm over clutter",
            body: "No dashboards full of charts. No badges yelling for attention. The interface should disappear and let your work be the loudest thing on screen.",
          },
          {
            n: "03",
            title: "Privacy is the default",
            body: "Your library is private until you deliberately share something. Links are revocable, permissions are visible, and your files stay yours.",
          },
          {
            n: "04",
            title: "Same product everywhere",
            body: "The phone app and the desktop app are the same product, not two experiences. What you organize on one is waiting for you on the other.",
          },
        ].map((item, index) => (
          <Reveal className="about-principle" key={item.n} style={{ transitionDelay: `${index * 70}ms` }}>
            <span className="about-n">{item.n}</span>
            <div>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <section className="about-cta">
        <Reveal>
          <h2>Make your files feel at home</h2>
          <p>Free for personal use. Upgrade when your library grows.</p>
          <Link className="btn btn-light btn-lg" to="/register">
            Create free account <ArrowRight size={17} />
          </Link>
        </Reveal>
      </section>
      <Footer />
    </div>
  );
}
