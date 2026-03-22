import { Inter } from "next/font/google";
import AppSidebar from "@/components/AppSidebar";
import AppTopBar from "@/components/AppTopBar";
import MobileBottomNav from "@/components/MobileBottomNav";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} font-sans flex h-screen overflow-hidden bg-white`}>

      {/* ── Left sidebar — desktop only ────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-60 shrink-0 border-r"
        style={{ background: "#ffffff", borderColor: "#e2e8f0" }}
      >
        <AppSidebar />
      </aside>

      {/* ── Right column ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <AppTopBar />

        {/* Scrollable content */}
        <main
          className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-6 pb-24 lg:pb-8"
          style={{ background: "#f8fafc" }}
        >
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav ──────────────────────────────────────────── */}
      <MobileBottomNav />
    </div>
  );
}
