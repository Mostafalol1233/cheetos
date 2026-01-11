// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "client", "src"),
      "@shared": path.resolve(__vite_injected_original_dirname, "shared"),
      "@assets": path.resolve(__vite_injected_original_dirname, "attached_assets")
    }
  },
  root: path.resolve(__vite_injected_original_dirname, "client"),
  build: {
    outDir: path.resolve(__vite_injected_original_dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: "0.0.0.0",
    port: 5e3,
    strictPort: true,
    allowedHosts: true,
    fs: {
      strict: false,
      deny: ["**/.*"]
    },
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
      "/uploads": { target: "http://localhost:3001", changeOrigin: true },
      "/media": { target: "http://localhost:3001", changeOrigin: true },
      "/images": { target: "http://localhost:3001", changeOrigin: true },
      "/attached_assets": { target: "http://localhost:3001", changeOrigin: true }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcblxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKGltcG9ydC5tZXRhLmRpcm5hbWUsIFwiY2xpZW50XCIsIFwic3JjXCIpLFxuICAgICAgXCJAc2hhcmVkXCI6IHBhdGgucmVzb2x2ZShpbXBvcnQubWV0YS5kaXJuYW1lLCBcInNoYXJlZFwiKSxcbiAgICAgIFwiQGFzc2V0c1wiOiBwYXRoLnJlc29sdmUoaW1wb3J0Lm1ldGEuZGlybmFtZSwgXCJhdHRhY2hlZF9hc3NldHNcIiksXG4gICAgfSxcbiAgfSxcbiAgcm9vdDogcGF0aC5yZXNvbHZlKGltcG9ydC5tZXRhLmRpcm5hbWUsIFwiY2xpZW50XCIpLFxuICBidWlsZDoge1xuICAgIG91dERpcjogcGF0aC5yZXNvbHZlKGltcG9ydC5tZXRhLmRpcm5hbWUsIFwiZGlzdC9wdWJsaWNcIiksXG4gICAgZW1wdHlPdXREaXI6IHRydWUsXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiMC4wLjAuMFwiLFxuICAgIHBvcnQ6IDUwMDAsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICBhbGxvd2VkSG9zdHM6IHRydWUsXG4gICAgZnM6IHtcbiAgICAgIHN0cmljdDogZmFsc2UsXG4gICAgICBkZW55OiBbXCIqKi8uKlwiXSxcbiAgICB9LFxuICAgIHByb3h5OiB7XG4gICAgICBcIi9hcGlcIjogeyB0YXJnZXQ6IFwiaHR0cDovL2xvY2FsaG9zdDozMDAxXCIsIGNoYW5nZU9yaWdpbjogdHJ1ZSB9LFxuICAgICAgXCIvdXBsb2Fkc1wiOiB7IHRhcmdldDogXCJodHRwOi8vbG9jYWxob3N0OjMwMDFcIiwgY2hhbmdlT3JpZ2luOiB0cnVlIH0sXG4gICAgICBcIi9tZWRpYVwiOiB7IHRhcmdldDogXCJodHRwOi8vbG9jYWxob3N0OjMwMDFcIiwgY2hhbmdlT3JpZ2luOiB0cnVlIH0sXG4gICAgICBcIi9pbWFnZXNcIjogeyB0YXJnZXQ6IFwiaHR0cDovL2xvY2FsaG9zdDozMDAxXCIsIGNoYW5nZU9yaWdpbjogdHJ1ZSB9LFxuICAgICAgXCIvYXR0YWNoZWRfYXNzZXRzXCI6IHsgdGFyZ2V0OiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMVwiLCBjaGFuZ2VPcmlnaW46IHRydWUgfVxuICAgIH1cbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBRmpCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxFQUVSO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBcUIsVUFBVSxLQUFLO0FBQUEsTUFDdEQsV0FBVyxLQUFLLFFBQVEsa0NBQXFCLFFBQVE7QUFBQSxNQUNyRCxXQUFXLEtBQUssUUFBUSxrQ0FBcUIsaUJBQWlCO0FBQUEsSUFDaEU7QUFBQSxFQUNGO0FBQUEsRUFDQSxNQUFNLEtBQUssUUFBUSxrQ0FBcUIsUUFBUTtBQUFBLEVBQ2hELE9BQU87QUFBQSxJQUNMLFFBQVEsS0FBSyxRQUFRLGtDQUFxQixhQUFhO0FBQUEsSUFDdkQsYUFBYTtBQUFBLEVBQ2Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLGNBQWM7QUFBQSxJQUNkLElBQUk7QUFBQSxNQUNGLFFBQVE7QUFBQSxNQUNSLE1BQU0sQ0FBQyxPQUFPO0FBQUEsSUFDaEI7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLFFBQVEsRUFBRSxRQUFRLHlCQUF5QixjQUFjLEtBQUs7QUFBQSxNQUM5RCxZQUFZLEVBQUUsUUFBUSx5QkFBeUIsY0FBYyxLQUFLO0FBQUEsTUFDbEUsVUFBVSxFQUFFLFFBQVEseUJBQXlCLGNBQWMsS0FBSztBQUFBLE1BQ2hFLFdBQVcsRUFBRSxRQUFRLHlCQUF5QixjQUFjLEtBQUs7QUFBQSxNQUNqRSxvQkFBb0IsRUFBRSxRQUFRLHlCQUF5QixjQUFjLEtBQUs7QUFBQSxJQUM1RTtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
