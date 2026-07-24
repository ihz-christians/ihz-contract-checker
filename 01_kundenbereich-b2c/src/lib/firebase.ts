import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const invalidTokens = new Set([
  '',
  'mock-api-key',
  'your_api_key_here',
  'your_project_id',
  'your_project.firebaseapp.com',
  '1:123456789:web:abcdef123456',
  undefined,
  null
]);

function isFirebaseConfigUsable() {
  const required = [
    firebaseConfig.apiKey,
    firebaseConfig.authDomain,
    firebaseConfig.projectId,
    firebaseConfig.appId,
  ];
  return required.every((value) => !invalidTokens.has(value));
}

function createDisabledAuth(reason: string) {
  console.error(`🔥 Firebase unavailable: ${reason}`);
  
  const mockUser = import.meta.env.DEV ? {
    uid: 'mock-user-123',
    email: 'test@example.com',
    displayName: 'Local Dev User',
    getIdToken: async () => 'mock-token',
  } : null;

  return {
    __disabledAuth: true,
    __disabledReason: reason,
    currentUser: mockUser,
    onAuthStateChanged: (callback: any) => {
      // In development mode without Firebase, simulate a logged-in user so the app can be viewed
      setTimeout(() => callback(mockUser), 0);
      return () => {};
    },
    signInWithEmailAndPassword: () => Promise.reject(new Error(reason)),
    signOut: () => Promise.resolve(),
    createUserWithEmailAndPassword: () => Promise.reject(new Error(reason)),
    signInWithPopup: () => Promise.reject(new Error(reason)),
  } as any;
}

let app;
let auth;

try {
  if (!isFirebaseConfigUsable()) {
    app = {
      name: 'disabled-app',
      options: firebaseConfig,
      automaticDataCollectionEnabled: false
    } as any;
    auth = createDisabledAuth(
      'Firebase configuration missing or invalid. Please set VITE_FIREBASE_* environment variables.'
    );
  } else {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('🔥 Firebase initialized correctly');
  }
} catch (error) {
  console.error('🔥 Firebase initialization failed:', error);
  app = {
    name: 'fallback-app',
    options: firebaseConfig,
    automaticDataCollectionEnabled: false
  } as any;
  auth = createDisabledAuth('Firebase initialization failed due to an exception.');
}

export { auth };
export default app;
