import { useState } from "react";
import {
  File as FileGlyph,
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Presentation,
} from "lucide-react";
import { extensionOf } from "./hooks.js";

const KINDS = {
  pdf: { Icon: FileText, tone: "red" },
  doc: { Icon: FileText, tone: "blue" },
  sheet: { Icon: FileSpreadsheet, tone: "green" },
  slides: { Icon: Presentation, tone: "orange" },
  image: { Icon: FileImage, tone: "violet" },
  video: { Icon: FileVideo, tone: "rose" },
  audio: { Icon: FileAudio, tone: "teal" },
  archive: { Icon: FileArchive, tone: "gray" },
  default: { Icon: FileGlyph, tone: "gray" },
};

const EXT_LABEL = {
  PNG: "PNG", JPG: "JPG", JPEG: "JPG", GIF: "GIF", WEBP: "WEBP",
  MP4: "MP4", MOV: "MOV", WEBM: "WEBM",
  MP3: "MP3", M4A: "M4A", WAV: "WAV", FLAC: "FLAC",
  ZIP: "ZIP", RAR: "RAR", "7Z": "7Z",
  XLSX: "XLS", XLS: "XLS", CSV: "CSV",
  DOCX: "DOC", DOC: "DOC", RTF: "RTF", TXT: "TXT",
  PPTX: "PPT", PPT: "PPT", PDF: "PDF",
};

const KIND_WORD = {
  pdf: "PDF document",
  doc: "Document",
  sheet: "Spreadsheet",
  slides: "Presentation",
  image: "Image",
  video: "Video",
  audio: "Audio",
  archive: "Archive",
};

export function FileIcon({ kind = "default", name = "", size = "md", thumb = null }) {
  const [broken, setBroken] = useState(false);
  const meta = KINDS[kind] ?? KINDS.default;

  if (thumb && !broken) {
    return (
      <span className={`file-ic file-ic-thumb ${size}`.trim()}>
        <img src={thumb} alt="" loading="lazy" onError={() => setBroken(true)} />
      </span>
    )
    ;
  }

  const { Icon } = meta;
  const ext = EXT_LABEL[extensionOf(name)] ?? "FILE";
  return (
    <span className={`file-ic tone-${meta.tone} ${size}`.trim()}>
      <Icon size={size === "lg" ? 22 : 17} aria-hidden="true" />
      <b>{ext}</b>
      <i className="sr-only">{KIND_WORD[kind] ?? "File"}</i>
    </span>
  );
}

