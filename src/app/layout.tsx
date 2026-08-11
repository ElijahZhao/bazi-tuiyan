import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "八字推演 — 祖宗之法排盘",
  description: "严格遵循古籍原典的八字排盘与命理分析工具",
};

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-paper/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="heading-font text-lg text-ink">八字推演</span>
          <span className="seal-tag bg-vermilion text-white">祖宗之法</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-light transition-colors hover:bg-paper-dark hover:text-ink"
          >
            排盘
          </Link>
          <Link
            href="/saved"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-light transition-colors hover:bg-paper-dark hover:text-ink"
          >
            我的命盘
          </Link>
          <Link
            href="/about"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-light transition-colors hover:bg-paper-dark hover:text-ink"
          >
            关于
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-paper-dark/50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-xs text-ink-lighter">
            八字推演 · 严格遵循《三命通会》《渊海子平》《子平真诠》等古籍原典
          </p>
          <p className="text-xs text-ink-lightest">
            天文数据以中国科学院紫金山天文台为最终校准基准 · 排盘引擎纯客户端计算
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
