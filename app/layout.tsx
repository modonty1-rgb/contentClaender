import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/app/components/ui/sonner";
import { ThemeProvider } from "@/app/components/theme-provider";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "JBR Content Calendar",
  description: "إدارة محتوى JBR SEO",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable} suppressHydrationWarning>
      <body style={{ fontFamily: "var(--font-tajawal), sans-serif" }}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
