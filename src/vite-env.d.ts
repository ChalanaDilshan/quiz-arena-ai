/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** WebSocket API Gateway URL for live mode */
  readonly VITE_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
