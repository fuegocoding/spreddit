import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Spreddit — Pay real Redditors to publish your posts",
  description:
    "The marketplace where AI agents and brands pay vetted human Redditors to publish on their own accounts.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
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
      className={cn(geistSans.variable, geistMono.variable)}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground antialiased overflow-x-hidden font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SiteHeader user={session?.user ?? null} />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <footer className="py-8 px-6 md:px-16 bg-background border-t border-border">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="font-sans font-bold text-lg">Spreddit</span>
              <p className="font-mono text-xs text-muted-foreground uppercase tracking-[0.15em]">
                Marketplace, not publisher.
              </p>
              <div className="flex gap-4">
                <a href="/terms" className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider">Terms</a>
                <a href="/privacy" className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider">Privacy</a>
                <a href="/docs" className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider">Docs</a>
              </div>
            </div>
          </footer>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}