import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "IELTS & CELPIP Speaking Practice",
  description: "AI-powered speaking exam simulator for IELTS and CELPIP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen antialiased">
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
