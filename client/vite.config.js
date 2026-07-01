import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiProxyTarget =
  process.env.VITE_API_PROXY || process.env.VITE_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5050";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5175,
    strictPort: true,
    proxy: {
      "/api": apiProxyTarget,
      "/uploads": apiProxyTarget
    }
  }
});
