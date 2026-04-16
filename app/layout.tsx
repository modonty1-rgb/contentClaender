import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Toaster } from "@/app/components/ui/sonner";

export const metadata: Metadata = {
  title: "JBR Content Calendar",
  description: "إدارة محتوى JBR SEO",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
