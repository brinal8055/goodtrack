import type { Metadata } from "next";
import { Toaster } from "sonner";

import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "TextileTrack",
  description: "Textile production tracking and management system"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
