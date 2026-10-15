import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, role, isAuthenticated, isLoading, login, logout, setRole, updateUser } =
    useAuthStore();

  return {
    user,
    role,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setRole,
    updateUser,
  };
}
