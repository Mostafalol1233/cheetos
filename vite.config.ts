import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    fs: {
      strict: false,
      deny: ["**/.*"],
    },
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
      "/uploads": { target: "http://localhost:3001", changeOrigin: true },
      "/media": { target: "http://localhost:3001", changeOrigin: true },
      "/images": { target: "http://localhost:3001", changeOrigin: true },
      "/attached_assets": { target: "http://localhost:3001", changeOrigin: true }
    }
  },
});
