import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import EmailProvider from "next-auth/providers/nodemailer";
import Reddit from "next-auth/providers/reddit";
import { db } from "@/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/db/schema";
import { randomUUID } from "node:crypto";

declare module "next-auth" {
  interface User {
    role?: "buyer" | "poster" | "admin";
    balanceCents?: number;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: "buyer" | "poster" | "admin";
      balanceCents: number;
    };
  }
}

const providers: any[] = [];

if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_FROM) {
  providers.push(
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASS,
        },
      },
      from: process.env.EMAIL_FROM,
    })
  );
}

if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) {
  providers.push(
    Reddit({
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET,
      authorization: {
        params: {
          duration: "permanent",
          scope: "identity",
        },
      },
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? "buyer";
        token.balanceCents = (user as any).balanceCents ?? 0;
      }
      if (token.id && (trigger === "signIn" || trigger === "update" || !token.role)) {
        const { eq } = await import("drizzle-orm");
        const u = await db.query.users.findFirst({
          where: eq(users.id, token.id as string),
        });
        if (u) {
          token.role = u.role;
          token.balanceCents = u.balanceCents;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as any) ?? "buyer";
        session.user.balanceCents = (token.balanceCents as number) ?? 0;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "reddit" && profile) {
        const { eq } = await import("drizzle-orm");
        const redditId = (profile as any).id ?? (profile as any).sub;
        const redditUsername = (profile as any).name ?? (profile as any).preferred_username;
        if (!redditId || !redditUsername) return true;
        const existing = await db.query.redditAccounts.findFirst({
          where: eq(redditAccounts.redditId, redditId),
        });
        if (!existing) {
          const u = await db.query.users.findFirst({
            where: eq(users.email, user.email!),
          });
          if (u) {
            await db.insert(redditAccounts).values({
              id: randomUUID(),
              userId: u.id,
              redditId,
              redditUsername,
              karma: 0,
              accountAgeDays: 0,
              optedSubs: [],
              status: "pending",
            });
            await db
              .update(users)
              .set({ role: "poster" })
              .where(eq(users.id, u.id));
          }
        }
      }
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

import { redditAccounts } from "@/db/schema";
