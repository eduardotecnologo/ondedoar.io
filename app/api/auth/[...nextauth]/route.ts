// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { isAdminEmail } from "@/lib/admin";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).trim().toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;

        const isPasswordValid = await bcrypt.compare(
          String(credentials.password),
          user.password,
        );

        if (!isPasswordValid) return null;

        const isAdmin = isAdminEmail(user.email);

        // Retorna os campos mínimos exigidos (NextAuth irá serializar)
        return {
          id: user.id,
          email: user.email,
          name: user.nome ?? undefined,
          isAdmin,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      // user existe apenas no primeiro login/authorize
      if (user) {
        token.id = user.id ?? token.id;
        token.isAdmin =
          typeof user.isAdmin === "boolean"
            ? user.isAdmin
            : Boolean(token.isAdmin);
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },

  // Garante que a secret seja usada (defina NEXTAUTH_SECRET no .env)
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

// App Router exige exports nomeados por método HTTP (GET, POST)
export { handler as GET, handler as POST };
