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
import { IconBrandReddit } from "@tabler/icons-react";

export default async function LoginPage(props: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const params = await props.searchParams;
  const callbackUrl = params.callbackUrl ?? "/";

  if (session?.user) {
    redirect(session.user.role === "poster" ? "/poster" : "/buyer");
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] place-items-center px-6 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-lg bg-primary text-primary-foreground">
            <IconBrandReddit className="size-7" />
          </span>
          <CardTitle className="mt-4 text-2xl font-sans font-bold">
            Sign in to Spreddit
          </CardTitle>
          <CardDescription>
            Sign in with your Reddit account. We read your username, karma, and
            account age to rank you. We never post on your behalf.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server";
              await signIn("reddit", { redirectTo: callbackUrl });
            }}
          >
            <Button type="submit" className="w-full gap-2" size="lg">
              <IconBrandReddit className="size-4" />
              Continue with Reddit
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground leading-relaxed">
            By signing in you agree to our Terms and Privacy Policy. Spreddit is
            a marketplace — we don&apos;t touch Reddit.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}