import Link from "next/link";
import { auth, signIn, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RedditMark } from "@/components/reddit-mark";
import { formatUsd } from "@/lib/money";

export async function SiteHeader({ user }: { user: any }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid size-7 place-items-center rounded-lg bg-orange-500 text-white">
              <RedditMark className="size-5" />
            </span>
            <span>Spreddit</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              / Depop for Reddit
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/feed" className="text-muted-foreground hover:text-foreground">
              Browse feed
            </Link>
            <Link href="/#how" className="text-muted-foreground hover:text-foreground">
              How it works
            </Link>
            <Link href="/#pricing" className="text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="/docs" className="text-muted-foreground hover:text-foreground">
              Docs
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Avatar className="size-6">
                      <AvatarImage src={user.image ?? ""} />
                      <AvatarFallback>
                        {user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">
                      {user.role === "poster" ? "Poster" : "Buyer"}
                    </span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-xs font-normal text-muted-foreground">
                    Signed in as
                  </div>
                  <div className="truncate">{user.email}</div>
                  <div className="text-xs font-normal text-muted-foreground mt-1">
                    Balance: {formatUsd(user.balanceCents ?? 0, { withCents: true })}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href={user.role === "poster" ? "/poster" : "/buyer"} />}>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/feed" />}>
                  Browse feed
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/settings" />}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-md"
                  >
                    Sign out
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <form
                action={async () => {
                  "use server";
                  await signIn("reddit", { redirectTo: "/poster" });
                }}
              >
                <Button variant="ghost" size="sm">
                  Earn as poster
                </Button>
              </form>
              <Button size="sm" render={<Link href="/login" />}>
                Sign in
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
