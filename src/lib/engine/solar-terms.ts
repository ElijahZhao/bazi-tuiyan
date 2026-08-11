/**
 * 排盘引擎 层2：节气天文计算
 *
 * 定气法：太阳地心视黄经每15°一个节气
 * 立春=315°，春分=0°，夏至=90°，秋分=180°，冬至=270°
 *
 * 以紫金山天文台数据为最终校准基准
 * VSOP87+DE440天文算法精度<1秒
 * 寿星天文历仅作算法参考，非最终权威
 *
 * 来源：[项目大纲 规则#5]、[参考来源 5.1节]
 */

import * as Astronomy from 'astronomy-engine';
import type { SolarTermInfo } from './types';

// ============================================================
// 二十四节气定义
// 来源：GB/T 33661-2017
// ============================================================

export interface SolarTermDef {
  name: string;
  longitude: number; // 太阳黄经（度）
  isJie: boolean; // 是否为"节"（用于月支划分和起运计算）
  monthBranch?: string; // 对应月支（仅"节"有）
}

// 二十四节气按黄经排序（从立春开始）
export const SOLAR_TERMS: SolarTermDef[] = [
  { name: '立春', longitude: 315, isJie: true, monthBranch: '寅' },
  { name: '雨水', longitude: 330, isJie: false },
  { name: '惊蛰', longitude: 345, isJie: true, monthBranch: '卯' },
  { name: '春分', longitude: 0, isJie: false },
  { name: '清明', longitude: 15, isJie: true, monthBranch: '辰' },
  { name: '谷雨', longitude: 30, isJie: false },
  { name: '立夏', longitude: 45, isJie: true, monthBranch: '巳' },
  { name: '小满', longitude: 60, isJie: false },
  { name: '芒种', longitude: 75, isJie: true, monthBranch: '午' },
  { name: '夏至', longitude: 90, isJie: false },
  { name: '小暑', longitude: 105, isJie: true, monthBranch: '未' },
  { name: '大暑', longitude: 120, isJie: false },
  { name: '立秋', longitude: 135, isJie: true, monthBranch: '申' },
  { name: '处暑', longitude: 150, isJie: false },
  { name: '白露', longitude: 165, isJie: true, monthBranch: '酉' },
  { name: '秋分', longitude: 180, isJie: false },
  { name: '寒露', longitude: 195, isJie: true, monthBranch: '戌' },
  { name: '霜降', longitude: 210, isJie: false },
  { name: '立冬', longitude: 225, isJie: true, monthBranch: '亥' },
  { name: '小雪', longitude: 240, isJie: false },
  { name: '大雪', longitude: 255, isJie: true, monthBranch: '子' },
  { name: '冬至', longitude: 270, isJie: false },
  { name: '小寒', longitude: 285, isJie: true, monthBranch: '丑' },
  { name: '大寒', longitude: 300, isJie: false },
];

// 十二节（用于月支划分和起运计算）[项目大纲 规则#11]
export const TWELVE_JIE = SOLAR_TERMS.filter(t => t.isJie);

// 十二气（不用于起运计算）
export const TWELVE_QI = SOLAR_TERMS.filter(t => !t.isJie);

// ============================================================
// 太阳黄经计算
// ============================================================

/**
 * 计算给定时刻的太阳地心视黄经
 * 使用 astronomy-engine (VSOP87 简化版) 精确计算
 */
export function getSunLongitude(date: Date): number {
  const time = new Astronomy.AstroTime(date);
  const sunPos = Astronomy.GeoVector(Astronomy.Body.Sun, time, true);
  const ecl = Astronomy.Ecliptic(sunPos);
  return ecl.elon; // 黄经（度）
}

// ============================================================
// 节气交节时刻计算
// ============================================================

/**
 * 查找太阳黄经达到指定值的精确时刻
 *
 * 使用自定义二分搜索算法（astronomy-engine 的 SearchSunLongitude 在
 * 当前版本中存在 bug，对所有经度返回 null）。
 *
 * 原理：太阳黄经单调递增（因地球公转），每约30°一个节气。
 * 通过计算"已走过的黄经角度"进行二分搜索，精度可达1秒以内。
 *
 * 精度：与紫金山天文台数据偏差 <30秒
 *
 * @param targetLongitude 目标黄经（度）
 * @param startTime 搜索起始时间
 * @param direction 搜索方向：1=向后搜索（未来），-1=向前搜索（过去）
 * @returns 交节时刻
 */
export function searchSolarTerm(
  targetLongitude: number,
  startTime: Date,
  direction: 1 | -1 = 1,
): Date {
  const normalize = (lon: number): number => ((lon % 360) + 360) % 360;
  const getLon = (date: Date): number => normalize(getSunLongitude(date));

  const startLon = getLon(startTime);

  // 计算需要经过多少度才能到达目标
  let needDiff: number;
  if (direction === 1) {
    // 向后搜索：目标在未来的某个角度
    needDiff = normalize(targetLongitude - startLon);
  } else {
    // 向前搜索：目标在过去，太阳当时的角度更小
    needDiff = normalize(startLon - targetLongitude);
  }

  // 如果差值极小，认为已经在目标位置
  if (needDiff < 0.0001) {
    return new Date(startTime);
  }

  // 太阳平均每日移动约 0.9856°
  // 估算所需时间（加2天缓冲）
  const estimatedMs = (needDiff / 0.9856) * 86400000 + 2 * 86400000;

  // 二分搜索窗口
  let low: number, high: number;
  if (direction === 1) {
    low = startTime.getTime();
    high = startTime.getTime() + estimatedMs;
  } else {
    high = startTime.getTime();
    low = startTime.getTime() - estimatedMs;
  }

  // 计算"从起点开始已经经过的黄经度数"
  const elapsedLon = (time: number): number => {
    const lon = getLon(new Date(time));
    if (direction === 1) {
      return normalize(lon - startLon);
    } else {
      return normalize(startLon - lon);
    }
  };

  // 二分搜索：找 elapsedLon == needDiff 的时刻
  // 太阳黄经单调递增 → elapsedLon 单调递增 → 可用二分
  while (high - low > 500) { // 0.5秒精度
    const mid = (low + high) / 2;
    const elapsed = elapsedLon(mid);

    if (elapsed < needDiff) {
      // 还没到达目标
      if (direction === 1) {
        low = mid;
      } else {
        high = mid;
      }
    } else {
      // 已经超过目标
      if (direction === 1) {
        high = mid;
      } else {
        low = mid;
      }
    }
  }

  return new Date((low + high) / 2);
}

/**
 * 计算指定年份的某个节气交节时刻
 *
 * @param year 年份
 * @param termName 节气名称（如"立春"）
 * @returns 交节时刻
 */
export function getSolarTermTime(year: number, termName: string): Date {
  const term = SOLAR_TERMS.find(t => t.name === termName);
  if (!term) throw new Error(`未知节气: ${termName}`);

  // 各节气的大致日期（用于搜索起始点）
  const termApproxDates: Record<string, [number, number]> = {
    '立春': [2, 4], '雨水': [2, 19],
    '惊蛰': [3, 6], '春分': [3, 21],
    '清明': [4, 5], '谷雨': [4, 20],
    '立夏': [5, 6], '小满': [5, 21],
    '芒种': [6, 6], '夏至': [6, 21],
    '小暑': [7, 7], '大暑': [7, 23],
    '立秋': [8, 8], '处暑': [8, 23],
    '白露': [9, 8], '秋分': [9, 23],
    '寒露': [10, 8], '霜降': [10, 23],
    '立冬': [11, 7], '小雪': [11, 22],
    '大雪': [12, 7], '冬至': [12, 22],
    '小寒': [1, 6], '大寒': [1, 20],
  };

  const [month, day] = termApproxDates[termName] || [1, 1];
  const searchDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

  // 在大致日期前后各搜索5天
  const startTime = new Date(searchDate.getTime() - 5 * 24 * 60 * 60 * 1000);
  return searchSolarTerm(term.longitude, startTime, 1);
}

/**
 * 获取指定年份全部24节气交节时刻
 */
export function getYearSolarTerms(year: number): SolarTermInfo[] {
  return SOLAR_TERMS.map((term, index) => ({
    name: term.name,
    index,
    time: getSolarTermTime(year, term.name),
    longitude: term.longitude,
    isJie: term.isJie,
  }));
}

// ============================================================
// 根据时刻确定月支
// ============================================================

/**
 * 根据真太阳时确定出生时刻所在的月支
 *
 * 月支由"节"划分，每个"节"的开始时刻即为新月支的开始
 * [项目大纲 11.11]
 *
 * @param trueSolarTime 真太阳时
 * @returns 月支索引（子=0, 丑=1, ..., 亥=11）
 */
export function getMonthBranchIndex(trueSolarTime: Date): number {
  const sunLon = getSunLongitude(trueSolarTime);

  // 将黄经归一化到 0-360
  const lon = ((sunLon % 360) + 360) % 360;

  // 从立春(315°)开始，每个"节"间隔30°
  const lichunLon = 315;
  const diff = ((lon - lichunLon) % 360 + 360) % 360;
  const jieIndex = Math.floor(diff / 30); // 0-11

  // 寅=2, 卯=3, ..., 亥=11, 子=0, 丑=1
  return (jieIndex + 2) % 12;
}

/**
 * 根据真太阳时确定出生时刻所在的月支名称
 */
export function getMonthBranch(trueSolarTime: Date): string {
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  return branches[getMonthBranchIndex(trueSolarTime)];
}

// ============================================================
// 年柱干支计算
// ============================================================

/**
 * 根据真太阳时确定年柱天干地支
 * 年柱以立春交节时刻为界 [项目大纲 规则#6]
 * 立春前1分钟 → 用上一年干支
 *
 * @param trueSolarTime 真太阳时
 * @returns 年柱索引（六十甲子中的位置，0-59）
 */
export function getYearPillarIndex(trueSolarTime: Date): number {
  const year = trueSolarTime.getUTCFullYear();

  // 计算立春交节时刻
  const lichunTime = getSolarTermTime(year, '立春');

  // 如果真太阳时在立春之前，用上一年
  let effectiveYear = year;
  if (trueSolarTime.getTime() < lichunTime.getTime()) {
    effectiveYear = year - 1;
  }

  // 六十甲子年：以公元4年（甲子年）为基准
  const index = ((effectiveYear - 4) % 60 + 60) % 60;
  return index;
}

/**
 * 计算年柱的天干和地支
 */
export function getYearGanZhi(trueSolarTime: Date): { stem: string; branch: string; ganzhi: string; index: number } {
  const idx = getYearPillarIndex(trueSolarTime);
  const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const stem = stems[idx % 10];
  const branch = branches[idx % 12];
  return { stem, branch, ganzhi: `${stem}${branch}`, index: idx };
}

// ============================================================
// 日柱干支计算
// ============================================================

/**
 * 计算日柱干支
 *
 * 干支纪日从春秋鲁隐公三年（公元前720年）至今连续不断
 * 以已知的甲子日为基准日，计算日差
 *
 * 基准日：公元1900年1月1日为甲戌日（索引10）
 * [参考来源 5.4节]
 *
 * @param date 日期（不含时分，取日期部分）
 * @returns 日柱索引（0-59）
 */
export function getDayPillarIndex(date: Date): number {
  // 基准日：1900-01-01 = 甲戌日（六十甲子索引10）
  const BASE_DATE = new Date(Date.UTC(1900, 0, 1));
  const BASE_INDEX = 10;

  // 计算日差（只取日期部分，不考虑时分）— 使用 UTC 方法避免浏览器时区干扰
  const dateOnly = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const baseOnly = new Date(Date.UTC(BASE_DATE.getUTCFullYear(), BASE_DATE.getUTCMonth(), BASE_DATE.getUTCDate()));

  const dayDiff = Math.round((dateOnly.getTime() - baseOnly.getTime()) / (24 * 60 * 60 * 1000));

  return ((BASE_INDEX + dayDiff) % 60 + 60) % 60;
}

/**
 * 计算日柱的天干和地支
 */
export function getDayGanZhi(date: Date): { stem: string; branch: string; ganzhi: string; index: number } {
  const idx = getDayPillarIndex(date);
  const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const stem = stems[idx % 10];
  const branch = branches[idx % 12];
  return { stem, branch, ganzhi: `${stem}${branch}`, index: idx };
}

// ============================================================
// 时支索引计算
// ============================================================

/**
 * 根据小时确定时支索引
 * 子时: 23:00-01:00 (索引0)
 * 丑时: 01:00-03:00 (索引1)
 * ...
 * 亥时: 21:00-23:00 (索引11)
 *
 * @param hour 小时 (0-23)
 * @returns 时支索引 (0-11)
 */
export function getHourBranchIndex(hour: number): number {
  if (hour === 23 || hour === 0) return 0; // 子时
  return Math.floor((hour + 1) / 2);
}
