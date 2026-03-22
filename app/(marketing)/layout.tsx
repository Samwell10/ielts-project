import { Inter } from "next/font/google";
import MarketingNav from "@/components/MarketingNav";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} font-sans`}>
      <MarketingNav />
      <main className="min-h-screen bg-white">
        {children}
      </main>
    </div>
  );
}
