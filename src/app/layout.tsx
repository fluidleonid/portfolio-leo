import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://leo-portfolio-orpin.vercel.app"),
  title: {
    default: "Leo Rogov — Product Designer",
    template: "%s — Leo Rogov",
  },
  description:
    "Portfolio of Leo Rogov: Senior Product Designer specializing in complex B2B platforms, enterprise tools, and FinTech systems.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://leo-portfolio-orpin.vercel.app",
    siteName: "Leo Rogov — Product Designer",
    title: "Leo Rogov — Product Designer",
    description:
      "Portfolio of Leo Rogov: Senior Product Designer specializing in complex B2B platforms, enterprise tools, and FinTech systems.",
    images: [
      {
        url: "/quickaccess.png",
        width: 1200,
        height: 630,
        alt: "Leo Rogov — Product Designer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Leo Rogov — Product Designer",
    description:
      "Portfolio of Leo Rogov: Senior Product Designer specializing in complex B2B platforms, enterprise tools, and FinTech systems.",
    images: ["/quickaccess.png"],
    creator: "@leorogov",
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
        {children}
      </body>
    </html>
  );
}
