import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "360FOS Tactical Intelligence",
  description: "Football tactical intelligence and match preparation."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
