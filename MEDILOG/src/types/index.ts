export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'student' | 'admin';
  isVerified: boolean;
  firstLoginCompleted: boolean;
  rememberMe: boolean;
}

export interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}