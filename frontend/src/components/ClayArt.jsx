import { useId } from "react";

// Claymorphism SVG illustrations shared across the workspace: the soft 3D
// folder glyph (color varies per folder) and the hero cloud-upload scene.
// Pure decoration — every interactive element stays a real button/link.

const FOLDER_TONES = {
  blue: ["#7aa9ff", "#3f6fe8"],
  violet: ["#b198ff", "#7351e6"],
  green: ["#5fd99b", "#1f9e63"],
  amber: ["#ffcf6b", "#eb9714"],
  rose: ["#ff8fae", "#e34d78"],
  teal: ["#63ddd0", "#14a396"],
};

const TONE_ORDER = Object.keys(FOLDER_TONES);

// Stable tone per folder so a folder keeps its color across renders.
export function toneFor(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return TONE_ORDER[hash % TONE_ORDER.length];
}

// Soft 3D folder: back slab, lighter lid, front pocket with an inner shade —
// the tactile object from the references, scaled by `size`.
export function ClayFolder({ seed = "", tone, size = 64, className = "" }) {
  const key = tone ?? toneFor(seed);
  const [light, deep] = FOLDER_TONES[key] ?? FOLDER_TONES.blue;
  // Unique per instance: shared ids would resolve to the first definition in
  // the document, which can live inside a hidden (display:none) subtree and
  // leave this folder unpainted.
  const uid = useId().replace(/:/g, "");
  const id = `cf-${key}-${uid}`;
  return (
    <svg
      viewBox="0 0 64 56"
      width={size}
      height={(size * 56) / 64}
      className={`clay-folder ${className}`.trim()}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-lid`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
        <linearGradient id={`${id}-front`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={deep} />
        </linearGradient>
      </defs>
      {/* back slab */}
      <path
        d="M4 14a7 7 0 0 1 7-7h13.4c2 0 3.9.9 5.1 2.5l2.6 3.4H53a7 7 0 0 1 7 7v21a7 7 0 0 1-7 7H11a7 7 0 0 1-7-7V14Z"
        fill={`url(#${id}-lid)`}
      />
      {/* lid highlight */}
      <path
        d="M6 17.5C6.4 12.9 10 10 14.5 10h11.9c1.6 0 3.1.7 4.1 1.9l2.3 2.8c1 1.2 2.5 1.9 4.1 1.9H51a5 5 0 0 1 5 5v1.8H6v-5.9Z"
        fill="rgba(255,255,255,0.38)"
      />
      {/* front pocket */}
      <path
        d="M4 26h56v19a7 7 0 0 1-7 7H11a7 7 0 0 1-7-7V26Z"
        fill={`url(#${id}-front)`}
      />
      {/* pocket inner shade for depth */}
      <path d="M4 26h56v5H4v-5Z" fill="rgba(0,0,0,0.12)" />
      <path
        d="M7 30h50v3.5c0 1.4-1.1 2.5-2.5 2.5h-45A2.5 2.5 0 0 1 7 33.5V30Z"
        fill="rgba(255,255,255,0.22)"
      />
    </svg>
  );
}

// Hero scene: a plump clay cloud with an upload arrow plus floating file
// chips — echoes the reference welcome card without literal copying.
export function HeroCloudArt({ className = "" }) {
  const uid = useId().replace(/:/g, "");
  const id = (name) => `hc-${name}-${uid}`;
  return (
    <svg
      viewBox="0 0 340 240"
      className={`hero-art ${className}`.trim()}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={id("cloud")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8ab4ff" />
          <stop offset="1" stopColor="#3557e0" />
        </linearGradient>
        <linearGradient id={id("arrow")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e7edff" />
        </linearGradient>
        <linearGradient id={id("note")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c7b6ff" />
          <stop offset="1" stopColor="#7f62ec" />
        </linearGradient>
        <linearGradient id={id("img")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8ce0b2" />
          <stop offset="1" stopColor="#28a86c" />
        </linearGradient>
        <linearGradient id={id("zip")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd98a" />
          <stop offset="1" stopColor="#ef9c1b" />
        </linearGradient>
      </defs>

      {/* orbit dashes */}
      <path
        d="M60 128c14-52 66-90 124-86 52 4 96 40 108 88"
        fill="none"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 14"
      />

      {/* floating file chips */}
      <g className="hero-chip-float">
        <rect x="36" y="52" width="58" height="66" rx="14" fill={`url(#${id("note")})`} />
        <rect x="48" y="68" width="34" height="6" rx="3" fill="rgba(255,255,255,0.75)" />
        <rect x="48" y="80" width="26" height="6" rx="3" fill="rgba(255,255,255,0.55)" />
        <rect x="48" y="92" width="30" height="6" rx="3" fill="rgba(255,255,255,0.55)" />
      </g>
      <g className="hero-chip-float hero-chip-delay">
        <rect x="44" y="150" width="62" height="54" rx="14" fill={`url(#${id("img")})`} />
        <circle cx="62" cy="167" r="7" fill="rgba(255,255,255,0.85)" />
        <path d="M52 192l16-16 12 12 10-8 8 12H52Z" fill="rgba(255,255,255,0.8)" />
      </g>
      <g className="hero-chip-float">
        <rect x="258" y="150" width="56" height="52" rx="14" fill={`url(#${id("zip")})`} />
        <rect x="278" y="160" width="8" height="22" rx="3" fill="rgba(255,255,255,0.85)" />
        <rect x="274" y="176" width="16" height="14" rx="4" fill="rgba(255,255,255,0.7)" />
      </g>

      {/* cloud body */}
      <path
        d="M96 196c-24 0-42-18-42-41 0-21 15-38 36-41 5-24 26-41 52-41 21 0 40 12 49 31 5-3 11-4 17-4 21 0 38 16 39 37 19 3 33 18 33 37 0 21-17 38-39 38H96Z"
        fill={`url(#${id("cloud")})`}
      />
      {/* cloud top highlight */}
      <path
        d="M112 82c13-13 31-20 50-19 8 0 16 2 23 5-7 6-11 15-11 24 0 4 1 8 3 11-6 2-11 7-14 13-4-16-18-28-35-29-6 0-12 1-16 4V82Z"
        fill="rgba(255,255,255,0.4)"
      />
      {/* cloud base shade */}
      <path
        d="M96 186h174c4 0 8-1 11-2-6 8-15 13-26 13H96c-8 0-15-2-21-6 6-3 13-5 21-5Z"
        fill="rgba(10,25,90,0.18)"
      />
      {/* upload arrow — tip up, soft-rounded via strokeLinejoin */}
      <path
        d="M182 102l-38 38h24v52h28v-52h24z"
        fill={`url(#${id("arrow")})`}
        stroke={`url(#${id("arrow")})`}
        strokeWidth="8"
        strokeLinejoin="round"
      />
      {/* sparkles */}
      <circle cx="300" cy="64" r="6" fill="#ffd98a" />
      <circle cx="128" cy="34" r="4.5" fill="#ffb0c4" />
      <circle cx="266" cy="96" r="4" fill="rgba(255,255,255,0.9)" />
    </svg>
  );
}

// Small clay cloud used by the storage card / sidebar promo.
export function CloudGlyph({ size = 26, className = "" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M9.5 25C5.9 25 3 22.2 3 18.7c0-3.2 2.3-5.9 5.4-6.5C9.5 8.2 13.1 5.4 17.4 5.4c4.6 0 8.5 3.2 9.5 7.5 2.6.5 4.5 2.8 4.5 5.5 0 3.4-2.8 6.1-6.2 6.1H9.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
