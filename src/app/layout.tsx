import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { MysticBackground } from "@/components/animations/visual-effects";
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
    <header className="sticky top-0 z-50 border-b border-border/50 bg-white/60 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <svg
            className="h-8 w-8 text-vermilion"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 2 A10 10 0 0 1 12 22 A5 5 0 0 1 12 12 A5 5 0 0 0 12 2" fill="currentColor" />
            <circle cx="12" cy="7" r="1.5" fill="white" />
            <circle cx="12" cy="17" r="1.5" fill="currentColor" />
          </svg>
          <span className="heading-font text-lg text-ink">八字推演</span>
          <span className="seal-tag bg-vermilion text-white">祖宗之法</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="relative group rounded-md px-3 py-1.5 text-sm font-medium text-ink-light transition-colors hover:text-vermilion after:absolute after:bottom-0.5 after:left-1/2 after:h-0.5 after:w-0 after:-translate-x-1/2 after:bg-vermilion after:transition-all after:duration-300 group-hover:after:w-3/4"
          >
            排盘
          </Link>
          <Link
            href="/saved"
            className="relative group rounded-md px-3 py-1.5 text-sm font-medium text-ink-light transition-colors hover:text-vermilion after:absolute after:bottom-0.5 after:left-1/2 after:h-0.5 after:w-0 after:-translate-x-1/2 after:bg-vermilion after:transition-all after:duration-300 group-hover:after:w-3/4"
          >
            我的命盘
          </Link>
          <Link
            href="/about"
            className="relative group rounded-md px-3 py-1.5 text-sm font-medium text-ink-light transition-colors hover:text-vermilion after:absolute after:bottom-0.5 after:left-1/2 after:h-0.5 after:w-0 after:-translate-x-1/2 after:bg-vermilion after:transition-all after:duration-300 group-hover:after:w-3/4"
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
    <footer className="border-t border-border/50 bg-white/40 backdrop-blur-sm relative z-10">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* 装饰性分隔线 */}
        <div className="ink-divider mb-8" />

        {/* 链接矩阵 */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h4 className="heading-font text-xs font-semibold uppercase tracking-wider text-ink-light mb-3">产品</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-ink-lighter transition-colors hover:text-vermilion">排盘</Link></li>
              <li><Link href="/saved" className="text-sm text-ink-lighter transition-colors hover:text-vermilion">我的命盘</Link></li>
              <li><Link href="/about" className="text-sm text-ink-lighter transition-colors hover:text-vermilion">关于</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="heading-font text-xs font-semibold uppercase tracking-wider text-ink-light mb-3">权威来源</h4>
            <ul className="space-y-2">
              <li className="text-sm text-ink-lighter">紫金山天文台</li>
              <li className="text-sm text-ink-lighter">GB/T 33661-2017</li>
              <li className="text-sm text-ink-lighter">12部古籍原典</li>
            </ul>
          </div>
          <div>
            <h4 className="heading-font text-xs font-semibold uppercase tracking-wider text-ink-light mb-3">技术栈</h4>
            <ul className="space-y-2">
              <li className="text-sm text-ink-lighter">Next.js 16 + React 19</li>
              <li className="text-sm text-ink-lighter">astronomy-engine</li>
              <li className="text-sm text-ink-lighter">lunar-typescript</li>
            </ul>
          </div>
        </div>

        {/* 分隔线 */}
        <div className="my-6 border-t border-border" />

        {/* 底部信息 */}
        <div className="flex flex-col items-center gap-3 text-center">
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
      <body className="min-h-full flex flex-col bg-paper relative">
        {/* 全局玄学法器背景 — 所有页面共享 */}
        <MysticBackground />
        <Navbar />
        <main className="flex-1 relative z-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
