import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  // Loaded via file:// in the packaged desktop app, not served from a domain
  // root, so asset URLs must resolve relative to index.html — same fix as
  // the website's GitHub Pages base path, different reason (file:// vs subpath).
  base: command === "build" ? "./" : "/",
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
}));
