import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "OWM シールチェッカー | 画像の真贋確認",
  description: "Open Wardrobe Market に登録された作品かどうかを確認できます。",
  openGraph: {
    title: "OWM シールチェッカー",
    description: "Open Wardrobe Market の登録作品かを確認",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
