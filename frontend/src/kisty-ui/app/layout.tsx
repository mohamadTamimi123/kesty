import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./components/Providers";
import Nav from "./components/Nav";
import ErrorBoundary from "./components/ErrorBoundary";
import ReactDOMPolyfill from "./components/ReactDOMPolyfill";
import WebVitals from "./components/WebVitals";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "کیستی - پلتفرم اتصال مشتریان و تولیدکنندگان",
    template: "%s | کیستی",
  },
  description: "پلتفرم کیستی برای اتصال مشتریان و تولیدکنندگان در حوزه‌های مختلف صنعتی و ساختمانی",
  keywords: ["کیستی", "تولیدکننده", "مشتری", "پروژه", "صنعت", "ساختمان"],
  authors: [{ name: "Kisty Team" }],
  creator: "Kisty",
  publisher: "Kisty",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: "/",
    siteName: "کیستی",
    title: "کیستی - پلتفرم اتصال مشتریان و تولیدکنندگان",
    description: "پلتفرم کیستی برای اتصال مشتریان و تولیدکنندگان",
  },
  twitter: {
    card: "summary_large_image",
    title: "کیستی - پلتفرم اتصال مشتریان و تولیدکنندگان",
    description: "پلتفرم کیستی برای اتصال مشتریان و تولیدکنندگان",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-brand-off-white`}
      >
        <ReactDOMPolyfill />
        <WebVitals />
        <Providers>
          <ErrorBoundary>
            <Nav />
            {children}
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
