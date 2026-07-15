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
import { Mail } from "lucide-react";
import { RedditMark } from "@/components/reddit-mark";
import Link from "next/link";

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
    <div className="container grid min-h-[calc(100vh-10rem)] place-items-center py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-orange-500 text-white">
            <RedditMark className="size-6" />
          </span>
          <CardTitle className="mt-4 text-2xl">Sign in to Spreddit</CardTitle>
          <CardDescription>
            One account. Both sides of the marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form
            action={async () => {
              "use server";
              await signIn("reddit", { redirectTo: callbackUrl });
            }}
          >
            <Button type="submit" variant="outline" className="w-full" size="lg">
              <RedditMark className="size-4" />
              Continue with Reddit
            </Button>
          </form>
          <form
            action={async (formData) => {
              "use server";
              const email = formData.get("email") as string;
              await signIn("nodemailer", {
                email,
                redirectTo: callbackUrl,
              });
            }}
            className="flex flex-col gap-2"
          >
            <div className="flex gap-2">
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Button type="submit" size="default">
                <Mail className="size-4" />
                Email
              </Button>
            </div>
          </form>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            New here?{" "}
            <Link href="/" className="text-foreground hover:underline">
              Learn what Spreddit is
            </Link>
            .
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
