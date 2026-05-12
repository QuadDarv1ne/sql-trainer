import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    phone?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    phone?: string | null;
  }
}
