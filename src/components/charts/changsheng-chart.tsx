"use client";

/**
 * 十二长生状态图
 *
 * 以环形进度图展示四柱在十二长生中的状态位置。
 * 十二宫按顺序排列，高亮四柱所在位置。
 */

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import EChartsBase, { CHART_COLORS } from "./echarts-base";
import type { BaziChart, ChangShengState } from "@/lib/engine/types";

interface ChangShengChartProps {
  chart: BaziChart;
  height?: number;
}

const TWELVE_STAGES: ChangShengState[] = [
  "长生", "沐浴", "冠带", "临官", "帝旺",
  "衰", "病", "死", "墓", "绝", "胎", "养",
];

// 十二长生状态颜色（旺→衰渐变）
const STAGE_COLORS: Record<ChangShengState, string> = {
  长生: "#10b981",
  沐浴: "#34d399",
  冠带: "#6ee7b7",
  临官: "#047857",
  帝旺: "#b91c1c",
  衰: "#a16207",
  病: "#854d0e",
  死: "#78716c",
  墓: "#57534e",
  绝: "#44403c",
  胎: "#312e81",
  养: "#4f46e5",
};

export default function ChangShengChart({ chart, height = 300 }: ChangShengChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const pillars = [
      { label: "年柱", stage: chart.lifeStages.year, stem: chart.fourPillars.year.stem, branch: chart.fourPillars.year.branch },
      { label: "月柱", stage: chart.lifeStages.month, stem: chart.fourPillars.month.stem, branch: chart.fourPillars.month.branch },
      { label: "日柱", stage: chart.lifeStages.day, stem: chart.fourPillars.day.stem, branch: chart.fourPillars.day.branch },
      { label: "时柱", stage: chart.lifeStages.hour, stem: chart.fourPillars.hour.stem, branch: chart.fourPillars.hour.branch },
    ];

    // 构建环形数据：每个柱子在十二长生中的位置
    const ringData = TWELVE_STAGES.map((stage, idx) => {
      // 找出哪些柱子在这个状态
      const matchingPillars = pillars.filter((p) => p.stage === stage);
      const count = matchingPillars.length;

      return {
        value: 1, // 每个阶段等宽
        name: stage,
        idx,
        itemStyle: {
          color: count > 0 ? STAGE_COLORS[stage] : CHART_COLORS.paperDark,
          borderColor: count > 0 ? STAGE_COLORS[stage] : "transparent",
          borderWidth: count > 0 ? 2 : 0,
          opacity: count > 0 ? 1 : 0.4,
        },
        label: {
          show: true,
          formatter: stage,
          color: count > 0 ? "#fff" : CHART_COLORS.inkLightest,
          fontSize: 11,
          fontWeight: count > 0 ? 700 : 400,
        },
      };
    });

    return {
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          const stageName: string = params.data?.name || params.name || "";
          const matching = pillars.filter((p) => p.stage === stageName);
          if (matching.length === 0) {
            return `${stageName}（无柱在此宫）`;
          }
          const pillarText = matching.map((p) => `${p.label}: ${p.stem}${p.branch}`).join("<br/>");
          return `<b>${stageName}</b><br/>${pillarText}`;
        },
        backgroundColor: "rgba(247, 243, 237, 0.95)",
        borderColor: CHART_COLORS.border,
        textStyle: { color: CHART_COLORS.ink, fontSize: 13 },
      },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          center: ["50%", "50%"],
          data: ringData,
          label: {
            position: "inside",
            rotate: 0,
          },
          labelLine: { show: false },
          emphasis: {
            scale: true,
            scaleSize: 8,
            itemStyle: {
              shadowBlur: 15,
              shadowColor: "rgba(0,0,0,0.2)",
            },
          },
          // 中间显示日柱状态
          markPoint: undefined,
        },
      ],
      graphic: [
        {
          type: "text",
          left: "center",
          top: "center",
          style: {
            text: [
              `日柱: ${pillars[2].stem}${pillars[2].branch}`,
              pillars[2].stage,
            ].join("\n"),
            textAlign: "center",
            fontSize: 14,
            fontWeight: 700,
            fill: STAGE_COLORS[pillars[2].stage] || CHART_COLORS.ink,
            lineHeight: 20,
          },
        },
      ],
    };
  }, [chart]);

  return <EChartsBase option={option} height={height} />;
}
