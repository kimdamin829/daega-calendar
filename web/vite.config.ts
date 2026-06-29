import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isBranch = env.VITE_STORE_ID === "branch";

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        devOptions: { enabled: false },
        includeAssets: ["favicon.svg"],
        manifest: {
          name: isBranch ? "한우대가 예약 요약 (2호점)" : "한우대가 예약 요약",
          short_name: isBranch ? "예약 요약 2호" : "예약 요약",
          description: "오늘 예약 팀·인원 요약",
          theme_color: "#2a1c14",
          background_color: "#f8f4ee",
          display: "standalone",
          start_url: "/today",
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
  };
});
