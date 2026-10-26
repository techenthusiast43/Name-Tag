import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  define: {
    "process.env": {},
  },
  resolve: {
    alias: {
      "ox/tempo": path.resolve(
        __dirname,
        "node_modules/viem/node_modules/ox/_esm/tempo/index.js"
      ),
    },
  },
});
