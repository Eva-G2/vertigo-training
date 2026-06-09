import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import { AppProvider } from "@/components/providers/AppProvider";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Vertigo Training",
  description:
    "Interactive Vestibular Rehabilitation Therapy — self-practice tool based on CUHK guidelines",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" className={`${notoSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
