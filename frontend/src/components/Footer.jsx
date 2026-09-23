import { Link } from "react-router-dom";
import { Brand } from "./ui.jsx";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", to: "/#features" },
      { label: "Security", to: "/#security" },
      { label: "How it works", to: "/#how" },
      { label: "Pricing", to: "/#cta" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Careers", to: "/about" },
      { label: "Press", to: "/about" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help center", to: "/about" },
      { label: "Community", to: "/about" },
      { label: "Status", to: "/about" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", to: "/about" },
      { label: "Terms", to: "/about" },
      { label: "Security", to: "/#security" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="site-foot">
      <div className="site-foot-in">
        <div className="foot-brand">
          <Brand />
          <p>A calm, private home for your files. Store, organize and share your work from any device.</p>
        </div>
        <div className="foot-cols">
          {COLUMNS.map((column) => (
            <div className="foot-col" key={column.title}>
              <h3>{column.title}</h3>
              {column.links.map((link) => (
                <Link key={link.label} to={link.to}>
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="foot-base">
        <span>© {new Date().getFullYear()} Lumen Vault, Inc.</span>
        <span>Made for people who care about their work.</span>
      </div>
    </footer>
  );
}
