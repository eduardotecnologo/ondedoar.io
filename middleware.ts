import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/cadastrar/:path*", "/admin/:path*"], // NÃO inclui /api/auth
};
