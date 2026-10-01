/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_MINIO_PUBLIC_URL: string;
  readonly VITE_PUBLIC_SCAN_BASE_URL: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
