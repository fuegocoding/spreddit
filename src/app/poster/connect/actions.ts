"use server";

import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { newId } from "@/lib/ids";
import { z } from "zod";

const connectSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[A-Za-z0-9_-]+$/),
});

export async function connectRedditAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = connectSchema.parse({
    username: formData.get("username"),
  });

  const username = parsed.username;

  // Check not already connected
  const existing = await db
    .select()
    .from(schema.redditAccounts)
    .where(eq(schema.redditAccounts.redditUsername, username))
    .limit(1);
  if (existing.length > 0) {
    throw new Error(
      `u/${username} is already connected to another account.`
    );
  }

  const id = newId();
  const verificationCode = newId().slice(0, 12);

  await db.insert(schema.redditAccounts).values({
    id,
    userId: session.user.id,
    redditUsername: username,
    redditId: username,
    karma: 0,
    accountAgeDays: 0,
    optedSubs: [],
    status: "pending",
    verificationCode,
  });

  revalidatePath("/poster/connect");
  redirect(`/poster/connect?verify=${id}`);
}

const verifySchema = z.object({
  accountId: z.string(),
  postUrl: z.string().url(),
});

export async function submitVerificationAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = verifySchema.parse({
    accountId: formData.get("accountId"),
    postUrl: formData.get("postUrl"),
  });

  const [account] = await db
    .select()
    .from(schema.redditAccounts)
    .where(
      and(
        eq(schema.redditAccounts.id, parsed.accountId),
        eq(schema.redditAccounts.userId, session.user.id)
      )
    )
    .limit(1);
  if (!account) throw new Error("Account not found.");
  if (account.status !== "pending")
    throw new Error("Account is already verified.");

  // Fetch the Reddit post
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15000);
  let res: Response;
  try {
    res = await fetch(parsed.postUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SpredditBot/0.1; +https://spreddit.fuego.im)",
      },
    });
  } catch (e: any) {
    clearTimeout(t);
    throw new Error(`Could not fetch post: ${e.message}`);
  }
  clearTimeout(t);

  if (!res.ok) {
    throw new Error(`Reddit returned ${res.status} for that URL.`);
  }

  const html = await res.text();

  // Check post is not removed
  if (
    /removed by moderator/i.test(html) ||
    /\[removed\]/i.test(html) ||
    /this page does not exist/i.test(html)
  ) {
    throw new Error("Post was removed. Please make a new one.");
  }

  // Check username appears in the page (author indicator)
  const authorMatch = html.match(
    new RegExp(escapeRegex(account.redditUsername), "i")
  );
  if (!authorMatch) {
    throw new Error(
      `Could not confirm you are u/${account.redditUsername}. Make sure the post is from this account.`
    );
  }

  // Check verification code
  const codeCheck = html.includes(account.verificationCode ?? account.id);
  if (!codeCheck) {
    throw new Error(
      "Verification code not found in the post. Copy the exact text we gave you."
    );
  }

  // Try to scrape karma and age from the user's profile page
  let karma = 0;
  let accountAgeDays = 0;
  try {
    const profileRes = await fetch(
      `https://www.reddit.com/user/${account.redditUsername}/`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; SpredditBot/0.1; +https://spreddit.fuego.im)",
        },
      }
    );
    if (profileRes.ok) {
      const profileHtml = await profileRes.text();
      // Try to extract karma — Reddit shows it in the sidebar
      const karmaMatch = profileHtml.match(/(\d{1,6}(?:,\d{3})*)\s*(?:karma|post karma|comment karma)/i);
      if (karmaMatch) {
        karma = parseInt(karmaMatch[1].replace(/,/g, ""), 10);
      }
      // Try to extract account age
      const ageMatch = profileHtml.match(/(\d+)\s*(?:yr|year|yr\.|y\.)/i);
      if (ageMatch) {
        accountAgeDays = parseInt(ageMatch[1], 10) * 365;
      }
    }
  } catch {
    // Silently fail — karma stays 0, user can only claim Standard tier
  }

  await db
    .update(schema.redditAccounts)
    .set({
      status: "active",
      karma,
      accountAgeDays,
      verificationCode: null,
      verifiedAt: new Date(),
    })
    .where(eq(schema.redditAccounts.id, account.id));

  // Ensure user is marked as poster
  await db
    .update(schema.users)
    .set({ role: "poster" })
    .where(eq(schema.users.id, session.user.id));

  revalidatePath("/poster");
  redirect("/poster");
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
