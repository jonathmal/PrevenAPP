import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// ─── Global styles + animations ─────────────────────────────
const style = document.createElement("style");
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0; padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #F7FAFA;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overscroll-behavior-y: contain;
  }
  input, textarea, button, select { font-family: inherit; }
  input:focus, textarea:focus {
    border-color: #0D7377 !important;
    box-shadow: 0 0 0 3px rgba(13,115,119,0.1) !important;
  }

  /* ─── Animations ─────────────────────────────────────── */
  @keyframes spin { to { transform: rotate(360deg); } }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-in { animation: fadeIn 0.3s ease-out both; }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
  .scale-in { animation: scaleIn 0.25s ease-out both; }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .slide-up { animation: slideUp 0.35s ease-out both; }

  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(-16px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  .toast { animation: toastIn 0.3s ease-out both; }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .skeleton {
    border-radius: 8px;
    background: linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  /* Card tap effect */
  .card-tap { transition: transform 0.15s, box-shadow 0.15s !important; }
  .card-tap:active {
    transform: scale(0.98) !important;
    box-shadow: 0 0 0 rgba(0,0,0,0) !important;
  }

  @keyframes installSlideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .install-banner { animation: installSlideUp 0.4s ease-out both; animation-delay: 2s; opacity: 0; }

  @keyframes offlineSlideDown {
    from { transform: translateY(-100%); }
    to { transform: translateY(0); }
  }
  .offline-banner { animation: offlineSlideDown 0.3s ease-out both; }

  /* Stagger children */
  .stagger > * { animation: fadeIn 0.3s ease-out both; }
  .stagger > *:nth-child(1) { animation-delay: 0.05s; }
  .stagger > *:nth-child(2) { animation-delay: 0.1s; }
  .stagger > *:nth-child(3) { animation-delay: 0.15s; }
  .stagger > *:nth-child(4) { animation-delay: 0.2s; }
  .stagger > *:nth-child(5) { animation-delay: 0.25s; }
  .stagger > *:nth-child(6) { animation-delay: 0.3s; }
  .stagger > *:nth-child(7) { animation-delay: 0.35s; }
  .stagger > *:nth-child(8) { animation-delay: 0.4s; }

  /* Safe area for iOS */
  .safe-bottom { padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); }
  .nav-safe { padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px)); }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 2px; }
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
        setInterval(() => reg.update(), 30 * 60 * 1000);
      })
      .catch((err) => console.warn("[PrevenApp] SW error:", err));
  });
}
