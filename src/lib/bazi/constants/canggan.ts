// 地支藏干表（对应项目大纲11.6节，来源：《渊海子平》地支藏遁歌）
// 每个地支的本气、中气、余气及力量比例

export interface CangGanEntry {
  branch: string;
  benQi?: string;   // 本气
  zhongQi?: string; // 中气
  yuQi?: string;    // 余气
  ratios: { stem: string; role: '本气' | '中气' | '余气'; ratio: number }[];
}

export const CANGGAN: CangGanEntry[] = [
  { branch: '子', benQi: '癸', ratios: [{ stem: '癸', role: '本气', ratio: 1.0 }] },
  { branch: '丑', benQi: '己', zhongQi: '癸', yuQi: '辛', ratios: [
    { stem: '己', role: '本气', ratio: 0.60 },
    { stem: '癸', role: '中气', ratio: 0.25 },
    { stem: '辛', role: '余气', ratio: 0.15 }
  ]},
  { branch: '寅', benQi: '甲', zhongQi: '丙', yuQi: '戊', ratios: [
    { stem: '甲', role: '本气', ratio: 0.60 },
    { stem: '丙', role: '中气', ratio: 0.25 },
    { stem: '戊', role: '余气', ratio: 0.15 }
  ]},
  { branch: '卯', benQi: '乙', ratios: [{ stem: '乙', role: '本气', ratio: 1.0 }] },
  { branch: '辰', benQi: '戊', zhongQi: '乙', yuQi: '癸', ratios: [
    { stem: '戊', role: '本气', ratio: 0.60 },
    { stem: '乙', role: '中气', ratio: 0.25 },
    { stem: '癸', role: '余气', ratio: 0.15 }
  ]},
  { branch: '巳', benQi: '丙', zhongQi: '戊', yuQi: '庚', ratios: [
    { stem: '丙', role: '本气', ratio: 0.60 },
    { stem: '戊', role: '中气', ratio: 0.25 },
    { stem: '庚', role: '余气', ratio: 0.15 }
  ]},
  { branch: '午', benQi: '丁', zhongQi: '己', ratios: [
    { stem: '丁', role: '本气', ratio: 0.70 },
    { stem: '己', role: '中气', ratio: 0.30 }
  ]},
  { branch: '未', benQi: '己', zhongQi: '丁', yuQi: '乙', ratios: [
    { stem: '己', role: '本气', ratio: 0.60 },
    { stem: '丁', role: '中气', ratio: 0.25 },
    { stem: '乙', role: '余气', ratio: 0.15 }
  ]},
  { branch: '申', benQi: '庚', zhongQi: '壬', yuQi: '戊', ratios: [
    { stem: '庚', role: '本气', ratio: 0.60 },
    { stem: '壬', role: '中气', ratio: 0.25 },
    { stem: '戊', role: '余气', ratio: 0.15 }
  ]},
  { branch: '酉', benQi: '辛', ratios: [{ stem: '辛', role: '本气', ratio: 1.0 }] },
  { branch: '戌', benQi: '戊', zhongQi: '辛', yuQi: '丁', ratios: [
    { stem: '戊', role: '本气', ratio: 0.60 },
    { stem: '辛', role: '中气', ratio: 0.25 },
    { stem: '丁', role: '余气', ratio: 0.15 }
  ]},
  { branch: '亥', benQi: '壬', zhongQi: '甲', ratios: [
    { stem: '壬', role: '本气', ratio: 0.70 },
    { stem: '甲', role: '中气', ratio: 0.30 }
  ]}
];

// 快速查找：地支→藏干列表
export const CANGGAN_MAP: Record<string, string[]> = Object.fromEntries(
  CANGGAN.map(entry => [entry.branch, entry.ratios.map(r => r.stem)])
);

// 人元司令分野（对应项目大纲11.5节）
// 来源：《三命通会》卷一·论人元司事原文（参考来源6.10）
export interface RenYuanEntry {
  month: string;      // 月支
  monthName: string;   // 月名
  segments: { stem: string; days: number; note?: string }[];
  totalDays: number;
}

export const RENYUAN_SILING: RenYuanEntry[] = [
  { month: '寅', monthName: '正月', segments: [
    { stem: '戊', days: 5, note: '艮土用事' },
    { stem: '丙', days: 5, note: '丙火长生' },
    { stem: '甲', days: 20 }
  ], totalDays: 30 },
  { month: '卯', monthName: '二月', segments: [
    { stem: '甲', days: 7 },
    { stem: '乙', days: 23 }
  ], totalDays: 30 },
  { month: '辰', monthName: '三月', segments: [
    { stem: '乙', days: 7 },
    { stem: '壬', days: 5, note: '壬水墓库' },
    { stem: '戊', days: 18 }
  ], totalDays: 30 },
  { month: '巳', monthName: '四月', segments: [
    { stem: '戊', days: 7 },
    { stem: '庚', days: 5, note: '庚金长生' },
    { stem: '丙', days: 18 }
  ], totalDays: 30 },
  { month: '午', monthName: '五月', segments: [
    { stem: '丙', days: 7 },
    { stem: '丁', days: 23 }
  ], totalDays: 30 },
  { month: '未', monthName: '六月', segments: [
    { stem: '丁', days: 7 },
    { stem: '甲', days: 5, note: '甲木墓库' },
    { stem: '己', days: 18 }
  ], totalDays: 30 },
  { month: '申', monthName: '七月', segments: [
    { stem: '戊', days: 5, note: '坤土用事' },
    { stem: '壬', days: 5, note: '壬水长生' },
    { stem: '庚', days: 20 }
  ], totalDays: 30 },
  { month: '酉', monthName: '八月', segments: [
    { stem: '庚', days: 7 },
    { stem: '辛', days: 23 }
  ], totalDays: 30 },
  { month: '戌', monthName: '九月', segments: [
    { stem: '辛', days: 7 },
    { stem: '丙', days: 5, note: '丙火墓库' },
    { stem: '戊', days: 18 }
  ], totalDays: 30 },
  { month: '亥', monthName: '十月', segments: [
    { stem: '戊', days: 5 },
    { stem: '甲', days: 5, note: '甲木长生' },
    { stem: '壬', days: 20 }
  ], totalDays: 30 },
  { month: '子', monthName: '十一月', segments: [
    { stem: '壬', days: 7 },
    { stem: '癸', days: 23 }
  ], totalDays: 30 },
  { month: '丑', monthName: '十二月', segments: [
    { stem: '癸', days: 7 },
    { stem: '庚', days: 5, note: '庚金墓库' },
    { stem: '己', days: 18 }
  ], totalDays: 30 }
];
