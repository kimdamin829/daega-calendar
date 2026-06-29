/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** 2호점만 branch — 1호점(기본)은 설정 안 함 */
  readonly VITE_STORE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
