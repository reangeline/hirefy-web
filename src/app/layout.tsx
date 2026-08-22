import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Mesma fonte do app mobile (AppTheme, GoogleFonts.inter) e da landing page.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hirefy",
  description: "Otimize seu currículo com IA para passar em ATS.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
