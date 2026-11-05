import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    watch: {
      // **/data/** holds the 1.1 GB IMDb TSVs, **/public/posters/** holds
      // 841 MB of images.
      ignored: ["**/data/**", "**/public/posters/**"],
    },
  },
});
