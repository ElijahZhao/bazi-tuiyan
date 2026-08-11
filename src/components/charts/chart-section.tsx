"use client";

/**
 * 可视化图表区
 *
 * 命盘展示页第五区：四类 ECharts 图表
 * ① 五行能量雷达图
 * ② 大运时间线
 * ③ 五行旺相休囚死热力图
 * ④ 十二长生状态图
 */

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import type { BaziChart } from "@/lib/engine/types";

// 动态加载图表组件（避免 ECharts SSR 问题）
const ElementRadar = dynamic(() => import("./element-radar"), { ssr: false });
const DaYunTimeline = dynamic(() => import("./dayun-timeline"), { ssr: false });
const WangShuaiHeatmap = dynamic(() => import("./wangshuai-heatmap"), { ssr: false });
const ChangShengChart = dynamic(() => import("./changsheng-chart"), { ssr: false });

interface ChartSectionProps {
  chart: BaziChart;
}

export default function ChartSection({ chart }: ChartSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="ink-card p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="seal-tag bg-gold text-white">可视化</span>
        <span className="heading-font text-base text-ink">五行能量 · 大运走势 · 旺衰矩阵 · 长生状态</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 五行能量雷达图 */}
        <div className="rounded-lg border border-border bg-paper/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="seal-tag bg-vermilion text-white">五行能量</span>
            <span className="text-xs text-ink-lighter">四柱+藏干五行分布</span>
          </div>
          <ElementRadar chart={chart} height={300} />
        </div>

        {/* 大运时间线 */}
        <div className="rounded-lg border border-border bg-paper/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="seal-tag bg-jade text-white">大运时间线</span>
            <span className="text-xs text-ink-lighter">
              {chart.daYun.direction}行 · 起运 {chart.daYun.startAge}岁
            </span>
          </div>
          <DaYunTimeline chart={chart} height={280} />
        </div>

        {/* 五行旺相休囚死热力图 */}
        <div className="rounded-lg border border-border bg-paper/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="seal-tag bg-gold text-white">旺相休囚死</span>
            <span className="text-xs text-ink-lighter">五季×五行状态矩阵</span>
          </div>
          <WangShuaiHeatmap chart={chart} height={280} />
        </div>

        {/* 十二长生状态图 */}
        <div className="rounded-lg border border-border bg-paper/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="seal-tag bg-indigo-deep text-white">十二长生</span>
            <span className="text-xs text-ink-lighter">四柱在十二宫的位置</span>
          </div>
          <ChangShengChart chart={chart} height={300} />
        </div>
      </div>

      {/* 图例说明 */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-lightest">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#b91c1c" }} />
            旺（最强）
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#10b981" }} />
            相（次强）
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#64748b" }} />
            休（休养）
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#a16207" }} />
            囚（受困）
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#44403c" }} />
            死（最弱）
          </span>
        </div>
      </div>
    </motion.div>
  );
}
