import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
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
import { Separator } from "@/components/ui/separator";
import { IconMail, IconKey, IconCheck, IconLink } from "@tabler/icons-react";
import { PasskeyLoginButton } from "@/components/passkey-auth";
import Link from "next/link";

export default async function LoginPage(props: {
  searchParams: Promise<{ callbackUrl?: string; check?: string }>;
}) {
  const session = await auth();
  const params = await props.searchParams;
  const callbackUrl = params.callbackUrl ?? "/";
  const checkEmail = params.check === "y";
  const cookieStore = checkEmail ? await cookies() : null;
  const magicLinkUrl = cookieStore?.get("magic_link_url")?.value ?? null;

  if (session?.user) {
    redirect(session.user.role === "poster" ? "/poster" : "/buyer");
  }

  if (checkEmail) {
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
                ? "SMTP not configured. Use the link below to sign in:"
                : "We sent a magic link. Click it to sign in. It expires in 10 minutes."}
            </CardDescription>
          </CardHeader>
          {magicLinkUrl && (
            <CardContent className="pb-6">
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

  return (
    <div className="grid min-h-[calc(100vh-4rem)] place-items-center px-6 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-lg bg-primary text-primary-foreground">
            <IconKey className="size-7" />
          </span>
          <CardTitle className="mt-4 text-2xl font-sans font-bold">
            Sign in to Spreddit
          </CardTitle>
          <CardDescription>
            Use your passkey or enter your email for a magic link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PasskeyLoginButton />

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              or
            </span>
          </div>

          <form
            action={async (formData: FormData) => {
              "use server";
              const email = formData.get("email") as string;
              await signIn("email", { email, redirectTo: callbackUrl });
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="mt-2"
              />
            </div>
            <Button type="submit" className="w-full gap-2" size="lg">
              <IconMail className="size-4" />
              Send magic link
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              No account?{" "}
              <Link href="/register" className="text-primary underline underline-offset-2">
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}