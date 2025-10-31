import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { RootProvider } from "@/components/providers/root-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Menoo Dashboard",
    template: "%s | Menoo",
  },
  description:
    "Gestiona menús digitals multi-idioma amb subscripcions, analítica i QR.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen`}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
