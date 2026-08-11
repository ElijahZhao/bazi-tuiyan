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
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* 链接矩阵 */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h4 className="heading-font text-xs font-semibold uppercase tracking-wider text-ink-light mb-3">产品</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-ink-lighter transition-colors hover:text-vermilion">排盘</Link></li>
              <li><Link href="/saved" className="text-sm text-ink-lighter transition-colors hover:text-vermilion">我的命盘</Link></li>
              <li><Link href="/about" className="text-sm text-ink-lighter transition-colors hover:text-vermilion">关于</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="heading-font text-xs font-semibold uppercase tracking-wider text-ink-light mb-3">资源</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://github.com/ElijahZhao/bazi-tuiyan" target="_blank" rel="noopener noreferrer" className="text-sm text-ink-lighter transition-colors hover:text-vermilion">
                  GitHub 源码
                </a>
              </li>
              <li>
                <a href="https://bazi-tuiyan.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-sm text-ink-lighter transition-colors hover:text-vermilion">
                  在线部署
                </a>
              </li>
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
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://bazi-tuiyan.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-indigo-deep transition-colors hover:text-vermilion"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              bazi-tuiyan.vercel.app
            </a>
            <a
              href="https://github.com/ElijahZhao/bazi-tuiyan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-ink-lighter transition-colors hover:text-ink"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>
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
