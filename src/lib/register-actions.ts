"use server";

import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function setRoleAction(role: "buyer" | "poster") {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const updates: Partial<typeof schema.users.$inferInsert> = {
    role: role === "poster" ? "poster" : "buyer",
  };
  if (role === "buyer") {
    updates.isBuyer = true;
  } else {
    updates.isPoster = true;
  }

  await db
    .update(schema.users)
    .set(updates)
    .where(eq(schema.users.id, session.user.id));

  revalidatePath("/");
}
