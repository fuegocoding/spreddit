import { db, schema, sqliteSchema } from "@/db";
const s: typeof sqliteSchema = schema as any;
import { eq, and, sql, lt } from "drizzle-orm";

export type VerificationResult =
  | { ok: true; matched: boolean; titleMatched: boolean; removed: boolean }
  | { ok: false; error: string };

const FETCH_TIMEOUT_MS = 10_000;

export async function verifyClaim(claimId: string): Promise<VerificationResult> {
  const [claim] = await db
    .select()
    .from(s.claims)
    .where(eq(s.claims.id, claimId))
    .limit(1);
  if (!claim) return { ok: false, error: "Claim not found" };
  if (!claim.redditPostUrl)
    return { ok: false, error: "No Reddit post URL on claim" };

  const [post] = await db
    .select()
    .from(s.posts)
    .where(eq(s.posts.id, claim.postId))
    .limit(1);
  if (!post) return { ok: false, error: "Post not found" };

  let html: string;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(claim.redditPostUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SpredditBot/0.1; +https://spreddit.fuego.im)",
      },
    });
    clearTimeout(t);
    if (!res.ok) {
      return {
        ok: false,
        error: `Reddit returned ${res.status} for ${claim.redditPostUrl}`,
      };
    }
    html = await res.text();
  } catch (e: any) {
    return { ok: false, error: `Fetch failed: ${e.message}` };
  }

  // Detect mod removal
  const removed =
    /removed by moderator/i.test(html) ||
    /\[removed\]/i.test(html) ||
    /this page does not exist/i.test(html) ||
    /page not found/i.test(html);

  if (removed) {
    await db
      .update(s.claims)
      .set({ status: "removed", survivalCheckedAt: new Date() })
      .where(eq(s.claims.id, claim.id));
    return { ok: true, matched: false, titleMatched: false, removed: true };
  }

  // Pull <title> and the post body container
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const redditTitle = titleMatch ? decodeHTML(titleMatch[1]) : "";
  const titleMatched = fuzzyContains(redditTitle, post.title);

  // Body is harder. Reddit's HTML escapes and embeds the post body in
  // <div class="...RichTextJSONRoot"> or similar. We do a coarse scan.
  const bodySnippet = stripHtml(html).slice(0, 8000);
  const bodyMatched = fuzzyContains(bodySnippet, post.body);

  if (!titleMatched && !bodyMatched) {
    return { ok: false, error: "Post content does not match submission" };
  }

  await db
    .update(s.claims)
    .set({
      status: "verified",
      verifiedAt: new Date(),
    })
    .where(eq(s.claims.id, claim.id));

  await db
    .update(s.posts)
    .set({ status: "verified" })
    .where(eq(s.posts.id, post.id));

  return {
    ok: true,
    matched: true,
    titleMatched,
    removed: false,
  };
}

export async function runSurvivalCheck(claimId: string): Promise<VerificationResult> {
  const result = await verifyClaim(claimId);
  if (!result.ok) return result;
  if (result.removed) return result;

  const [claim] = await db
    .select()
    .from(s.claims)
    .where(eq(s.claims.id, claimId))
    .limit(1);
  if (!claim) return { ok: false, error: "Claim missing" };

  await db
    .update(s.claims)
    .set({ status: "survived", survivalCheckedAt: new Date() })
    .where(eq(s.claims.id, claim.id));
  await db
    .update(s.posts)
    .set({ status: "paid" })
    .where(eq(s.posts.id, claim.postId));
  await db
    .update(s.users)
    .set({ balanceCents: sql`balance_cents + ${claim.payoutCents}` })
    .where(eq(s.users.id, claim.posterId));

  return result;
}

export async function runPendingSurvivalChecks(): Promise<number> {
  const due = await db
    .select({ id: s.claims.id })
    .from(s.claims)
    .where(
      and(
        eq(s.claims.status, "verified"),
        sql`${s.claims.verifiedAt} IS NOT NULL`,
        lt(sql`${s.claims.verifiedAt}`, sql`datetime('now', '-1 minute')`)
      )
    )
    .limit(100);
  let count = 0;
  for (const c of due) {
    const r = await runSurvivalCheck(c.id);
    if (r.ok) count++;
  }
  return count;
}

export async function runExpiredClaims(): Promise<number> {
  const now = new Date();
  const expired = await db
    .select()
    .from(s.claims)
    .where(
      and(eq(s.claims.status, "active"), lt(s.claims.expiresAt, now))
    );
  for (const c of expired) {
    await db
      .update(s.claims)
      .set({ status: "expired" })
      .where(eq(s.claims.id, c.id));
    const [others] = await db
      .select()
      .from(s.claims)
      .where(
        and(
          eq(s.claims.postId, c.postId),
          eq(s.claims.status, "active")
        )
      )
      .limit(1);
    if (!others) {
      await db
        .update(s.posts)
        .set({ status: "available" })
        .where(eq(s.posts.id, c.postId));
    }
  }
  return expired.length;
}

function fuzzyContains(haystack: string, needle: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[^a-z0-9 ]/g, "")
      .trim();
  const h = norm(haystack);
  const n = norm(needle);
  if (!n) return false;
  if (h.includes(n)) return true;
  if (n.length > 50) {
    const snippet = n.slice(0, 50);
    return h.includes(snippet);
  }
  return false;
}

function decodeHTML(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function stripHtml(s: string): string {
  return decodeHTML(s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
}
