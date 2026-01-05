import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import console filter to hide API calls in production
import "./lib/console-filter";

createRoot(document.getElementById("root")!).render(<App />);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
