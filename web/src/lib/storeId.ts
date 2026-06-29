/** 1호점 — env 없으면 main (기존 URL·배포와 동일) */
export const DEFAULT_STORE_ID = "main";

/** 2호점 — VITE_STORE_ID=branch 배포용 */
export const BRANCH_STORE_ID = "branch";

const STORE_ID = import.meta.env.VITE_STORE_ID?.trim() || DEFAULT_STORE_ID;

export function getStoreId(): string {
  return STORE_ID;
}

export function isBranchStore(): boolean {
  return STORE_ID === BRANCH_STORE_ID;
}

/** 2호점 연분홍 테마 — html.store-branch (CSS 변수는 index.css) */
export function installStoreTheme(): void {
  if (isBranchStore()) {
    document.documentElement.classList.add("store-branch");
  }
}
