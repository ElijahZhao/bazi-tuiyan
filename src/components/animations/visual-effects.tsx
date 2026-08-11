"use client";

/**
 * 视觉特效组件集
 *
 * 灵感来源：
 * - Originkit: 粒子星空 (Stardust)、磁吸按钮 (Magnetic Hover)
 * - React Bits: 极光背景 (Soft Aurora)、光泽文字 (Shiny Text)
 * - GSAP: ScrollTrigger 滚动揭示、时间线编排
 *
 * 全部使用原生 CSS/Canvas + GSAP 实现，无需额外安装依赖
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// 注册 ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ============================================================
// 1. ScrollReveal — GSAP ScrollTrigger 滚动揭示
// ============================================================

type RevealDirection = "up" | "left" | "right" | "scale" | "fade";

interface ScrollRevealProps {
  children: ReactNode;
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  stagger?: number;
  /** 选择器，用于对子元素进行 stagger 动画。不传则对容器整体动画 */
  staggerSelector?: string;
  className?: string;
  /** 提前触发距离，正值提前，负值延迟 */
  offset?: number;
}

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.7,
  stagger = 0,
  staggerSelector,
  className = "",
  offset = 0,
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) {
        gsap.set(el, { opacity: 1, x: 0, y: 0, scale: 1 });
        return;
      }

      const fromVars: gsap.TweenVars = {};
      switch (direction) {
        case "up":
          fromVars.y = 40;
          fromVars.opacity = 0;
          break;
        case "left":
          fromVars.x = -40;
          fromVars.opacity = 0;
          break;
        case "right":
          fromVars.x = 40;
          fromVars.opacity = 0;
          break;
        case "scale":
          fromVars.scale = 0.9;
          fromVars.opacity = 0;
          break;
        case "fade":
          fromVars.opacity = 0;
          break;
      }

      const targets = staggerSelector
        ? el.querySelectorAll(staggerSelector)
        : el;

      gsap.set(targets, fromVars);

      gsap.to(targets, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration,
        delay,
        stagger: staggerSelector ? stagger : 0,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: `top ${85 + offset}%`,
          toggleActions: "play none none reverse",
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [direction, delay, duration, stagger, staggerSelector, offset]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// ============================================================
// 2. AuroraBackground — 极光渐变背景
//    灵感来自 React Bits Soft Aurora
// ============================================================

interface AuroraBackgroundProps {
  className?: string;
  /** 是否启用鼠标交互 */
  interactive?: boolean;
}

export function AuroraBackground({ className = "", interactive = false }: AuroraBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!interactive) return;
    const el = containerRef.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--mouse-x", `${x}%`);
      el.style.setProperty("--mouse-y", `${y}%`);
    };

    el.addEventListener("mousemove", handleMouseMove);
    return () => el.removeEventListener("mousemove", handleMouseMove);
  }, [interactive]);

  return (
    <div
      ref={containerRef}
      className={`aurora-bg ${className}`}
      aria-hidden="true"
    >
      {/* 朱砂极光 */}
      <div
        className="aurora-blob animate-breathe"
        style={{
          width: "600px",
          height: "600px",
          top: "-10%",
          left: "5%",
          background: "linear-gradient(135deg, rgba(185, 28, 28, 0.22), rgba(220, 38, 38, 0.08))",
          animationDelay: "0s",
        }}
      />
      {/* 靛青极光 */}
      <div
        className="aurora-blob animate-breathe"
        style={{
          width: "500px",
          height: "500px",
          bottom: "-5%",
          right: "10%",
          background: "linear-gradient(135deg, rgba(49, 46, 129, 0.18), rgba(4, 120, 87, 0.08))",
          animationDelay: "2s",
        }}
      />
      {/* 鎏金极光 */}
      <div
        className="aurora-blob animate-breathe"
        style={{
          width: "450px",
          height: "450px",
          top: "40%",
          left: "50%",
          transform: "translateX(-50%)",
          background: "linear-gradient(135deg, rgba(161, 98, 7, 0.15), rgba(202, 138, 4, 0.05))",
          animationDelay: "4s",
        }}
      />
    </div>
  );
}

// ============================================================
// 3. ParticleField — Canvas 粒子星空
//    灵感来自 Originkit Stardust
// ============================================================

interface ParticleFieldProps {
  className?: string;
  /** 粒子数量 */
  count?: number;
  /** 粒子颜色 */
  color?: string;
  /** 最大粒子大小 */
  maxSize?: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

export function ParticleField({
  className = "",
  count = 60,
  color = "185, 28, 28",
  maxSize = 2,
}: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let particles: Particle[] = [];
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    const initParticles = () => {
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * maxSize + 0.5,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.15,
        opacity: Math.random() * 0.5 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
      }));
    };

    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      time += 0.016;

      for (const p of particles) {
        // 移动
        p.x += p.speedX;
        p.y += p.speedY;

        // 边界回绕
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // 闪烁
        const twinkle = reduceMotion
          ? p.opacity
          : p.opacity * (0.5 + 0.5 * Math.sin(time * p.twinkleSpeed * 60 + p.twinkleOffset));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${twinkle})`;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    resize();
    initParticles();
    draw();

    const handleResize = () => {
      resize();
      initParticles();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [count, color, maxSize]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}

// ============================================================
// 4. MagneticButton — 磁吸悬停按钮
//    灵感来自 Originkit Magnetic Hover
// ============================================================

interface MagneticButtonProps {
  children: ReactNode;
  /** 磁吸强度，越大越强 */
  strength?: number;
  className?: string;
  onClick?: () => void;
}

export function MagneticButton({
  children,
  strength = 0.3,
  className = "",
  onClick,
}: MagneticButtonProps) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = (e.clientX - centerX) * strength;
      const dy = (e.clientY - centerY) * strength;
      xTo(dx);
      yTo(dy);
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [strength]);

  return (
    <div ref={wrapRef} className={`magnetic-wrap ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

// ============================================================
// 5. CountUp — 数字递增动画
//    使用 GSAP 滚动触发
// ============================================================

interface CountUpProps {
  /** 目标数值 */
  end: number;
  /** 后缀，如 "+" */
  suffix?: string;
  /** 前缀 */
  prefix?: string;
  /** 动画时长（秒） */
  duration?: number;
  className?: string;
}

export function CountUp({ end, suffix = "", prefix = "", duration = 2, className = "" }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      el.textContent = `${prefix}${end}${suffix}`;
      return;
    }

    const obj = { val: 0 };
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        val: end,
        duration,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          toggleActions: "play none none reverse",
        },
        onUpdate: () => {
          el.textContent = `${prefix}${Math.round(obj.val)}${suffix}`;
        },
      });
    });

    return () => ctx.revert();
  }, [end, suffix, prefix, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}

// ============================================================
// 6. InkRipple — 点击墨韵涟漪效果
// ============================================================

export function useInkRipple() {
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height);

    ripple.style.cssText = `
      position: absolute;
      left: ${e.clientX - rect.left - size / 2}px;
      top: ${e.clientY - rect.top - size / 2}px;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: rgba(28, 25, 23, 0.1);
      pointer-events: none;
      animation: inkRipple 0.6s ease-out forwards;
    `;

    target.style.position = target.style.position || "relative";
    target.style.overflow = "hidden";
    target.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  };

  return handleClick;
}

// ============================================================
// 7. TiltCard — 3D 倾斜卡片
// ============================================================

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** 倾斜最大角度 */
  maxTilt?: number;
}

export function TiltCard({ children, className = "", maxTilt = 8 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const tiltX = (0.5 - y) * maxTilt * 2;
      const tiltY = (x - 0.5) * maxTilt * 2;

      gsap.to(el, {
        rotateX: tiltX,
        rotateY: tiltY,
        duration: 0.3,
        ease: "power2.out",
        transformPerspective: 800,
      });
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: "power3.out",
      });
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [maxTilt]);

  return (
    <div ref={ref} className={className} style={{ transformStyle: "preserve-3d" }}>
      {children}
    </div>
  );
}

// ============================================================
// 8. TextReveal — 逐行文字揭示动画
//    灵感来自 GSAP SplitText
// ============================================================

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
}

export function TextReveal({ text, className = "", delay = 0 }: TextRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      gsap.from(el, {
        opacity: 0,
        y: 20,
        duration: 0.8,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          toggleActions: "play none none reverse",
        },
      });
    });

    return () => ctx.revert();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {text}
    </div>
  );
}

// ============================================================
// 9. MysticBackground — 全局玄学法器背景
//    八卦罗盘 + 太极 + 天干地支 + 飘浮符文 + 极光 + 粒子
//    灵感：Originkit 粒子 + React Bits Aurora + 传统玄学法器
// ============================================================

/** 八卦符号 */
const BAGUA_SYMBOLS = ["☰", "☱", "☲", "☳", "☴", "☵", "☶", "☷"];

/** 天干 */
const TIANGAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

/** 地支 */
const DIZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

/** 五行 */
const WUXING = ["金", "木", "水", "火", "土"];

/** 六十四卦名（精选16） */
const HEXAGRAM_NAMES = ["乾", "坤", "屯", "蒙", "需", "讼", "师", "比", "泰", "否", "同人", "大有", "谦", "豫", "坎", "离"];

export function MysticBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const runes = el.querySelectorAll(".mystic-rune");
    const ctx = gsap.context(() => {
      // 漂浮符文动画 — 增强幅度与可见度
      runes.forEach((rune, i) => {
        gsap.to(rune, {
          y: `+=${25 + Math.random() * 40}`,
          x: `+=${(Math.random() - 0.5) * 30}`,
          opacity: 0.08 + Math.random() * 0.06,
          duration: 8 + Math.random() * 8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.3,
        });
      });

      // 滚动视差 — 罗盘与法器随滚动缓慢漂移
      const parallaxSlow = el.querySelectorAll(".parallax-slow");
      const parallaxFast = el.querySelectorAll(".parallax-fast");

      if (parallaxSlow.length > 0) {
        gsap.to(parallaxSlow, {
          yPercent: -15,
          ease: "none",
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
        });
      }

      if (parallaxFast.length > 0) {
        gsap.to(parallaxFast, {
          yPercent: 10,
          ease: "none",
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 1.5,
          },
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* === 极光渐变层 === */}
      <AuroraBackground />

      {/* === 双层粒子星空 — 鎏金 + 朱砂 === */}
      <ParticleField
        className="absolute inset-0 w-full h-full"
        count={80}
        color="161, 98, 7"
        maxSize={2.5}
      />
      <ParticleField
        className="absolute inset-0 w-full h-full"
        count={30}
        color="185, 28, 28"
        maxSize={1.5}
      />

      {/* === 网格底纹 === */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(28, 25, 23, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(28, 25, 23, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* === 八卦罗盘 — 左上（增强：多环 + 二十四山 + 八卦符号 + 天心十字） === */}
      <div className="parallax-slow absolute top-[3%] left-[2%] w-[380px] h-[380px] opacity-[0.08]">
        <svg viewBox="0 0 200 200" className="w-full h-full animate-mystic-spin" style={{ color: "var(--color-vermilion)" }}>
          {/* 多层环 */}
          <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="0.3" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="0.3" />
          <circle cx="100" cy="100" r="55" fill="none" stroke="currentColor" strokeWidth="0.3" />
          {/* 二十四山刻线 */}
          {Array.from({ length: 24 }, (_, i) => {
            const angle = i * 15 - 90;
            const rad = (angle * Math.PI) / 180;
            return (
              <line
                key={`m24-${i}`}
                x1={100 + 85 * Math.cos(rad)}
                y1={100 + 85 * Math.sin(rad)}
                x2={100 + 95 * Math.cos(rad)}
                y2={100 + 95 * Math.sin(rad)}
                stroke="currentColor"
                strokeWidth="0.4"
              />
            );
          })}
          {/* 八宫分隔线 */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <line
                key={`g${angle}`}
                x1={100 + 55 * Math.cos(rad)}
                y1={100 + 55 * Math.sin(rad)}
                x2={100 + 85 * Math.cos(rad)}
                y2={100 + 85 * Math.sin(rad)}
                stroke="currentColor"
                strokeWidth="0.4"
              />
            );
          })}
          {/* 八卦符号 */}
          {BAGUA_SYMBOLS.map((symbol, i) => {
            const angle = (i * 45 - 90) * Math.PI / 180;
            return (
              <text
                key={`b-${i}`}
                x={100 + 62 * Math.cos(angle)}
                y={100 + 62 * Math.sin(angle)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="9"
                fill="currentColor"
                fontFamily="serif"
              >
                {symbol}
              </text>
            );
          })}
          {/* 天心十字 */}
          <line x1="100" y1="88" x2="100" y2="112" stroke="currentColor" strokeWidth="0.3" />
          <line x1="88" y1="100" x2="112" y2="100" stroke="currentColor" strokeWidth="0.3" />
          <circle cx="100" cy="100" r="6" fill="none" stroke="currentColor" strokeWidth="0.4" />
        </svg>
      </div>

      {/* === 太极图 — 右下（增强：外环八卦） === */}
      <div className="parallax-fast absolute bottom-[5%] right-[2%] w-[340px] h-[340px] opacity-[0.10]">
        <svg viewBox="0 0 200 200" className="w-full h-full animate-mystic-spin-reverse" style={{ color: "var(--color-ink)" }}>
          <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="0.4" />
          <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="0.8" />
          {/* 太极图 */}
          <path
            d="M 100 10 A 90 90 0 0 1 100 190 A 45 45 0 0 1 100 100 A 45 45 0 0 0 100 10 Z"
            fill="currentColor"
          />
          <circle cx="100" cy="55" r="8" fill="none" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="100" cy="145" r="8" fill="currentColor" />
          <circle cx="100" cy="55" r="3" fill="currentColor" />
          <circle cx="100" cy="145" r="3" fill="none" stroke="currentColor" strokeWidth="0.5" />
          {/* 外环八卦符号 */}
          {BAGUA_SYMBOLS.map((symbol, i) => {
            const angle = (i * 45 - 90) * Math.PI / 180;
            return (
              <text
                key={`tb-${i}`}
                x={100 + 78 * Math.cos(angle)}
                y={100 + 78 * Math.sin(angle)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="7"
                fill="currentColor"
                fontFamily="serif"
                opacity="0.6"
              >
                {symbol}
              </text>
            );
          })}
        </svg>
      </div>

      {/* === 小型罗盘 — 右上（十二地支） === */}
      <div className="parallax-slow absolute top-[10%] right-[8%] w-[180px] h-[180px] opacity-[0.06]">
        <svg viewBox="0 0 200 200" className="w-full h-full animate-mystic-spin" style={{ color: "var(--color-gold)" }}>
          <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="0.3" />
          {DIZHI.map((zhi, i) => {
            const angle = (i * 30 - 90) * Math.PI / 180;
            return (
              <text
                key={`d-${i}`}
                x={100 + 82 * Math.cos(angle)}
                y={100 + 82 * Math.sin(angle)}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="8"
                fill="currentColor"
                fontFamily="serif"
              >
                {zhi}
              </text>
            );
          })}
        </svg>
      </div>

      {/* === 法器：铜钱 — 左下（太平天国纹） === */}
      <div className="parallax-fast absolute bottom-[15%] left-[5%] w-[120px] h-[120px] opacity-[0.07]">
        <div className="animate-float-slow w-full h-full">
          <svg viewBox="0 0 100 100" style={{ color: "var(--color-gold)" }}>
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <rect x="35" y="35" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <text x="50" y="28" textAnchor="middle" fontSize="10" fill="currentColor" fontFamily="serif">天</text>
            <text x="50" y="80" textAnchor="middle" fontSize="10" fill="currentColor" fontFamily="serif">国</text>
            <text x="22" y="55" textAnchor="middle" fontSize="10" fill="currentColor" fontFamily="serif">太</text>
            <text x="78" y="55" textAnchor="middle" fontSize="10" fill="currentColor" fontFamily="serif">平</text>
          </svg>
        </div>
      </div>

      {/* === 法器：葫芦 — 中右 === */}
      <div className="parallax-slow absolute top-[45%] right-[12%] w-[100px] h-[140px] opacity-[0.05]">
        <div className="animate-float-slow w-full h-full">
          <svg viewBox="0 0 100 140" style={{ color: "var(--color-jade)" }}>
            <path
              d="M50 10 Q35 15 35 30 Q35 40 45 45 Q30 50 25 70 Q25 120 50 130 Q75 120 75 70 Q70 50 55 45 Q65 40 65 30 Q65 15 50 10 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <line x1="50" y1="10" x2="50" y2="5" stroke="currentColor" strokeWidth="1" />
            <path d="M45 5 Q50 0 55 5" fill="none" stroke="currentColor" strokeWidth="1" />
            <ellipse cx="50" cy="47" rx="12" ry="3" fill="none" stroke="currentColor" strokeWidth="0.6" />
          </svg>
        </div>
      </div>

      {/* === 祥云纹 — 左中 === */}
      <div className="parallax-fast absolute top-[20%] left-[15%] w-[200px] h-[80px] opacity-[0.05]">
        <div className="animate-drift w-full h-full">
          <svg viewBox="0 0 200 80" className="w-full h-full" style={{ color: "var(--color-indigo-deep)" }}>
            <path
              d="M20 50 Q10 50 10 40 Q10 30 25 30 Q25 18 40 20 Q48 8 62 18 Q75 12 82 28 Q95 25 100 40 Q115 35 120 50 Q130 48 135 58 L20 58 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
            <path d="M30 45 Q25 45 25 38 Q25 32 32 32" fill="none" stroke="currentColor" strokeWidth="0.6" />
            <path d="M60 42 Q55 42 55 35 Q55 30 60 30" fill="none" stroke="currentColor" strokeWidth="0.6" />
            <path d="M90 48 Q85 48 85 42 Q85 36 90 36" fill="none" stroke="currentColor" strokeWidth="0.6" />
          </svg>
        </div>
      </div>

      {/* === 祥云纹 — 右中下 === */}
      <div className="parallax-slow absolute bottom-[30%] right-[20%] w-[160px] h-[60px] opacity-[0.04]">
        <div className="animate-drift w-full h-full" style={{ animationDelay: "3s" }}>
          <svg viewBox="0 0 200 80" className="w-full h-full" style={{ color: "var(--color-vermilion)" }}>
            <path
              d="M20 50 Q10 50 10 40 Q10 30 25 30 Q25 18 40 20 Q48 8 62 18 Q75 12 82 28 Q95 25 100 40 Q115 35 120 50 Q130 48 135 58 L20 58 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        </div>
      </div>

      {/* === 天干飘浮符文 === */}
      {TIANGAN.map((gan, i) => (
        <span
          key={`gan-${i}`}
          className="mystic-rune absolute heading-font select-none"
          style={{
            top: `${8 + Math.random() * 80}%`,
            left: `${5 + Math.random() * 85}%`,
            fontSize: `${28 + Math.random() * 40}px`,
            color: i % 2 === 0 ? "var(--color-vermilion)" : "var(--color-indigo-deep)",
            opacity: 0.06,
          }}
        >
          {gan}
        </span>
      ))}

      {/* === 地支飘浮符文 === */}
      {DIZHI.map((zhi, i) => (
        <span
          key={`zhi-${i}`}
          className="mystic-rune absolute heading-font select-none"
          style={{
            top: `${5 + Math.random() * 82}%`,
            left: `${3 + Math.random() * 88}%`,
            fontSize: `${24 + Math.random() * 36}px`,
            color: i % 3 === 0 ? "var(--color-gold)" : i % 3 === 1 ? "var(--color-jade)" : "var(--color-ink)",
            opacity: 0.055,
          }}
        >
          {zhi}
        </span>
      ))}

      {/* === 五行飘浮符文 === */}
      {WUXING.map((el, i) => (
        <span
          key={`wx-${i}`}
          className="mystic-rune absolute heading-font select-none"
          style={{
            top: `${15 + Math.random() * 70}%`,
            left: `${8 + Math.random() * 80}%`,
            fontSize: `${32 + Math.random() * 28}px`,
            color: i === 0 ? "var(--color-gold)" : i === 1 ? "var(--color-jade)" : i === 2 ? "var(--color-water)" : i === 3 ? "var(--color-vermilion)" : "var(--color-earth)",
            opacity: 0.05,
          }}
        >
          {el}
        </span>
      ))}

      {/* === 卦名飘浮符文 === */}
      {HEXAGRAM_NAMES.map((name, i) => (
        <span
          key={`hex-${i}`}
          className="mystic-rune absolute heading-font select-none"
          style={{
            top: `${10 + Math.random() * 75}%`,
            left: `${5 + Math.random() * 85}%`,
            fontSize: `${20 + Math.random() * 24}px`,
            color: i % 2 === 0 ? "var(--color-ink)" : "var(--color-gold)",
            opacity: 0.04,
          }}
        >
          {name}
        </span>
      ))}

      {/* === 回纹顶饰 === */}
      <div
        className="absolute top-0 left-0 right-0 h-[8px] opacity-[0.08]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='8' viewBox='0 0 40 8'%3E%3Cpath d='M0 4 L6 4 L6 1 L2 1 L2 7 L10 7 L10 4 L16 4 L16 1 L12 1 L12 7 L20 7 L20 4 L26 4 L26 1 L22 1 L22 7 L30 7 L30 4 L36 4 L36 1 L32 1 L32 7 L40 7' fill='none' stroke='%23b91c1c' stroke-width='0.6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat-x",
        }}
      />

      {/* === 顶部和底部渐变遮罩 === */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-paper to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-paper to-transparent" />
    </div>
  );
}
