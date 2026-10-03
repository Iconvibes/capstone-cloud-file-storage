import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import TopBar from "../components/TopBar.jsx";
import FileList from "../components/FileList.jsx";
import { EmptyState, FileSkeletonRows } from "../components/ui.jsx";
import FileActions from "../components/FileActions.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";

export default function Starred() {
  const navigate = useNavigate();
  const { loading, error, retry, files, folders, toggleStar } = useLibrary();
  const [actionsFile, setActionsFile] = useState(null);

  // Starred is a personal quick-access pin: files you marked with the star.
  const starredFiles = files.filter((file) => file.starred);
  const folderNames = Object.fromEntries(folders.map((f) => [f._id, f.name]));

  if (error) {
    return (
      <main className="app-page">
        <TopBar title="" />
        <div className="page-pad">
          <div className="error-panel">
            <h2>Couldn't load starred items</h2>
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
      <TopBar title="" />
      <div className="page-pad">
        <header className="page-head">
          <h1>Starred</h1>
          <p>Files you keep close.</p>
        </header>
        {loading ? (
          <FileSkeletonRows rows={5} />
        ) : starredFiles.length === 0 ? (
          <EmptyState
            icon={<Star size={22} />}
            title="No starred items yet"
            body="Tap the star on any file to pin it here for quick access."
            action={
              <button type="button" className="btn btn-dark btn-sm" onClick={() => navigate("/app/files")}>
                Browse My Files
              </button>
            }
          />
        ) : (
          <FileList
            folders={[]}
            files={starredFiles}
            folderNames={folderNames}
            onOpenFile={(file) => setActionsFile(file)}
            onToggleFileStar={(id) => toggleStar(id)}
          />
        )}
      </div>
      <FileActions file={actionsFile} onClose={() => setActionsFile(null)} />
    </main>
  );
}
