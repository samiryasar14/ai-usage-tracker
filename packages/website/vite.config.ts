import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/soar-ai-tracker/" : "/",
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
  },
}));
