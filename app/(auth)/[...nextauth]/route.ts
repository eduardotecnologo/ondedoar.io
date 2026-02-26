import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

const handler = NextAuth({
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

        // Busca o usuário no banco pelo email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // Se não encontrar ou não tiver senha (ex.: login social), falha
        if (!user || !user.password) return null;

        // Compara a senha digitada com o hash no banco
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) return null;

        // Retorna o objeto do usuário para a sessão
        return {
          id: user.id,
          email: user.email,
          name: user.nome, // ajuste se o campo no seu schema for 'nome' ou 'name'
        };
      },
    }),
  ],
  session: {
    strategy: "jwt", // Usamos JWT para sessões rápidas e seguras
  },
  pages: {
    signIn: "/login", // Nossa página customizada de login
    error: "/login", // Redireciona erros para a página de login
  },
  callbacks: {
    // Adiciona o ID do usuário ao token JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // Expõe o ID do usuário na sessão acessível pelo front/back
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
