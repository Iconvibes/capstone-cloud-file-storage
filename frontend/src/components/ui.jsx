// Small shared building blocks: buttons, inputs, avatars, modals, sheets,
// empty states and skeletons. Kept together so screens stay readable.
import { useState } from "react";
import { Eye, EyeOff, LoaderCircle, X } from "lucide-react";
import { useBodyLock } from "./hooks.js";

export function Button({ variant = "primary", size = "md", className = "", loading = false, children, ...rest }) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${loading ? "is-loading" : ""} ${className}`.trim()}
      disabled={rest.disabled || loading}
      {...rest}
    >
      {loading ? <LoaderCircle className="spin" size={16} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function IconButton({ label, className = "", children, ...rest }) {
  return (
    <button type="button" aria-label={label} title={label} className={`icon-btn ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}

export function Field({ label, hint, error, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && !error ? <span className="field-hint">{hint}</span> : null}
      {error ? <span className="field-error" role="alert">{error}</span> : null}
    </label>
  );
}

export function PasswordField({ label = "Password", value, onChange, placeholder = "••••••••", error, hint, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} error={error} hint={hint}>
      <div className={`input-wrap ${error ? "has-error" : ""}`.trim()}>
        <input
          type={visible ? "text" : "password"}
          className="input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          minLength={6}
        />
        <button type="button" className="peek" onClick={() => setVisible((v) => !v)} aria-label={visible ? "Hide password" : "Show password"}>
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </Field>
  );
}

export function Avatar({ name = "", initials, size = "md", tone = 0, className = "" }) {
  const letters =
    initials ??
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  return (
    <span className={`avatar avatar-${size} tone-${tone % 4} ${className}`.trim()} aria-hidden="true">
      {letters}
    </span>
  );
}

export function Modal({ open, onClose, title, children, width = 440 }) {
  useBodyLock(open);
  if (!open) return null;
  return (
    <div className="overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }}>
        <header className="modal-head">
          <h2>{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// Mobile-first action/action-list sheet that becomes a centered dialog on desktop.
export function BottomSheet({ open, onClose, title, children }) {
  useBodyLock(open);
  if (!open) return null;
  return (
    <div className="overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <span className="sheet-grip" aria-hidden="true" />
        <header className="sheet-head">
          <h2>{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, body, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h3>{title}</h3>
      {body ? <p>{body}</p> : null}
      {action}
    </div>
  );
}

export function Skeleton({ variant = "text", className = "", style }) {
  return <span className={`skeleton skeleton-${variant} ${className}`.trim()} style={style} aria-hidden="true" />;
}

export function FileSkeletonRows({ rows = 6 }) {
  return (
    <div className="skeleton-list" role="status" aria-label="Loading files">
      {Array.from({ length: rows }, (_, index) => (
        <div className="skeleton-row" key={index}>
          <Skeleton variant="tile" />
          <div className="skeleton-lines">
            <Skeleton variant="text" style={{ width: "58%" }} />
            <Skeleton variant="text" className="short" style={{ width: "34%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Toasts({ items, onDismiss }) {
  if (!items.length) return null;
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {items.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.tone}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export function Brand({ dark = false }) {
  return (
    <span className={`brand ${dark ? "brand-dark" : ""}`.trim()}>
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="17" height="17" fill="none" aria-hidden="true">
          <path d="M8 24.5 15.9 7l8 17.5h-4.6l-3.4-8-3.3 8Z" fill="currentColor" />
        </svg>
      </span>
      <span className="brand-word">
        Lumen<em>Vault</em>
      </span>
    </span>
  );
}
