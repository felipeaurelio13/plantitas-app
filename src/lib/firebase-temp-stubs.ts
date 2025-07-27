// Temporary Firebase stubs to make the build work
// These will be replaced with actual Firebase implementations

export const firebaseStubs = {
  collection: (db: any, path: string) => ({
    doc: (id?: string) => ({
      id: id || 'mock-id',
      get: async () => ({
        exists: () => false,
        data: () => ({})
      }),
      set: async (data: any) => {},
      update: async (data: any) => {},
      delete: async () => {},
      collection: (subPath: string) => firebaseStubs.collection(db, subPath)
    }),
    where: (field: string, op: string, value: any) => ({
      get: async () => ({ docs: [] }),
      limit: (n: number) => ({
        get: async () => ({ docs: [] })
      })
    }),
    orderBy: (field: string, direction?: string) => ({
      get: async () => ({ docs: [] }),
      limit: (n: number) => ({
        get: async () => ({ docs: [] })
      })
    }),
    get: async () => ({ docs: [] }),
    add: async (data: any) => ({ id: 'mock-id' })
  }),
  
  batch: (db: any) => ({
    set: (ref: any, data: any) => {},
    update: (ref: any, data: any) => {},
    delete: (ref: any) => {},
    commit: async () => {}
  }),

  storage: {
    ref: (path: string) => ({
      putString: async (data: string, format?: string) => ({
        ref: {
          getDownloadURL: async () => 'https://mock-url.com/image.jpg'
        }
      }),
      delete: async () => {}
    })
  },

  FieldValueStubs: {
    delete: () => null,
    serverTimestamp: () => new Date()
  }
};

// Mock Firebase for development
export const mockFirebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};