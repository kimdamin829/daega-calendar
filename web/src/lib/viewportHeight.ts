/** Android WebView 등에서 dvh가 깨질 때 실제 화면 높이를 고정 */
import { useEffect, useState } from "react";

export function installViewportHeight(): () => void {
  const update = () => {
    const height = window.visualViewport?.height ?? window.innerHeight;
    document.documentElement.style.setProperty("--app-height", `${height}px`);
  };

  update();
  window.visualViewport?.addEventListener("resize", update);
  window.addEventListener("resize", update);

  return () => {
    window.visualViewport?.removeEventListener("resize", update);
    window.removeEventListener("resize", update);
  };
}

export interface VisualViewportLayout {
  bottomInset: number;
  height: number;
}

function readVisualViewportLayout(): VisualViewportLayout {
  const viewport = window.visualViewport;
  const height = viewport?.height ?? window.innerHeight;
  const bottomInset = viewport
    ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
    : 0;

  return { bottomInset, height };
}

/** 키보드가 열릴 때 하단 고정 UI를 가려지지 않게 조정 */
export function useVisualViewportLayout(active: boolean): VisualViewportLayout {
  const [layout, setLayout] = useState<VisualViewportLayout>(readVisualViewportLayout);

  useEffect(() => {
    if (!active) {
      setLayout(readVisualViewportLayout());
      return;
    }

    const update = () => setLayout(readVisualViewportLayout());

    update();
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [active]);

  return layout;
}
