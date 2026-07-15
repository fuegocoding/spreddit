import { cookies } from "next/headers";
import { IconMail, IconCheck, IconLink } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function VerifyRequestPage() {
  const cookieStore = await cookies();
  const magicLinkUrl = cookieStore.get("magic_link_url")?.value ?? null;

  return (
    <div className="grid min-h-[calc(100vh-4rem)] place-items-center px-6 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-lg bg-primary text-primary-foreground">
            <IconCheck className="size-7" />
          </span>
          <CardTitle className="mt-4 text-2xl font-sans font-bold">
            Check your email
          </CardTitle>
          <CardDescription>
            {magicLinkUrl
              ? "No email server configured. Use the link below to sign in:"
              : "We sent a magic link. Click it to sign in. It expires in 10 minutes."}
          </CardDescription>
        </CardHeader>
        {magicLinkUrl && (
          <CardContent className="pb-6 space-y-3">
            <a
              href={magicLinkUrl}
              className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <IconLink className="size-4 shrink-0" />
              <span className="truncate">Click here to sign in</span>
            </a>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
