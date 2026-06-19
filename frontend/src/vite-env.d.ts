/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_PATH?: string;
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Vite aliases (configured in vite.config.ts). TypeScript needs these declarations
// so it knows the imports resolve to a URL string at build time.
declare module "figma:asset/*" {
  const src: string;
  export default src;
}
declare module "@/assets/*" {
  const src: string;
  export default src;
}
