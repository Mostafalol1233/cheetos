import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";


export default defineConfig({
  plugins: [
    react(),
    
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
      "/api": { target: "http://51.75.118.165:20291", changeOrigin: true },
      "/uploads": { target: "http://51.75.118.165:20291", changeOrigin: true },
      "/media": { target: "http://51.75.118.165:20291", changeOrigin: true },
      "/images": { target: "http://51.75.118.165:20291", changeOrigin: true },
      "/attached_assets": { target: "http://51.75.118.165:20291", changeOrigin: true }
    }
  },
});
