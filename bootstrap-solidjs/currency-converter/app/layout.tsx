import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Currency Converter",
  description: "A simple and fast currency converter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
