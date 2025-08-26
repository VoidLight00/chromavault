export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  palettesCount: number;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  isFollowing?: boolean;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  emailNotifications: boolean;
  publicProfile: boolean;
  showEmail: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}