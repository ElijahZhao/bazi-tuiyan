"use client";

/**
 * 五行能量雷达图
 *
 * 以雷达图展示八字四柱+藏干的五行分布比例。
 * 叠加日主五行高亮，直观显示五行强弱。
 */

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import EChartsBase, { CHART_COLORS } from "./echarts-base";
import type { BaziChart } from "@/lib/engine/types";
import type { Element } from "@/lib/engine/types";

interface ElementRadarProps {
  chart: BaziChart;
  height?: number;
}

const ELEMENTS: Element[] = ["木", "火", "土", "金", "水"];

export default function ElementRadar({ chart, height = 320 }: ElementRadarProps) {
  const option = useMemo<EChartsOption>(() => {
    const counts = chart.elementCount;
    const total = ELEMENTS.reduce((sum, el) => sum + (counts[el] || 0), 0) || 1;

    // 归一化到 0-100
    const values = ELEMENTS.map((el) => {
      const count = counts[el] || 0;
      return Math.round((count / total) * 100);
    });

    // 日主五行高亮
    const dayMasterElement = chart.dayMasterElement;
    const maxVal = Math.max(...values, 20);

    return {
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          const idx: number = params.dataIndex ?? 0;
          const el = ELEMENTS[idx] || "";
          const count = counts[el] || 0;
          const pct = Math.round((count / total) * 100);
          const isDayMaster = el === dayMasterElement;
          return `<b>${el}</b>行<br/>数量: ${count}<br/>占比: ${pct}%${isDayMaster ? "<br/>⭐ 日主五行" : ""}`;
        },
        backgroundColor: "rgba(247, 243, 237, 0.95)",
        borderColor: CHART_COLORS.border,
        textStyle: { color: CHART_COLORS.ink, fontSize: 13 },
      },
      radar: {
        indicator: ELEMENTS.map((el) => ({
          name: el,
          max: Math.ceil(maxVal / 10) * 10 + 10,
          color: CHART_COLORS[el] as string,
        })),
        center: ["50%", "55%"],
        radius: "65%",
        splitNumber: 4,
        axisName: {
          fontSize: 16,
          fontWeight: 700,
          color: CHART_COLORS.ink,
          padding: [3, 5],
        },
        splitLine: {
          lineStyle: { color: CHART_COLORS.border, width: 1 },
        },
        splitArea: {
          areaStyle: {
            color: ["rgba(247,243,237,0.3)", "rgba(237,232,222,0.3)"],
          },
        },
        axisLine: {
          lineStyle: { color: CHART_COLORS.border },
        },
      },
      series: [
        {
          type: "radar",
          data: [
            {
              value: values,
              name: "五行分布",
              areaStyle: {
                color: {
                  type: "radial",
                  x: 0.5,
                  y: 0.5,
                  r: 0.7,
                  colorStops: [
                    { offset: 0, color: "rgba(185, 28, 28, 0.15)" },
                    { offset: 1, color: "rgba(185, 28, 28, 0.35)" },
                  ],
                },
              },
              lineStyle: {
                color: CHART_COLORS.vermilion,
                width: 2,
              },
              itemStyle: {
                color: (params: any) => {
                  const el = ELEMENTS[params.dataIndex ?? 0];
                  return (CHART_COLORS[el] as string) || CHART_COLORS.vermilion;
                },
              },
              symbolSize: 8,
            },
          ],
        },
      ],
    };
  }, [chart]);

  return <EChartsBase option={option} height={height} />;
}
