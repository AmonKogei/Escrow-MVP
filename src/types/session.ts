export type UserRole = 'admin' | 'buyer' | 'seller';

export interface SessionUser {
  id: string;
  name?: string;
  email: string;
  role: UserRole;
}

export interface Session {
  user: SessionUser | null;
  token?: string;
}
