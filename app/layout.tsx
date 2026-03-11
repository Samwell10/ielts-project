import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PrepAI — IELTS & CELPIP Practice",
  description: "AI-powered speaking and writing exam simulator for IELTS and CELPIP with instant band scoring",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <body className="min-h-screen antialiased">
          <Navbar />
          <main className="mx-auto">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
