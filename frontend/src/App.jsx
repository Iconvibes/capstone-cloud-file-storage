import { Route, Routes, Outlet, useLocation } from "react-router-dom";
import "./styles.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LibraryProvider } from "./context/LibraryContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import BottomNav from "./components/BottomNav.jsx";
import Sidebar from "./components/Sidebar.jsx";
import UploadModal from "./components/UploadModal.jsx";
import { NewFolderModal } from "./components/FolderPanel.jsx";
import { Toasts } from "./components/ui.jsx";
import Landing from "./pages/Landing.jsx";
import About from "./pages/About.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Home from "./pages/Home.jsx";
import Files from "./pages/Files.jsx";
import Starred from "./pages/Starred.jsx";
import Shared from "./pages/Shared.jsx";
import Trash from "./pages/Trash.jsx";
import Profile from "./pages/Profile.jsx";
import FilePreview from "./components/FilePreview.jsx";
import SharedFile from "./pages/SharedFile.jsx";
import NotFound from "./pages/NotFound.jsx";
import { useLibrary } from "./context/LibraryContext.jsx";

// The signed-in workspace: sidebar on desktop, bottom nav on mobile, plus the
// shared upload / new-folder actions and toast stack.
function AppLayout() {
  const { toasts, dismissToast, uploadOpen, setUploadOpen, newFolderOpen, setNewFolderOpen } = useLibrary();
  const location = useLocation();
  const hideChrome = location.pathname.startsWith("/app/preview");

  return (
    <div className="app-shell">
      {!hideChrome ? <Sidebar onNewFolder={() => setNewFolderOpen(true)} /> : null}
      <div className="app-main">
        <Outlet />
        {!hideChrome ? <BottomNav /> : null}
      </div>
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <NewFolderModal open={newFolderOpen} onClose={() => setNewFolderOpen(false)} />
      <Toasts items={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/share/:token" element={<SharedFile />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <LibraryProvider>
              <AppLayout />
            </LibraryProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="files" element={<Files />} />
        <Route path="files/folder/:folderId" element={<Files />} />
        <Route path="starred" element={<Starred />} />
        <Route path="shared" element={<Shared />} />
        <Route path="trash" element={<Trash />} />
        <Route path="profile" element={<Profile />} />
        <Route path="preview/:fileId" element={<FilePreview />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
