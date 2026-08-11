"use client";

/**
 * ECharts 基础包装组件
 *
 * 客户端动态加载 ECharts，避免 SSR 问题。
 * 提供统一的主题色、字体、resize 防抖。
 */

import { useEffect, useRef, type ReactNode } from "react";
import * as echarts from "echarts";

// ============================================================
// 主题常量
// ============================================================

/** 现代东方配色 — 供各图表共用 */
export const CHART_COLORS = {
  // 五行色
  木: "#10b981",
  火: "#ef4444",
  土: "#f59e0b",
  金: "#64748b",
  水: "#3b82f6",
  // 主题色
  vermilion: "#b91c1c",
  jade: "#047857",
  gold: "#a16207",
  indigo: "#312e81",
  ink: "#1c1917",
  inkLight: "#78716c",
  inkLightest: "#a8a29e",
  paper: "#f7f3ed",
  paperDark: "#ede8de",
  border: "#d6d3d1",
  // 旺相休囚死色阶
  旺: "#b91c1c",
  相: "#10b981",
  休: "#64748b",
  囚: "#a16207",
  死: "#44403c",
};

/** ECharts 全局字体设置 */
const FONT_FAMILY = '"Noto Serif SC", "Source Han Serif SC", "STSong", serif, sans-serif';

// ============================================================
// 组件
// ============================================================

interface EChartsBaseProps {
  option: echarts.EChartsOption;
  height?: number;
  className?: string;
  /** 可选：在 option 基础上追加公共主题设置 */
  children?: ReactNode;
}

export default function EChartsBase({
  option,
  height = 300,
  className,
}: EChartsBaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 初始化图表
    chartRef.current = echarts.init(containerRef.current, undefined, {
      renderer: "svg",
    });

    // resize 防抖
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        chartRef.current?.resize();
      }, 150);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  // option 变化时更新
  useEffect(() => {
    if (!chartRef.current) return;

    // 注入公共主题设置
    const themedOption: echarts.EChartsOption = {
      ...option,
      textStyle: {
        fontFamily: FONT_FAMILY,
        color: CHART_COLORS.inkLight,
        ...option.textStyle,
      },
      backgroundColor: "transparent",
      ...option,
    };

    chartRef.current.setOption(themedOption, { notMerge: true });
  }, [option]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: `${height}px` }}
    />
  );
}
