import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "OWM Aether Seal | Verify Image Authenticity",
  description: "Verify if an image was generated and registered on Open Wardrobe Market. Check authenticity and get signed certificates.",
  openGraph: {
    title: "OWM Aether Seal",
    description: "Verify authenticity of OWM-generated images",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
