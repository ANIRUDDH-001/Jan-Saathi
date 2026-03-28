/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.email = profile.email;
        token.name = profile.name;
        token.picture = profile.picture;
        token.isAdmin = profile.email === process.env.ADMIN_EMAIL;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).isAdmin = token.isAdmin;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
});
