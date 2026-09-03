import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  ),
  title: "Sparky English | Learn with ease",
  description: "Private, practical English lessons with Sparky.",
  applicationName: "Sparky English",
  appleWebApp: { capable: true, title: "Sparky English", statusBarStyle: "default" },
  openGraph: {
    title: "Sparky English",
    description: "Pequenas lições. Progresso que fica.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Sparky English" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
