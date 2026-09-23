import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLibrary } from "../context/LibraryContext.jsx";

// Storage usage card with a segmented usage bar. Demo data until the real
// account API exists.
export default function StorageCard({ compact = false }) {
  const { storage } = useLibrary();
  const navigate = useNavigate();
  if (!storage) return null;

  const pct = Math.min(100, Math.round((storage.usedGb / storage.totalGb) * 100));
  const remaining = Math.max(0, storage.totalGb - storage.usedGb);

  return (
    <section className={`storage-card ${compact ? "storage-card-compact" : ""}`.trim()} aria-label="Storage usage">
      <div className="storage-card-top">
        <div>
          <small>Storage used</small>
          <b>
            {storage.usedLabel} <span>of {storage.totalLabel}</span>
          </b>
        </div>
        <button type="button" className="storage-manage" onClick={() => navigate("/app/profile")}>
          Manage <ChevronRight size={15} aria-hidden="true" />
        </button>
      </div>
      <span className="storage-segbar" role="img" aria-label={`${pct}% of storage used`}>
        {storage.breakdown.map((seg) => (
          <i
            key={seg.key}
            className={`seg-${seg.key}`}
            style={{ flexGrow: seg.gb, background: seg.color }}
          />
        ))}
      </span>
      <div className="storage-legend">
        {storage.breakdown.map((seg) => (
          <span key={seg.key}>
            <i style={{ background: seg.color }} aria-hidden="true" />
            {seg.label} · {seg.gb} GB
          </span>
        ))}
      </div>
      <p className="storage-note">
        {remaining.toFixed(1)} GB available · demo data, not your real usage
      </p>
    </section>
  );
}
