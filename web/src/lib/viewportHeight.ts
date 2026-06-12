/** Android WebView 등에서 dvh가 깨질 때 실제 화면 높이를 고정 */
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
