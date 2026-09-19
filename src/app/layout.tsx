import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-sans-th",
  subsets: ["thai", "latin"],
});

export const metadata: Metadata = {
  title: "HKW Service | ระบบแจ้งซ่อมโรงเรียน",
  description: "ระบบแจ้งซ่อมและติดตามงานภายในโรงเรียน",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${notoSansThai.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
