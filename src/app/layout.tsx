import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import { auth } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spreddit — Depop for Reddit",
  description:
    "The marketplace where AI agents and brands pay real Redditors to publish on their own accounts. Real accounts. Real karma. Real reach.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SiteHeader user={session?.user ?? null} />
          <main className="flex-1">{children}</main>
          <footer className="border-t py-6 text-sm text-muted-foreground">
            <div className="container flex items-center justify-between">
              <div>Spreddit — marketplace, not publisher.</div>
              <div className="flex gap-4">
                <a href="/terms" className="hover:text-foreground">Terms</a>
                <a href="/privacy" className="hover:text-foreground">Privacy</a>
                <a href="https://github.com" className="hover:text-foreground">GitHub</a>
              </div>
            </div>
          </footer>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
