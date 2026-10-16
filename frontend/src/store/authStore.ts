import { create } from 'zustand';
import type { User, Role, MemberStatus } from '../types';
import { setAuthToken } from '../api/axiosClient';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

export function mapUserResponseToUser(raw: any): User {
  if (!raw) return raw;
  const name = raw.fullName || raw.name || raw.email || '';
  const initials = name
    ? name
        .split(' ')
        .filter(Boolean)
        .map((w: string) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';
  const roleStr = (raw.role || 'member').toLowerCase();
  const role: Role = roleStr === 'admin' ? 'admin' : roleStr === 'pm' ? 'pm' : 'member';
  const status: MemberStatus =
    raw.status === 'ACTIVE' || raw.status === 'Active' ? 'Active' : 'Pending';

  return {
    id: String(raw.id),
    name,
    email: raw.email,
    initials,
    role,
    status,
    avatarUrl: raw.avatarUrl,
    isGoogleAccount: raw.authProvider === 'GOOGLE' || raw.isGoogleAccount === true,
  };
}

const USER_STORAGE_KEY = 'epms_user';

function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface AuthState {
  user: User | null;
  role: Role;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (user: User, token?: string) => void;
  logout: () => Promise<void>;
  setRole: (role: Role) => void;
  updateUser: (data: Partial<User>) => void;
  bootstrap: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initialToken = typeof window !== 'undefined' ? localStorage.getItem('epms_access_token') : null;
  if (initialToken) {
    setAuthToken(initialToken);
  }
  const initialUser = getStoredUser();

  return {
    user: initialUser,
    role: initialUser?.role || 'member',
    accessToken: initialToken,
    isAuthenticated: !!initialToken && !!initialUser,
    // If no token exists in local storage, user is not logged in -> don't show loading spinner!
    isLoading: !!initialToken,

    login: (user, token) => {
      if (token) {
        setAuthToken(token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('epms_access_token', token);
        }
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      }
      set({
        user,
        role: user.role,
        accessToken: token || null,
        isAuthenticated: true,
        isLoading: false,
      });
    },

    logout: async () => {
      try {
        await authService.logout();
      } catch {
        // ignore logout network errors
      } finally {
        setAuthToken(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('epms_access_token');
          localStorage.removeItem(USER_STORAGE_KEY);
        }
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    },

    setRole: (role) => {
      set((state) => {
        const updatedUser = state.user ? { ...state.user, role } : null;
        if (updatedUser && typeof window !== 'undefined') {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        }
        return {
          role,
          user: updatedUser,
        };
      });
    },

    updateUser: (data) => {
      set((state) => {
        const updatedUser = state.user ? { ...state.user, ...data } : null;
        if (updatedUser && typeof window !== 'undefined') {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        }
        return {
          user: updatedUser,
        };
      });
    },

    bootstrap: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('epms_access_token') : null;

      // If no stored token, no session exists -> immediately ready for login
      if (!token) {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      let isExplicitlyUnauthorized = false;
      try {
        // Allow up to 12s for bootstrap check during Render wake up
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Auth check timeout')), 12000),
        );

        const meRes = (await Promise.race([userService.getMe(), timeoutPromise])) as any;
        if (meRes?.data) {
          const mappedUser = mapUserResponseToUser(meRes.data);
          if (typeof window !== 'undefined') {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser));
          }
          set({
            user: mappedUser,
            role: mappedUser.role,
            accessToken: token,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      } catch (err: any) {
        console.warn('Bootstrap verification failed or timed out:', err);
        if (err?.response?.status === 401 || err?.status === 401) {
          isExplicitlyUnauthorized = true;
        }
      }

      // If token verification timed out or had a transient network error (NOT explicitly 401),
      // keep the authenticated session alive using cached user from localStorage
      if (!isExplicitlyUnauthorized && typeof window !== 'undefined') {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          try {
            const mappedUser = JSON.parse(storedUser);
            if (mappedUser && mappedUser.id) {
              set({
                user: mappedUser,
                role: mappedUser.role || 'member',
                accessToken: token,
                isAuthenticated: true,
                isLoading: false,
              });
              return;
            }
          } catch {
            // ignore parse error
          }
        }
      }

      // Only clear session if explicitly 401 Unauthorized or no cached user is available
      setAuthToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    },
  };
});

// Listen for unauthorized events to trigger logout
if (typeof window !== 'undefined') {
  window.addEventListener('epms:auth-unauthorized', () => {
    useAuthStore.getState().logout();
  });
}

