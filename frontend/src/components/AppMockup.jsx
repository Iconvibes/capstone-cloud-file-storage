import { Clock, Folder, Search, Share2, Star, Upload, Wifi, BatteryFull, Signal } from "lucide-react";

// A phone-frame mock of the product's home screen, used as landing artwork.
// Pure CSS/DOM so it stays crisp at any size.
export default function AppMockup({ compact = false }) {
  const files = [
    { name: "Project Proposal.pdf", meta: "PDF · 2.4 MB", tone: "red" },
    { name: "Team Offsite.png", meta: "PNG · 3.2 MB", tone: "violet", thumb: "https://picsum.photos/seed/lv-offsite/96/96" },
    { name: "Financial Report.xlsx", meta: "XLS · 1.5 MB", tone: "green" },
    { name: "Product Demo.mp4", meta: "MP4 · 65 MB", tone: "rose" },
  ];

  return (
    <div className={`phone ${compact ? "phone-compact" : ""}`.trim()}>
      <div className="phone-screen">
        <div className="phone-status">
          <span>9:41</span>
          <span className="phone-status-ic">
            <Signal size={12} /> <Wifi size={12} /> <BatteryFull size={13} />
          </span>
        </div>
        <div className="phone-head">
          <div>
            <small>Good morning, Ada</small>
            <b>Your files are ready</b>
          </div>
          <span className="avatar avatar-sm tone-0">AN</span>
        </div>
        <div className="phone-search">
          <Search size={14} />
          <span>Search files</span>
        </div>
        <div className="phone-storage">
          <div className="phone-storage-row">
            <span>Storage</span>
            <b>38.4 GB of 100 GB</b>
          </div>
          <span className="bar">
            <i style={{ width: "38%" }} />
          </span>
        </div>
        <div className="phone-row-title">
          <span>Recent</span>
          <span className="phone-see-all">See all</span>
        </div>
        <div className="phone-files">
          {files.map((file) => (
            <div className="phone-file" key={file.name}>
              {file.thumb ? (
                <img src={file.thumb} alt="" loading="lazy" />
              ) : (
                <span className={`file-ic tone-${file.tone} sm`}>
                  <b>{file.meta.split(" ")[0]}</b>
                </span>
              )}
              <span className="phone-file-meta">
                <b>{file.name}</b>
                <small>{file.meta}</small>
              </span>
            </div>
          ))}
        </div>
        <div className="phone-folders">
          {["Documents", "Photos", "Client Work"].map((name) => (
            <div className="phone-folder" key={name}>
              <Folder size={13} aria-hidden="true" />
              {name}
            </div>
          ))}
        </div>
        <div className="phone-nav">
          {[
            { Icon: Clock, label: "Home", active: true },
            { Icon: Folder, label: "Files" },
            { Icon: Share2, label: "Shared" },
            { Icon: Star, label: "Starred" },
          ].map(({ Icon, label, active }) => (
            <span className={active ? "is-active" : ""} key={label}>
              <Icon size={17} />
              {label}
            </span>
          ))}
        </div>
        <span className="phone-fab" aria-hidden="true">
          <Upload size={17} />
        </span>
      </div>
    </div>
  );
}
