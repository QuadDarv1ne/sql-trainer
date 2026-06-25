/**
 * Internal NextAuth config with full DB access.
 * Used only by the API route handler (Node.js runtime).
 * The main auth.ts is Edge-compatible for proxy.
 */
import NextAuth, { type DefaultSession } from 'next-auth';
import type { User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyPassword } from '@/lib/db-users';
import type { UserRole } from '@/lib/db-users';
import type { JWT } from 'next-auth/jwt';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  role_changed_at?: number | null;
}

interface SessionUser {
  id?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  role?: UserRole;
}

interface TokenPayload {
  id: string;
  name?: string;
  email?: string;
  phone?: string | null;
  role?: UserRole;
  role_changed_at?: number | null;
}

const nextAuth = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await verifyPassword(credentials.email as string, credentials.password as string);

        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          role_changed_at: user.role_changed_at,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({
      token,
      user,
      trigger,
      session,
    }: {
      token: JWT;
      user?: User;
      trigger?: 'signIn' | 'signUp' | 'update';
      session?: { name?: string; phone?: string | null };
    }) {
      if (user) {
        const authUser = user as AuthUser;
        token.id = authUser.id;
        token.name = authUser.name;
        token.email = authUser.email;
        token.phone = authUser.phone;
        token.role = authUser.role;
        token.role_changed_at = authUser.role_changed_at;
      }
      if (trigger === 'update' && session) {
        token.name = session.name ?? token.name;
        token.phone = session.phone ?? token.phone;
      }
      return token;
    },
    async session({ session, token }: { session: DefaultSession; token: JWT }) {
      if (token) {
        const tokenPayload = token as unknown as TokenPayload;
        const sessionUser = session.user as SessionUser;
        const tokenRoleChangedAt = tokenPayload.role_changed_at;
        const currentRole = tokenPayload.role;

        if (currentRole) {
          const db = (await import('@/lib/db-users')).getDb();
          const dbUser = db
            .prepare('SELECT role, role_changed_at, banned_at FROM users WHERE id = ?')
            .get(tokenPayload.id) as
            | { role: UserRole; role_changed_at: number | null; banned_at: number | null }
            | undefined;

          if (dbUser && dbUser.banned_at) {
            sessionUser.id = '';
            sessionUser.name = '';
            sessionUser.email = '';
            sessionUser.phone = null;
            sessionUser.role = 'student';
            return session;
          }

          if (dbUser && dbUser.role_changed_at && tokenRoleChangedAt && dbUser.role_changed_at > tokenRoleChangedAt) {
            sessionUser.id = '';
            sessionUser.name = '';
            sessionUser.email = '';
            sessionUser.phone = null;
            sessionUser.role = 'student';
            return session;
          }

          sessionUser.id = tokenPayload.id;
          sessionUser.name = tokenPayload.name as string;
          sessionUser.email = tokenPayload.email as string;
          sessionUser.phone = tokenPayload.phone as string | null;
          sessionUser.role = currentRole;
        }
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.AUTH_SECRET,
});

export const { auth, signIn, signOut } = nextAuth;
export const { GET, POST } = nextAuth.handlers;
