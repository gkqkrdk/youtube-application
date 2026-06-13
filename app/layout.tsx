import "@/styles/globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "국내주식 스윙 플래너",
  description: "경제지표, 이슈흐름, 후보군, 일일기록을 모바일에서 확인하는 국내주식 플래너"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
