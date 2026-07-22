import { auth } from "@/lib/auth";
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
import { IconCheck, IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import { setRoleAction } from "@/lib/register-actions";
import { PasskeyRegisterButton } from "@/components/passkey-auth";

export default async function RegisterCompletePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const role = cookieStore.get("signup_role")?.value === "poster" ? "poster" : "buyer";
  cookieStore.delete("signup_role");

  await setRoleAction(role);

  return (
    <div className="grid min-h-[calc(100vh-4rem)] place-items-center px-6 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-lg bg-primary text-primary-foreground">
            <IconCheck className="size-7" />
          </span>
          <CardTitle className="mt-4 text-2xl font-sans font-bold">
            You are all set
          </CardTitle>
          <CardDescription>
            You signed up as a{" "}
            <span className="font-semibold text-foreground">{role}</span>. You
            can add the other role any time from your account menu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-center">
            <p className="text-xs text-muted-foreground mb-2">
              Optional: add a passkey for password-free login
            </p>
            <PasskeyRegisterButton />
          </div>

          <Button asChild className="w-full gap-2" size="lg">
            <Link href={role === "poster" ? "/poster" : "/buyer"}>
              Go to your dashboard
              <IconArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
