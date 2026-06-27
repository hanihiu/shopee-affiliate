import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shopee Affiliate Link Generator",
  description:
    "Generate Shopee affiliate tracking links with custom sub IDs. Premium console for affiliate marketers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
