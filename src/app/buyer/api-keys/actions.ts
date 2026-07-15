"use server";

import { db, schema } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { newId, newApiKey } from "@/lib/ids";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createSchema = z.object({ name: z.string().min(1).max(60) });

export async function createApiKeyAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const { name } = createSchema.parse({ name: formData.get("name") });
  const { id, key } = newApiKey();
  await db.insert(schema.apiKeys).values({
    id,
    userId: session.user.id,
    key,
    name,
  });
  revalidatePath("/buyer/api-keys");
  return { key };
}

export async function deleteApiKeyAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const id = String(formData.get("id"));
  await db
    .delete(schema.apiKeys)
    .where(
      and(
        eq(schema.apiKeys.id, id),
        eq(schema.apiKeys.userId, session.user.id)
      )
    );
  revalidatePath("/buyer/api-keys");
}
