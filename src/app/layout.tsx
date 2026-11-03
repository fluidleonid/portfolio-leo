import type { Metadata } from "next";
import { AssetProtection } from "@/shared/ui";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://leo-portfolio-orpin.vercel.app"),
  title: {
    default: "Leonid Dmitriev — Product Designer",
    template: "%s — Leonid Dmitriev",
  },
  description:
    "Portfolio of Leonid Dmitriev: Product Designer specializing in complex B2B platforms, enterprise tools, and FinTech systems.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://leo-portfolio-orpin.vercel.app",
    siteName: "Leonid Dmitriev — Product Designer",
    title: "Leonid Dmitriev — Product Designer",
    description:
      "Portfolio of Leonid Dmitriev: Product Designer specializing in complex B2B platforms, enterprise tools, and FinTech systems.",
    images: [
      {
        url: "/quickaccess.png",
        width: 1200,
        height: 630,
        alt: "Leonid Dmitriev — Product Designer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Leonid Dmitriev — Product Designer",
    description:
      "Portfolio of Leonid Dmitriev: Product Designer specializing in complex B2B platforms, enterprise tools, and FinTech systems.",
    images: ["/quickaccess.png"],
    creator: "@leodmitriev",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="overflow-x-hidden max-w-full">
      <body className="bg-canvas text-white antialiased overflow-x-hidden max-w-full">
        <AssetProtection />
        {children}
      </body>
    </html>
  );
}
