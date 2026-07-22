import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
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
import {
  IconLogout,
  IconLayoutGrid,
  IconSettings,
  IconCoin,
  IconPlus,
} from "@tabler/icons-react";
import { formatUsd } from "@/lib/money";

export async function SiteHeader({ user }: { user: any }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/60 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-6 md:px-16">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 font-sans font-bold text-lg tracking-tight text-foreground">
            <img src="/logo.svg" alt="Spreddit" className="size-9" />
            <span>Spreddit</span>
          </Link>
          <nav className="hidden md:flex gap-6 items-center">
            <Link href="/feed" className="text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">
              Browse
            </Link>
            <Link href="/#how" className="text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">
              How it works
            </Link>
            <Link href="/#pricing" className="text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/docs" className="text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">
              Docs
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="size-7">
                    <AvatarImage src={user.image ?? ""} />
                    <AvatarFallback className="text-xs">
                      {user.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-mono">
                    {formatUsd(user.balanceCents ?? 0, { withCents: false })}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-mono text-xs text-muted-foreground">Signed in as</div>
                  <div className="truncate font-sans text-sm">{user.email}</div>
                  <div className="font-mono text-xs text-muted-foreground mt-1">
                    Balance: {formatUsd(user.balanceCents ?? 0, { withCents: true })}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.isBuyer && (
                  <DropdownMenuItem asChild>
                    <Link href="/buyer" className="flex items-center gap-2 cursor-pointer">
                      <IconCoin className="size-4" />
                      Buyer dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                {user.isPoster && (
                  <DropdownMenuItem asChild>
                    <Link href="/poster" className="flex items-center gap-2 cursor-pointer">
                      <IconLayoutGrid className="size-4" />
                      Poster dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                {!user.isBuyer && (
                  <DropdownMenuItem asChild>
                    <Link href="/register" className="flex items-center gap-2 cursor-pointer">
                      <IconPlus className="size-4" />
                      Become a buyer
                    </Link>
                  </DropdownMenuItem>
                )}
                {!user.isPoster && (
                  <DropdownMenuItem asChild>
                    <Link href="/poster/connect" className="flex items-center gap-2 cursor-pointer">
                      <IconPlus className="size-4" />
                      Become a poster
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/feed" className="flex items-center gap-2 cursor-pointer">
                    <IconLayoutGrid className="size-4" />
                    Browse feed
                  </Link>
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
                    className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded-md cursor-pointer"
                  >
                    <IconLogout className="size-4" />
                    Sign out
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/feed">Browse feed</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/register">Sign up</Link>
              </Button>
              <Button asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
