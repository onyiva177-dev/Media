import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "STREAM — Personal Media",
    template: "%s | STREAM",
  },
  description: "A personal media space. Videos, images, and thoughts.",
  openGraph: {
    type: "website",
    siteName: "STREAM",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="grain min-h-screen antialiased">
        {/* Top nav */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-md bg-ink/80">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <a
              href="/"
              className="font-display font-800 text-xl tracking-tight text-canvas hover:text-amber-glow transition-colors"
              style={{ fontFamily: "Syne, sans-serif", fontWeight: 800 }}
            >
              STR<span className="text-amber-400">EA</span>M
            </a>
            <span className="text-xs text-white/30 font-body">
              Personal Media
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}
