import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Personal Portfolio",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="overflow-x-hidden max-w-full">
      <body className="bg-canvas text-white antialiased overflow-x-hidden max-w-full">
        {children}
      </body>
    </html>
  );
}
