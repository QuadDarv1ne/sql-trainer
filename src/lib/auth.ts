/**
 * NextAuth.js v5 configuration — Credentials provider with email/password.
 * Sessions use JWT (stateless, stored in encrypted cookie).
 *
 * Split into two parts:
 * - This file: NextAuth config (Edge-compatible, used by middleware)
 * - auth-internal.ts: Full config with DB access (used by API routes)
 */
import NextAuth, { type DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

interface AuthSession {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
}

// Minimal config for Edge runtime (middleware)
const nextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      // In Edge runtime, authorize returns null — real auth happens in API route
      async authorize() {
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }: { token: JWT; user?: AuthUser; trigger?: string; session?: AuthSession }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.phone = user.phone;
      }
      if (trigger === 'update' && session) {
        token.name = session.name ?? token.name;
        token.phone = session.phone ?? token.phone;
      }
      return token;
    },
    async session({ session, token }: { session: DefaultSession; token: JWT }) {
      if (token) {
        (session as AuthSession).user.id = token.id;
        (session as AuthSession).user.name = token.name as string;
        (session as AuthSession).user.email = token.email as string;
        (session as AuthSession).user.phone = token.phone as string | null;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...nextAuthConfig,
  secret: process.env.AUTH_SECRET,
});
