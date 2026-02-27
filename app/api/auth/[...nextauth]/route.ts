// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

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

        // Retorna os campos mínimos exigidos (NextAuth irá serializar)
        return {
          id: user.id,
          email: user.email,
          name: (user as any).nome ?? undefined,
        } as any;
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
        (token as any).id = (user as any).id ?? (token as any).id;
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail && (user as any).email) {
          (token as any).isAdmin =
            String((user as any).email).toLowerCase() ===
            adminEmail.toLowerCase();
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).id;
        (session.user as any).isAdmin = (token as any).isAdmin ?? false;
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

