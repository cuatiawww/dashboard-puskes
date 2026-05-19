import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

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
      <body className="font-manrope antialiased">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
