"use client";

/**
 * 大运时间线图
 *
 * 以横向时间轴展示八步大运（80年），标注每步干支、起运年龄、流年。
 * 当前大运高亮显示。
 */

import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import EChartsBase, { CHART_COLORS } from "./echarts-base";
import type { BaziChart, DaYun } from "@/lib/engine/types";
import { STEM_ELEMENT } from "@/lib/engine/constants";

interface DaYunTimelineProps {
  chart: BaziChart;
  height?: number;
}

export default function DaYunTimeline({ chart, height = 280 }: DaYunTimelineProps) {
  const option = useMemo<EChartsOption>(() => {
    const steps = chart.daYun.steps;
    const direction = chart.daYun.direction;
    const birthYear = chart.input.year;

    // 当前年龄 → 判断当前大运
    const currentYear = new Date().getFullYear();
    const currentAge = currentYear - birthYear;

    // 构建 scatter 数据
    const scatterData = steps.map((step: DaYun, idx: number) => {
      const el = STEM_ELEMENT[step.pillar.stem];
      const isCurrent =
        currentAge >= step.startAge && currentAge < step.startAge + 10;
      return {
        value: [step.startAge, idx, step.pillar.ganzhi, el],
        itemStyle: {
          color: isCurrent ? CHART_COLORS.vermilion : (CHART_COLORS[el] as string),
          borderColor: isCurrent ? CHART_COLORS.vermilion : "transparent",
          borderWidth: isCurrent ? 3 : 0,
          shadowBlur: isCurrent ? 15 : 0,
          shadowColor: isCurrent ? "rgba(185,28,28,0.4)" : "transparent",
        },
        symbolSize: isCurrent ? 28 : 22,
      };
    });

    // 构建连线数据
    const lineData = steps.map((step: DaYun) => [step.startAge, 0]);

    return {
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          const v: [number, number, string, string] = params.value;
          if (!v) return "";
          const age = v[0];
          const ganzhi = v[2];
          const el = v[3];
          const startYear = birthYear + age;
          const endYear = startYear + 10;
          return `<b style="font-size:15px">${ganzhi}</b>（${el}）<br/>起运: ${age}岁<br/>流年: ${startYear}年—${endYear}年`;
        },
        backgroundColor: "rgba(247, 243, 237, 0.95)",
        borderColor: CHART_COLORS.border,
        textStyle: { color: CHART_COLORS.ink, fontSize: 13 },
      },
      grid: {
        left: 50,
        right: 30,
        top: 30,
        bottom: 50,
      },
      xAxis: {
        type: "value",
        min: 0,
        max: 80,
        interval: 10,
        name: "年龄",
        nameLocation: "middle",
        nameGap: 30,
        nameTextStyle: {
          color: CHART_COLORS.inkLight,
          fontSize: 12,
        },
        axisLine: { lineStyle: { color: CHART_COLORS.border } },
        axisLabel: { color: CHART_COLORS.inkLight, fontSize: 11 },
        splitLine: {
          lineStyle: {
            color: CHART_COLORS.border,
            type: "dashed" as const,
            opacity: 0.5,
          },
        },
      },
      yAxis: {
        type: "value",
        min: -1,
        max: steps.length,
        show: false,
      },
      series: [
        // 连接线
        {
          type: "line",
          data: lineData,
          symbol: "none",
          lineStyle: {
            color: CHART_COLORS.border,
            width: 2,
            type: "dashed" as const,
          },
          silent: true,
        },
        // 大运节点
        {
          type: "scatter",
          data: scatterData,
          symbol: "circle",
          label: {
            show: true,
            formatter: (params: any) =>
              params.value?.[2] || "",
            position: "top",
            fontSize: 12,
            fontWeight: 700,
            color: CHART_COLORS.ink,
          },
          emphasis: {
            scale: 1.3,
            label: { fontSize: 14 },
          },
        },
        // 方向标注
        {
          type: "scatter",
          data: [
            {
              value: [75, steps.length - 0.5, "", ""],
              label: {
                show: true,
                formatter: `${direction}行`,
                position: "right",
                fontSize: 14,
                fontWeight: 700,
                color: direction === "顺" ? CHART_COLORS.jade : CHART_COLORS.vermilion,
              },
              symbolSize: 0,
            },
          ],
          silent: true,
        },
      ],
    };
  }, [chart]);

  return <EChartsBase option={option} height={height} />;
}
