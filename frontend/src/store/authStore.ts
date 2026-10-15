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
  const roleStr = (raw.systemRole || raw.role || 'member').toLowerCase();
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: 'member',
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: (user, token) => {
    if (token) setAuthToken(token);
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
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setRole: (role) => {
    set((state) => ({
      role,
      user: state.user ? { ...state.user, role } : null,
    }));
  },

  updateUser: (data) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    }));
  },

  bootstrap: async () => {
    try {
      // Attempt to refresh token using httpOnly cookie
      const refreshRes = await authService.refreshToken();
      if (refreshRes?.data?.accessToken) {
        setAuthToken(refreshRes.data.accessToken);
        const meRes = await userService.getMe();
        if (meRes?.data) {
          const mappedUser = mapUserResponseToUser(meRes.data);
          set({
            user: mappedUser,
            role: mappedUser.role,
            accessToken: refreshRes.data.accessToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }
    } catch {
      // Not authenticated or refresh expired
    }
    setAuthToken(null);
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));

// Listen for unauthorized events to trigger logout
if (typeof window !== 'undefined') {
  window.addEventListener('epms:auth-unauthorized', () => {
    useAuthStore.getState().logout();
  });
}

