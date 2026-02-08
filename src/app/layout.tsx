import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CeloPayAgent — AI-Powered Payment Agent",
  description: "Autonomous payment splitting, scheduling, and group expense management on Celo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}
