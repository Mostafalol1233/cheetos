import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
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
    fs: {
      strict: false,
      deny: ["**/.*"],
    },
    proxy: {
      '/': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        bypass: (req) => {
          // Don't proxy API calls and static assets, let Vite serve them
          if (req && req.url && req.url.startsWith('/api')) {
            return null;
          }
          // Images from backend public folder
          if (req && req.url && req.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
            return null;
          }
        }
      }
    }
  },
});
