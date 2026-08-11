"use client";

/**
 * GSAP 动画组件
 *
 * 1. PillarEntrance — 四柱干支依次浮现
 * 2. ElementRing — 五行环充能动画
 * 3. DaYunScroll — 大运轴自动滚动至当前运
 *
 * 来源：项目大纲 第七节技术栈（GSAP 复杂序列动画）
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import type { BaziChart, Element } from "@/lib/engine/types";

// ============================================================
// 1. 四柱干支依次浮现
// ============================================================

/**
 * 包裹四柱表格，使其干支大字依次浮现。
 *
 * 动画序列：
 * 年柱天干 → 年柱地支 → 月柱天干 → 月柱地支 → 日柱天干 → 日柱地支 → 时柱天干 → 时柱地支
 * 每步间隔 0.12s，单个元素 0.5s 完成动画（从下方浮现+淡入+轻微缩放）
 */
export function PillarEntrance({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 选中所有带 data-pillar-stem 和 data-pillar-branch 的元素
      const stemEls = gsap.utils.toArray<HTMLElement>("[data-pillar-stem]");
      const branchEls = gsap.utils.toArray<HTMLElement>("[data-pillar-branch]");

      // 按年→月→日→时顺序交替排列天干和地支
      const sequence: HTMLElement[] = [];
      const maxLen = Math.max(stemEls.length, branchEls.length);
      for (let i = 0; i < maxLen; i++) {
        if (stemEls[i]) sequence.push(stemEls[i]);
        if (branchEls[i]) sequence.push(branchEls[i]);
      }

      // 初始状态
      gsap.set(sequence, {
        opacity: 0,
        y: 30,
        scale: 0.8,
        filter: "blur(4px)",
      });

      // 也隐藏纳音和十神（它们会在干支之后淡入）
      const metaEls = gsap.utils.toArray<HTMLElement>("[data-pillar-meta]");
      gsap.set(metaEls, { opacity: 0 });

      // 创建时间线
      const tl = gsap.timeline({ delay: 0.3 });

      // 依次浮现干支
      tl.to(sequence, {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.5,
        stagger: 0.12,
        ease: "back.out(1.4)",
      });

      // 纳音和十神淡入
      tl.to(metaEls, {
        opacity: 1,
        duration: 0.4,
        stagger: 0.05,
        ease: "power2.out",
      }, "-=0.2");

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return <div ref={containerRef}>{children}</div>;
}

// ============================================================
// 2. 五行环充能动画
// ============================================================

const ELEMENT_COLORS: Record<Element, string> = {
  木: "#10b981",
  火: "#ef4444",
  土: "#f59e0b",
  金: "#64748b",
  水: "#3b82f6",
};

const ELEMENT_LABELS: Record<Element, string> = {
  木: "木",
  火: "火",
  土: "土",
  金: "金",
  水: "水",
};

interface ElementRingProps {
  chart: BaziChart;
  size?: number;
}

/**
 * 五行环充能动画组件
 *
 * 以圆环排列五行（木→火→土→金→水→木，按相生顺序），
 * 每个元素对应一段弧线，弧线长度代表该五行在命盘中的力量比例。
 * 页面加载时，弧线从 0 充能至目标值，配合发光效果。
 */
export function ElementRing({ chart, size = 200 }: ElementRingProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const counts = chart.elementCount;
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

  // 五行按相生顺序排列
  const elements: Element[] = ["木", "火", "土", "金", "水"];
  const segments = elements.map((el) => ({
    element: el,
    ratio: (counts[el] || 0) / total,
    color: ELEMENT_COLORS[el],
  }));

  const radius = size / 2 - 24;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const ctx = gsap.context(() => {
      const arcs = gsap.utils.toArray<SVGPathElement>("[data-element-arc]");
      const labels = gsap.utils.toArray<SVGTextElement>("[data-element-label]");
      const values = gsap.utils.toArray<SVGTextElement>("[data-element-value]");

      // 初始状态：弧线长度为0
      arcs.forEach((arc) => {
        const fullLength = parseFloat(arc.getAttribute("data-full-length") || "0");
        gsap.set(arc, {
          strokeDasharray: fullLength,
          strokeDashoffset: fullLength,
          opacity: 0,
        });
      });

      gsap.set(labels, { opacity: 0, scale: 0.5, transformOrigin: "center" });
      gsap.set(values, { opacity: 0 });

      const tl = gsap.timeline({ delay: 0.5 });

      // 充能动画：弧线从0增长到目标长度
      tl.to(arcs, {
        strokeDashoffset: 0,
        opacity: 1,
        duration: 1.2,
        stagger: 0.15,
        ease: "power2.out",
      });

      // 发光脉冲
      tl.to(arcs, {
        filter: "drop-shadow(0 0 6px currentColor)",
        duration: 0.4,
        stagger: 0.1,
        ease: "power1.inOut",
      }, "-=0.3");

      // 标签弹出
      tl.to(labels, {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        stagger: 0.1,
        ease: "back.out(2)",
      }, "-=0.8");

      // 数值淡入
      tl.to(values, {
        opacity: 1,
        duration: 0.3,
        stagger: 0.08,
        ease: "power2.out",
      }, "-=0.4");

    }, svgRef);

    return () => ctx.revert();
  }, []);

  // 计算每段弧的路径
  const center = size / 2;
  let currentAngle = -90; // 从顶部开始

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto"
    >
      {/* 背景圆环 */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(0,0,0,0.05)"
        strokeWidth={strokeWidth}
      />

      {/* 五行弧段 */}
      {segments.map((seg, i) => {
        const arcLength = seg.ratio * circumference;
        // 每段之间留一点间隙
        const gap = 4;
        const actualLength = Math.max(arcLength - gap, 2);
        const startAngle = currentAngle;
        const endAngle = startAngle + (seg.ratio * 360) - (gap / circumference) * 360;

        // 计算弧的起止点
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;
        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);
        const largeArc = seg.ratio > 0.5 ? 1 : 0;

        const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;

        // 标签位置（弧的中点）
        const midAngle = (startAngle + endAngle) / 2;
        const midRad = (midAngle * Math.PI) / 180;
        const labelR = radius + 16;
        const labelX = center + labelR * Math.cos(midRad);
        const labelY = center + labelR * Math.sin(midRad);

        // 数值位置（弧的内侧）
        const valueR = radius - 18;
        const valueX = center + valueR * Math.cos(midRad);
        const valueY = center + valueR * Math.sin(midRad);

        currentAngle = endAngle + (gap / circumference) * 360;

        return (
          <g key={i}>
            <path
              data-element-arc
              data-full-length={arcLength}
              d={pathData}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{ color: seg.color }}
            />
            <text
              data-element-label
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="14"
              fontWeight="700"
              fill={seg.color}
            >
              {ELEMENT_LABELS[seg.element]}
            </text>
            <text
              data-element-value
              x={valueX}
              y={valueY}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="10"
              fill="rgba(0,0,0,0.5)"
            >
              {Math.round(seg.ratio * 100)}%
            </text>
          </g>
        );
      })}

      {/* 中心日主标识 */}
      <text
        x={center}
        y={center - 6}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="12"
        fill="rgba(0,0,0,0.4)"
      >
        日主
      </text>
      <text
        x={center}
        y={center + 10}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="20"
        fontWeight="700"
        fill={ELEMENT_COLORS[chart.dayMasterElement]}
      >
        {chart.dayMaster}
      </text>
    </svg>
  );
}

// ============================================================
// 3. 大运轴自动滚动
// ============================================================

/**
 * 大运轴自动滚动至当前运位置
 *
 * 页面加载后，大运时间线自动滚动到当前年龄对应的运程位置，
 * 并对该运程卡片进行高亮脉冲动画。
 */
export function useDaYunScroll(containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const container = containerRef.current;
      if (!container) return;

      // 找到所有大运卡片
      const cards = container.querySelectorAll<HTMLElement>("[data-dayun-card]");
      if (cards.length === 0) return;

      // 找到当前运（标有 border-vermilion 的卡片）
      let currentCard: HTMLElement | null = null;
      for (const card of Array.from(cards)) {
        if (card.classList.contains("border-vermilion")) {
          currentCard = card;
        }
      }

      if (currentCard) {
        // 计算滚动位置
        const containerWidth = container.offsetWidth;
        const cardLeft = currentCard.offsetLeft;
        const cardWidth = currentCard.offsetWidth;
        const scrollTarget = Math.max(0, cardLeft - containerWidth / 2 + cardWidth / 2);

        // 平滑滚动（使用原生 scrollTo + GSAP 动画值插值）
        const startScroll = container.scrollLeft;
        gsap.to(
          { val: startScroll },
          {
            val: scrollTarget,
            duration: 1.2,
            delay: 0.8,
            ease: "power2.inOut",
            onUpdate: function () {
              container.scrollLeft = this.targets()[0].val;
            },
          }
        );

        // 当前运脉冲高亮
        gsap.fromTo(
          currentCard,
          {
            boxShadow: "0 0 0 0 rgba(185, 28, 28, 0.4)",
          },
          {
            boxShadow: "0 0 0 12px rgba(185, 28, 28, 0)",
            duration: 1.5,
            delay: 1.5,
            repeat: 2,
            ease: "power2.out",
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [containerRef]);
}
