/**
 * localStorage 命盘存储工具
 *
 * 存储格式：命盘ID → { name, input, chart, savedAt }
 */

const STORAGE_KEY = "bazi-charts";

export interface SavedChart {
  id: string;
  name: string;
  input: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    gender: "男" | "女";
    longitude: number;
    birthPlace?: string;
    enableNightZi?: boolean;
  };
  savedAt: string;
}

export function getSavedCharts(): SavedChart[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as SavedChart[];
  } catch {
    return [];
  }
}

export function saveChart(chart: SavedChart): void {
  if (typeof window === "undefined") return;
  const charts = getSavedCharts();
  const existingIdx = charts.findIndex((c) => c.id === chart.id);
  if (existingIdx >= 0) {
    charts[existingIdx] = chart;
  } else {
    charts.push(chart);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
}

export function deleteChart(id: string): void {
  if (typeof window === "undefined") return;
  const charts = getSavedCharts().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
}

export function renameChart(id: string, name: string): void {
  if (typeof window === "undefined") return;
  const charts = getSavedCharts();
  const chart = charts.find((c) => c.id === id);
  if (chart) {
    chart.name = name;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
  }
}
