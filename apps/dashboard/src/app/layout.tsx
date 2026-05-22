import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Activity, LayoutDashboard, Settings, Network } from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${outfit.variable} antialiased bg-background text-foreground flex h-screen overflow-hidden`}>
        
        {/* Sidebar */}
        <aside className="w-64 glass border-r border-card-border flex flex-col z-10 h-full">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-blue-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Network className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold font-[Outfit] tracking-tight text-white">Freeloader</h1>
            </div>
          </div>
          
          <nav className="flex-1 px-4 space-y-1 mt-4">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 text-white font-medium hover:bg-white/10 transition-colors">
              <LayoutDashboard className="w-4 h-4 text-brand-500" />
              Overview
            </Link>
            <Link href="/providers" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 font-medium hover:text-white hover:bg-white/5 transition-colors">
              <Activity className="w-4 h-4" />
              Providers
            </Link>
            <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 font-medium hover:text-white hover:bg-white/5 transition-colors">
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </nav>
          
          <div className="p-4 border-t border-card-border/50">
            <div className="px-3 py-2 rounded-lg bg-card-border/30 text-xs text-zinc-500 font-medium flex items-center justify-between">
              <span>Status</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                Healthy
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-background to-background relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none"></div>
          {children}
        </main>
        
      </body>
    </html>
  );
}
