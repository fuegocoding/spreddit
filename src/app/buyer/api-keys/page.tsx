import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, schema } from "@/db";
import { eq, desc } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconArrowLeft, IconKey, IconTrash, IconCopy, IconCheck } from "@tabler/icons-react";
import Link from "next/link";
import { createApiKeyAction, deleteApiKeyAction } from "./actions";
import { ApiKeyForm } from "./form";

export default async function ApiKeysPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const keys = await db
    .select()
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.userId, session.user.id))
    .orderBy(desc(schema.apiKeys.createdAt));

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-16 py-16">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link href="/buyer">
          <IconArrowLeft className="size-4" />
          Back
        </Link>
      </Button>
      <h1 className="font-sans text-4xl font-extrabold tracking-tight">API keys</h1>
      <p className="mt-2 text-muted-foreground">
        Use these keys to drive Spreddit from your AI agent via the MCP server or REST API.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="font-sans">Create a new key</CardTitle>
          <CardDescription>Run <code className="text-xs">npx spreddit-mcp add --agent claude-code</code> to install.</CardDescription>
        </CardHeader>
        <CardContent>
          <ApiKeyForm action={createApiKeyAction} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-sans">Your keys</CardTitle>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No keys yet.</div>
          ) : (
            <div className="space-y-2">
              {keys.map((k) => (
                <div key={k.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <IconKey className="size-4 text-muted-foreground" />
                      <span className="font-medium">{k.name}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground font-mono">
                      spk_live_{k.key.slice(8, 16)}… · created {new Date(k.createdAt).toLocaleDateString()}
                      {k.lastUsedAt && ` · last used ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  <form action={deleteApiKeyAction}>
                    <input type="hidden" name="id" value={k.id} />
                    <Button variant="ghost" size="icon-sm" type="submit">
                      <IconTrash className="size-4" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}