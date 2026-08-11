"use client";

/**
 * 五行旺相休囚死热力图
 *
 * 以热力矩阵展示五季×五行的旺相休囚死状态，
 * 高亮当前季节行和日主五行列。
 */

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import EChartsBase, { CHART_COLORS } from "./echarts-base";
import type { BaziChart } from "@/lib/engine/types";
import type { Element } from "@/lib/engine/types";
import { STEM_ELEMENT } from "@/lib/engine/constants";

interface WangShuaiHeatmapProps {
  chart: BaziChart;
  height?: number;
}

const ELEMENTS: Element[] = ["木", "火", "土", "金", "水"];
const SEASONS = ["春（寅卯辰）", "夏（巳午未）", "秋（申酉戌）", "冬（亥子丑）", "四季月（辰戌丑未）"];

// 旺相休囚死映射表（当令者旺，令生者相，生令者休，克令者囚，令克者死）
const WANG_SHUAI_MAP: Record<string, Record<Element, "旺" | "相" | "休" | "囚" | "死">> = {
  "春（寅卯辰）": { 木: "旺", 火: "相", 水: "休", 金: "囚", 土: "死" },
  "夏（巳午未）": { 火: "旺", 土: "相", 木: "休", 水: "囚", 金: "死" },
  "秋（申酉戌）": { 金: "旺", 水: "相", 土: "休", 火: "囚", 木: "死" },
  "冬（亥子丑）": { 水: "旺", 木: "相", 金: "休", 土: "囚", 火: "死" },
  "四季月（辰戌丑未）": { 土: "旺", 金: "相", 火: "休", 木: "囚", 水: "死" },
};

const STATUS_COLORS: Record<string, string> = {
  旺: CHART_COLORS.旺,
  相: CHART_COLORS.相,
  休: CHART_COLORS.休,
  囚: CHART_COLORS.囚,
  死: CHART_COLORS.死,
};

const STATUS_VALUES: Record<string, number> = {
  旺: 5,
  相: 4,
  休: 3,
  囚: 2,
  死: 1,
};

export default function WangShuaiHeatmap({ chart, height = 280 }: WangShuaiHeatmapProps) {
  const option = useMemo<EChartsOption>(() => {
    const dayMasterElement = chart.dayMasterElement;

    // 根据月支判断当前季节
    const monthBranch = chart.fourPillars.month.branch;
    let currentSeasonIdx = 0;
    if (["寅", "卯", "辰"].includes(monthBranch)) currentSeasonIdx = 0;
    else if (["巳", "午", "未"].includes(monthBranch)) currentSeasonIdx = 1;
    else if (["申", "酉", "戌"].includes(monthBranch)) currentSeasonIdx = 2;
    else if (["亥", "子", "丑"].includes(monthBranch)) currentSeasonIdx = 3;

    // 四季月特殊处理：辰戌丑未本身是四季月
    if (["辰", "戌", "丑", "未"].includes(monthBranch)) currentSeasonIdx = 4;

    // 构建热力图数据
    const heatmapData: [number, number, number, string][] = [];
    for (let seasonIdx = 0; seasonIdx < SEASONS.length; seasonIdx++) {
      const season = SEASONS[seasonIdx];
      const statusMap = WANG_SHUAI_MAP[season];
      for (let elIdx = 0; elIdx < ELEMENTS.length; elIdx++) {
        const el = ELEMENTS[elIdx];
        const status = statusMap[el];
        heatmapData.push([elIdx, seasonIdx, STATUS_VALUES[status], status]);
      }
    }

    return {
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          const v: [number, number, number, string] = params.value;
          if (!v) return "";
          const el = ELEMENTS[v[0]];
          const season = SEASONS[v[1]];
          const status = v[3];
          const isDayMaster = el === dayMasterElement;
          return `<b>${season}</b><br/>${el}行 → <b style="color:${STATUS_COLORS[status]}">${status}</b>${isDayMaster ? "<br/>⭐ 日主五行" : ""}`;
        },
        backgroundColor: "rgba(247, 243, 237, 0.95)",
        borderColor: CHART_COLORS.border,
        textStyle: { color: CHART_COLORS.ink, fontSize: 13 },
      },
      grid: {
        left: 120,
        right: 30,
        top: 20,
        bottom: 40,
      },
      xAxis: {
        type: "category",
        data: ELEMENTS,
        splitArea: { show: true },
        axisLine: { lineStyle: { color: CHART_COLORS.border } },
        axisLabel: {
          color: (value: any) =>
            value === dayMasterElement ? CHART_COLORS.vermilion : CHART_COLORS.inkLight,
          fontSize: 14,
          fontWeight: 700,
        },
      },
      yAxis: {
        type: "category",
        data: SEASONS,
        splitArea: { show: true },
        axisLine: { lineStyle: { color: CHART_COLORS.border } },
        axisLabel: {
          color: CHART_COLORS.inkLight,
          fontSize: 11,
        },
      },
      visualMap: {
        min: 1,
        max: 5,
        show: false,
        inRange: {
          color: [STATUS_COLORS.死, STATUS_COLORS.囚, STATUS_COLORS.休, STATUS_COLORS.相, STATUS_COLORS.旺],
        },
      },
      series: [
        {
          type: "heatmap",
          data: heatmapData,
          label: {
            show: true,
            formatter: (params: any) =>
              params.value?.[3] || "",
            fontSize: 16,
            fontWeight: 700,
            color: "#fff",
            textShadowBlur: 2,
            textShadowColor: "rgba(0,0,0,0.3)",
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0,0,0,0.3)",
            },
          },
          // 当前季节行高亮边框
          markArea: undefined,
        },
      ],
      // 当前季节标注
      graphic: [
        {
          type: "text",
          right: 10,
          top: 5,
          style: {
            text: `当前: ${SEASONS[currentSeasonIdx]}`,
            fontSize: 12,
            fontWeight: 600,
            fill: CHART_COLORS.vermilion,
          },
        },
      ],
    };
  }, [chart]);

  return <EChartsBase option={option} height={height} />;
}
