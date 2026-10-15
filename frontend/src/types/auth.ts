export type Role = 'member' | 'pm' | 'admin' | 'developer' | 'qa' | 'viewer';
export type MemberStatus = 'Active' | 'Pending';

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: Role;
  status: MemberStatus;
  avatarUrl?: string;
  isGoogleAccount?: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}
