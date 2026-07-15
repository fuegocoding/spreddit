"use server";

import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function setRoleAction(role: "buyer" | "poster") {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  await db
    .update(schema.users)
    .set({ role })
    .where(eq(schema.users.id, session.user.id));

  revalidatePath("/");
}
