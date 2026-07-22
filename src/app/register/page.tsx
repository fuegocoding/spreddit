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
import { IconMail, IconUser, IconUsers } from "@tabler/icons-react";
import Link from "next/link";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    if (session.user.isPoster) redirect("/poster");
    if (session.user.isBuyer) redirect("/buyer");
    redirect("/buyer");
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] place-items-center px-6 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-lg bg-primary text-primary-foreground">
            <IconUsers className="size-7" />
          </span>
          <CardTitle className="mt-4 text-2xl font-sans font-bold">
            Create your account
          </CardTitle>
          <CardDescription>
            Sign up with your email. You can be both a buyer and a poster; pick
            whichever role to start with and you can add the other later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData: FormData) => {
              "use server";
              const email = formData.get("email") as string;
              const role = formData.get("role") as string;
              const cookieStore = await cookies();
              cookieStore.set("signup_role", role, {
                path: "/",
                maxAge: 60 * 10,
                httpOnly: true,
                sameSite: "lax",
              });
              await signIn("email", {
                email,
                redirectTo: "/register/complete",
              });
            }}
            className="space-y-6"
          >
            <fieldset className="space-y-3">
              <Label>I want to start as a...</Label>
              <div className="grid grid-cols-2 gap-3">
                <Label
                  htmlFor="role-buyer"
                  className="flex flex-col items-center gap-2 rounded-lg border border-input p-4 text-center cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors"
                >
                  <input
                    type="radio"
                    name="role"
                    id="role-buyer"
                    value="buyer"
                    defaultChecked
                    className="sr-only"
                  />
                  <IconUser className="size-6 text-primary" />
                  <div>
                    <div className="font-sans font-bold text-sm">Buyer</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Pay Redditors to post
                    </div>
                  </div>
                </Label>
                <Label
                  htmlFor="role-poster"
                  className="flex flex-col items-center gap-2 rounded-lg border border-input p-4 text-center cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors"
                >
                  <input
                    type="radio"
                    name="role"
                    id="role-poster"
                    value="poster"
                    className="sr-only"
                  />
                  <IconUsers className="size-6 text-primary" />
                  <div>
                    <div className="font-sans font-bold text-sm">Poster</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Earn posting on Reddit
                    </div>
                  </div>
                </Label>
              </div>
            </fieldset>

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
              Already have an account?{" "}
              <Link href="/login" className="text-primary underline underline-offset-2">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
