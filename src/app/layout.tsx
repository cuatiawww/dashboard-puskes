import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const manrope = Manrope({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ["latin"],
  variable: "--font-manrope",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Dashboard Puskes - Kemenkes RI",
  description: "Dashboard Puskes untuk pemantauan data kesehatan Kementerian Kesehatan Republik Indonesia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${manrope.variable} font-manrope antialiased`}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
