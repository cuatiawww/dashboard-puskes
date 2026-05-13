import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Dashboard Kesehatan - Kemenkes RI",
  description: "Sistem Informasi Kesehatan Kementerian Kesehatan Republik Indonesia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${poppins.variable} font-poppins antialiased`}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}