/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_TEST_USER_EMAIL: string
  readonly VITE_TEST_USER_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 