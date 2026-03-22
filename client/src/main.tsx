import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import App from "./App";
import "./index.css";

// Import console filter to hide API calls in production
import "./lib/console-filter";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

const loader = document.getElementById("app-loader");
if (loader) {
  loader.classList.add("app-loader--hide");
  window.setTimeout(() => loader.remove(), 150);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
