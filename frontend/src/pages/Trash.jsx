import { useState } from "react";
import { Trash2 } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import { Button, EmptyState, FileSkeletonRows, IconButton } from "../components/ui.jsx";
import { FileIcon } from "../components/FileIcon.jsx";
import { formatBytes, formatDate } from "../components/hooks.js";
import { useLibrary } from "../context/LibraryContext.jsx";
import { Modal } from "../components/ui.jsx";

export default function Trash() {
  const { loading, error, retry, trash, restoreFiles, deleteForever, emptyTrash } = useLibrary();
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [pending, setPending] = useState(null); // id awaiting delete confirmation

  if (error) {
    return (
      <main className="app-page">
        <TopBar title="" />
        <div className="page-pad">
          <div className="error-panel">
            <h2>Couldn't load trash</h2>
            <p>{error}</p>
            <button type="button" className="btn btn-dark" onClick={retry}>
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <TopBar
        title="Trash"
        right={
          trash.length ? (
            <button type="button" className="btn btn-soft btn-sm" onClick={() => setConfirmEmpty(true)}>
              Empty trash
            </button>
          ) : null
        }
      />
      <div className="page-pad">
        <header className="page-head">
          <h1>Trash</h1>
          <p>Items stay here for 30 days before they are removed for good.</p>
        </header>

        {loading ? (
          <FileSkeletonRows rows={4} />
        ) : trash.length === 0 ? (
          <EmptyState
            icon={<Trash2 size={22} />}
            title="Trash is empty"
            body="Deleted files rest here for 30 days, in case you change your mind."
          />
        ) : (
          <div className="lib-list">
            {trash.map((item) => (
              <div className="file-row" key={item.id}>
                <div className="file-row-main">
                  <FileIcon kind={item.kind} name={item.name} thumb={item.thumb} />
                  <span className="file-row-name">
                    <b>{item.name}</b>
                    <small>
                      {formatBytes(item.size)} · Deleted {formatDate(item.deletedAt)} · from {item.restoreTo}
                    </small>
                  </span>
                </div>
                <div className="file-row-side">
                  <button type="button" className="btn btn-soft btn-sm" onClick={() => restoreFiles([item.id])}>
                    Restore
                  </button>
                  <IconButton label={`Delete ${item.name} forever`} onClick={() => setPending(item.id)}>
                    <Trash2 size={16} />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={confirmEmpty} onClose={() => setConfirmEmpty(false)} title="Empty trash?">
        <p className="confirm-text">
          All {trash.length} {trash.length === 1 ? "item" : "items"} will be deleted permanently. This can't be undone.
        </p>
        <div className="modal-actions">
          <Button variant="ghost" onClick={() => setConfirmEmpty(false)}>
            Keep them
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              emptyTrash();
              setConfirmEmpty(false);
            }}
          >
            Delete everything
          </Button>
        </div>
      </Modal>

      <Modal open={Boolean(pending)} onClose={() => setPending(null)} title="Delete forever?">
        <p className="confirm-text">
          “{trash.find((item) => item.id === pending)?.name}” will be deleted permanently. This can't be undone.
        </p>
        <div className="modal-actions">
          <Button variant="ghost" onClick={() => setPending(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              deleteForever([pending]);
              setPending(null);
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </main>
  );
}
