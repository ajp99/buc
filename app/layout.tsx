import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Devanagari } from "next/font/google";
import { I18nProvider } from "@/components/i18n-provider";
import { getLang } from "@/lib/i18n-server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
});

export const metadata: Metadata = {
  title: "Tuition Class",
  description: "Announcements, homework, materials, quizzes and fees for our tuition class.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getLang();
  return (
    <html lang={lang}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${devanagari.variable} antialiased`}
      >
        <I18nProvider lang={lang}>{children}</I18nProvider>
      </body>
    </html>
  );
}
