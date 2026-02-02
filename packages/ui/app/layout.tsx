import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "@/src/trpc/provider";

export const metadata: Metadata = {
  title: "NHS Notify - Supplier Configuration",
  description: "NHS Notify Supplier Configuration Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
