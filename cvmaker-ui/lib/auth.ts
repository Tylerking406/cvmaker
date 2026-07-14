import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { store } from "@/lib/mock-store";

export interface AppUser {
  id: string;
  email: string;
  name?: string;
}

declare module "next-auth" {
  interface Session {
    user: AppUser;
  }
  interface User extends AppUser {}
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name?: string;
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase().trim();
        const user = store.users.find(u => u.email === email);
        if (!user) return null;

        const match = await bcrypt.compare(credentials.password, user.passwordHash ?? "");
        if (!match) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email!;
        token.name = user.name ?? undefined;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = { id: token.id, email: token.email, name: token.name };
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-change-in-production",
};
