import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./course.css";
import "./learning.css";
import "./shop.css";
import "./interface.css";
import "./performance.css";
import "./study-remap.css";

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
  icons: {
    icon: [{ url: "/icons/sparky-192-v2.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon-v2.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Sparky English",
    description: "Inglês para falantes de português do Brasil.",
    locale: "pt_BR",
    type: "website",
  },
  twitter: { card: "summary" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f3ed",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var raw=localStorage.getItem('sparky-appearance-v1'),v=raw?JSON.parse(raw):null,old=localStorage.getItem('sparky-color-theme'),palettes=['sparky','beatrice','ocean','sunset','graphite'],modes=['system','light','dark'],p=v&&palettes.indexOf(v.palette)>-1?v.palette:'sparky',m=v&&modes.indexOf(v.mode)>-1?v.mode:(old==='light'||old==='dark'?old:'system'),d=m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.palette=p;document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){document.documentElement.dataset.palette='sparky';document.documentElement.dataset.theme='light'}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
