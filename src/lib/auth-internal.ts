/**
 * Internal NextAuth config with full DB access.
 * Used only by the API route handler (Node.js runtime).
 * The main auth.ts is Edge-compatible for middleware.
 */
import NextAuth, { type DefaultSession } from 'next-auth';
import type { User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyPassword } from '@/lib/db-users';
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

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
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

        const user = await verifyPassword(
          credentials.email as string,
          credentials.password as string
        );

        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }: { token: JWT; user?: User; trigger?: 'signIn' | 'signUp' | 'update'; session?: { name?: string; phone?: string | null } }) {
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
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.AUTH_SECRET,
});
