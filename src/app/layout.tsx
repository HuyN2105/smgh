//
// Created by HuyN on 2026/11/26.
// Description: Root Layout của ứng dụng Next.js, cấu hình metadata, font chữ
// và khởi tạo trạng thái theme tức thì tránh hiện tượng chớp sáng khi tải trang.
//

import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
    subsets: ["latin", "vietnamese"],
    variable: "--font-sans",
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin", "vietnamese"],
    variable: "--font-mono",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Trạm Quan Trắc Nhà Kính | Central Dashboard",
    description: "Hệ thống giám sát cảm biến nhà kính thông minh thời gian thực",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="vi"
            suppressHydrationWarning
            className={`${jakartaSans.variable} ${jetbrainsMono.variable}`}
        >
        <head>
            <script
                dangerouslySetInnerHTML={{
                    __html: `
              try {
                if (localStorage.getItem('smgh_theme') === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch (_) {}
            `,
                }}
            />
        </head>
        <body className="antialiased app-bg">
        {children}
        </body>
        </html>
    );
}