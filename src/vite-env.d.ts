/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Firebase configuration variables
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string

  // Other environment variables
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_TEST_USER_EMAIL: string
  readonly VITE_TEST_USER_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 
