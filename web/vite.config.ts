import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "한우대가 예약",
        short_name: "대가예약",
        description: "식당 예약 달력",
        theme_color: "#1a73e8",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        shortcuts: [
          {
            name: "오늘 예약 요약",
            short_name: "오늘",
            url: "/?today",
            icons: [
              {
                src: "favicon.svg",
                sizes: "any",
                type: "image/svg+xml",
              },
            ],
          },
        ],
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
