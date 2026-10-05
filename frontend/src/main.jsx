import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { applyStoredTheme } from "./theme.js";

// index.html already set the attribute; this is the fallback for clients that
// render without it (and keeps storage/system in sync on boot).
applyStoredTheme();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
