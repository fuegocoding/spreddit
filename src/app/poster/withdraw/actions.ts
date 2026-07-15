"use server";

import { db, schema } from "@/db";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { newId } from "@/lib/ids";
import { sendWithdrawalNotice } from "@/lib/email";
import { z } from "zod";
import { assertStripe } from "@/lib/stripe";

const withdrawSchema = z.object({
  amountCents: z.coerce.number().min(100).max(1000000),
  method: z.enum(["stripe"]).default("stripe"),
});

export async function requestWithdrawAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = withdrawSchema.parse({
    amountCents: formData.get("amountCents"),
    method: formData.get("method") ?? "stripe",
  });

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1);
  if (!user) throw new Error("User not found.");
  if ((user.balanceCents ?? 0) < parsed.amountCents)
    throw new Error("Insufficient balance.");
  if (parsed.amountCents < 100)
    throw new Error("Minimum withdrawal is $1.00.");

  // Deduct from balance
  await db
    .update(schema.users)
    .set({ balanceCents: (user.balanceCents ?? 0) - parsed.amountCents })
    .where(eq(schema.users.id, user.id));

  // Create payout record
  const payoutId = newId();
  await db.insert(schema.payouts).values({
    id: payoutId,
    userId: user.id,
    amountCents: parsed.amountCents,
    method: parsed.method,
    status: "queued",
  });

  // Try to process the payout via Stripe Connect
  try {
    const stripe = assertStripe();
    if (user.stripeAccountId) {
      const transfer = await stripe.transfers.create({
        amount: parsed.amountCents,
        currency: "usd",
        destination: user.stripeAccountId,
      });
      await db
        .update(schema.payouts)
        .set({
          status: "paid",
          stripeTransferId: transfer.id,
          paidAt: new Date(),
        })
        .where(eq(schema.payouts.id, payoutId));
    }
  } catch {
    // If Stripe transfer fails, leave as "queued" for manual processing
  }

  await sendWithdrawalNotice(user.email, parsed.amountCents);

  revalidatePath("/poster/withdraw");
  revalidatePath("/poster");
  redirect("/poster/withdraw?done=1");
}
