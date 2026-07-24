import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, AuthState, UserRole } from '@/types/auth';
import { auth } from '@/lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { apiCall } from '@/lib/api';

interface AuthContextType {
  state: AuthState;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

type AuthAction =
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'INIT_FINISH' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGOUT':
      return {
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: null,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'INIT_FINISH':
      return {
        ...state,
        isLoading: false,
        error: null,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Listen to the shared Firebase authentication state
    // The actual login happens on the central landing page SSO
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Sync the shared session with the FastAPI backend
          const backendUser = await apiCall<any>({
            method: 'POST',
            url: '/auth/sync-user',
          });

          // Set the user in the frontend state
          const userRole: UserRole = 'customer'; // Default role, could be mapped from backend
          const user: User = {
            id: backendUser.id || firebaseUser.uid,
            email: backendUser.email || firebaseUser.email || '',
            name:
              backendUser.first_name && backendUser.last_name
                ? `${backendUser.first_name} ${backendUser.last_name}`
                : firebaseUser.displayName || 'User',
            role: userRole,
          };

          dispatch({ type: 'SET_USER', payload: user });
        } catch (error) {
          console.error('Failed to sync backend user:', error);
          if (import.meta.env.DEV) {
            // Fallback for local development if backend is not running
            console.warn('Backend unavailable, using local mock user.');
            const user: User = {
              id: firebaseUser.uid || 'mock-id',
              email: firebaseUser.email || 'test@example.com',
              name: firebaseUser.displayName || 'Local Dev User',
              role: 'customer',
            };
            dispatch({ type: 'SET_USER', payload: user });
          } else {
            dispatch({ type: 'LOGOUT' });
          }
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }

      dispatch({ type: 'INIT_FINISH' });
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      dispatch({ type: 'LOGOUT' });

      // Redirect back to the public landing page after logout
      const landingPageUrl =
        import.meta.env.VITE_LANDINGPAGE_URL || 'https://ihrezuhauseberatung.de';
      window.location.href = landingPageUrl;
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const setUser = (user: User) => {
    dispatch({ type: 'SET_USER', payload: user });
  };

  return <AuthContext.Provider value={{ state, logout, setUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
