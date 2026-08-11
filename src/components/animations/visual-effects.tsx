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
          width: "500px",
          height: "500px",
          top: "-10%",
          left: "5%",
          background: "linear-gradient(135deg, rgba(185, 28, 28, 0.15), rgba(220, 38, 38, 0.05))",
          animationDelay: "0s",
        }}
      />
      {/* 靛青极光 */}
      <div
        className="aurora-blob animate-breathe"
        style={{
          width: "400px",
          height: "400px",
          bottom: "-5%",
          right: "10%",
          background: "linear-gradient(135deg, rgba(49, 46, 129, 0.12), rgba(4, 120, 87, 0.05))",
          animationDelay: "2s",
        }}
      />
      {/* 鎏金极光 */}
      <div
        className="aurora-blob animate-breathe"
        style={{
          width: "350px",
          height: "350px",
          top: "40%",
          left: "50%",
          transform: "translateX(-50%)",
          background: "linear-gradient(135deg, rgba(161, 98, 7, 0.1), rgba(202, 138, 4, 0.03))",
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
