import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Global styles
const style = document.createElement("style");
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0; padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #F7FAFA;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  input, textarea, button { font-family: inherit; }
  input:focus, textarea:focus { border-color: #0D7377 !important; }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ─── Register Service Worker ────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("[PrevenApp] SW registrado:", reg.scope);
        // Auto-update check every 30 min
        setInterval(() => reg.update(), 30 * 60 * 1000);
      })
      .catch((err) => console.warn("[PrevenApp] SW error:", err));
  });
}