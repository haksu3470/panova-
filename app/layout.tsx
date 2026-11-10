import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import RecoveryRedirect from "@/components/auth/RecoveryRedirect";
import { company } from "@/lib/company";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const arabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  display: "swap",
});

const description = `Panova Group — Bangladeş, Türkiye ve Kuzey Makedonya. ${company.address}. İletişim: ${company.email}`;

export const metadata: Metadata = {
  title: {
    default: "Panova Group",
    template: "%s | Panova Group",
  },
  description,
  openGraph: {
    title: "Panova Group",
    description,
    siteName: "Panova Group",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Panova Group",
    description,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} ${arabic.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col">
        <RecoveryRedirect />
        {children}
      </body>
    </html>
  );
}
