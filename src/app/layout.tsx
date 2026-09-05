import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./course.css";
import "./learning.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.NODE_ENV === "production" ? "https://sparky-english-iota.vercel.app" : "http://localhost:3200"),
  ),
  title: "Sparky English",
  description: "Inglês para falantes de português do Brasil. Explicações em PT-BR, exemplos e prática em inglês.",
  applicationName: "Sparky English",
  appleWebApp: { capable: true, title: "Sparky English", statusBarStyle: "default" },
  openGraph: {
    title: "Sparky English",
    description: "Inglês para falantes de português do Brasil.",
    locale: "pt_BR",
    type: "website",
  },
  twitter: { card: "summary" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
