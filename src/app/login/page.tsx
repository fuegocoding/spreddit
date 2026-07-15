import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
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
import { IconMail, IconKey, IconCheck } from "@tabler/icons-react";
import { PasskeyLoginButton } from "@/components/passkey-auth";

export default async function LoginPage(props: {
  searchParams: Promise<{ callbackUrl?: string; check?: string }>;
}) {
  const session = await auth();
  const params = await props.searchParams;
  const callbackUrl = params.callbackUrl ?? "/";
  const checkEmail = params.check === "y";

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
              We sent a magic link. Click it to sign in. It expires in 10 minutes.
            </CardDescription>
          </CardHeader>
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}