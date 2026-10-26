import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { company } from "@/lib/company";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PANOVA TARIM DOO Struga",
  description: `Panova — Bangladeş, Türkiye ve Kuzey Makedonya. ${company.shortName}, ${company.address}. İletişim: ${company.email}`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
