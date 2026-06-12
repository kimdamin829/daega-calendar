import { createRoot } from "react-dom/client";
import App from "@/App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { installViewportHeight } from "@/lib/viewportHeight";
import "@/index.css";

installViewportHeight();

// 이전 PWA 빌드의 Service Worker가 dev 서버와 충돌하는 것을 방지
if (import.meta.env.DEV && "serviceWorker" in navigator) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => void registration.unregister());
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
