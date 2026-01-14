export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  authProvider: 'github' | 'google' | 'email';
  createdAt: Date;
  lastLoginAt: Date;
}