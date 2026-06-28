/** localhost·https가 아니면 crypto.randomUUID가 iOS Safari 등에서 실패할 수 있음 */
function fallbackUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function newId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // http://192.168.x.x 등 비보안 컨텍스트에서는 randomUUID 불가
  }
  return fallbackUuid();
}
