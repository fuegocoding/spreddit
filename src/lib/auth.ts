import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Email from "next-auth/providers/email";
import { db, schema } from "@/db";
import { sendVerificationEmail } from "./email";
import { env } from "./env";

const { users, accounts, sessions, verificationTokens } = schema;

declare module "next-auth" {
  interface User {
    role?: "buyer" | "poster" | "admin" | "banned";
    isBuyer?: boolean;
    isPoster?: boolean;
    isAdmin?: boolean;
    balanceCents?: number;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: "buyer" | "poster" | "admin" | "banned";
      isBuyer: boolean;
      isPoster: boolean;
      isAdmin: boolean;
      balanceCents: number;
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db as any, {
    usersTable: users as any,
    accountsTable: accounts as any,
    sessionsTable: sessions as any,
    verificationTokensTable: verificationTokens as any,
  }),
  providers: [
    Email({
      server: env.EMAIL_SERVER_HOST
        ? {
            host: env.EMAIL_SERVER_HOST,
            port: env.EMAIL_SERVER_PORT ?? 587,
            auth: {
              user: env.EMAIL_SERVER_USER ?? "",
              pass: env.EMAIL_SERVER_PASS ?? "",
            },
          }
        : { host: "localhost", port: 587, auth: { user: "", pass: "" } },
      from: env.EMAIL_FROM ?? "noreply@spreddit.fuego.im",
      sendVerificationRequest: async ({ identifier: email, url }) => {
        const sent = await sendVerificationEmail(email, url);
        if (!sent) {
          const { cookies } = await import("next/headers");
          (await cookies()).set("magic_link_url", url, {
            path: "/",
            maxAge: 60 * 10,
            httpOnly: false,
            sameSite: "lax",
          });
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? "buyer";
        token.isBuyer = (user as any).isBuyer ?? true;
        token.isPoster = (user as any).isPoster ?? false;
        token.isAdmin = (user as any).isAdmin ?? false;
        token.balanceCents = (user as any).balanceCents ?? 0;
      }
      if (
        token.id &&
        (trigger === "signIn" || trigger === "update" || !token.role)
      ) {
        const { eq } = await import("drizzle-orm");
        const u = await db.query.users.findFirst({
          where: eq(users.id, token.id as string),
        });
        if (u) {
          token.role = (u as any).role;
          token.isBuyer = (u as any).isBuyer ?? true;
          token.isPoster = (u as any).isPoster ?? false;
          token.isAdmin = (u as any).isAdmin ?? false;
          token.balanceCents = (u as any).balanceCents ?? 0;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as any) ?? "buyer";
        session.user.isBuyer = (token.isBuyer as boolean) ?? true;
        session.user.isPoster = (token.isPoster as boolean) ?? false;
        session.user.isAdmin = (token.isAdmin as boolean) ?? false;
        session.user.balanceCents = (token.balanceCents as number) ?? 0;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
});
