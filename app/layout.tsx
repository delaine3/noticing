import type { Metadata } from "next";
import "./globals.css";
import { AppNav } from "./components/AppNav";

export const metadata: Metadata = {
  title: "Noticing",
  description: "A personal tracker for patterns, care, and daily evidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppNav />
        {children}
      </body>
    </html>
  );
}
