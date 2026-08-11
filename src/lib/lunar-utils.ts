/**
 * 农历工具模块
 *
 * 提供农历 ↔ 公历转换功能，基于 lunar-typescript 库
 *
 * 功能：
 * 1. 农历日期 → 公历日期转换（支持闰月）
 * 2. 获取某年农历月份信息（哪些月是闰月、每月天数）
 * 3. 农历日期格式化
 */

import { Lunar, LunarYear } from 'lunar-typescript';

// ============================================================
// 类型定义
// ============================================================

export interface LunarDateInput {
  year: number;
  month: number;  // 1-12（正月至十二月）
  day: number;    // 1-30
  hour: number;   // 0-23
  minute: number; // 0-59
  isLeapMonth: boolean; // 是否闰月
}

export interface SolarDateOutput {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
}

export interface LunarMonthInfo {
  month: number;       // 月份数字 1-12
  name: string;        // 月份名称，如"正月"、"闰二月"
  isLeap: boolean;     // 是否闰月
  dayCount: number;    // 该月天数（29或30）
}

// ============================================================
// 农历 → 公历 转换
// ============================================================

/**
 * 将农历日期转换为公历日期（支持闰月）
 *
 * lunar-typescript 中闰月用负数 month 表示
 * 例如 2023年闰二月 → month = -2
 *
 * @param lunarInput 农历日期输入
 * @returns 公历日期
 */
export function lunarToSolar(lunarInput: LunarDateInput): SolarDateOutput {
  const monthValue = lunarInput.isLeapMonth ? -lunarInput.month : lunarInput.month;
  const lunar = Lunar.fromYmdHms(
    lunarInput.year,
    monthValue,
    lunarInput.day,
    lunarInput.hour,
    lunarInput.minute,
    0,
  );
  const solar = lunar.getSolar();
  return {
    year: solar.getYear(),
    month: solar.getMonth(),
    day: solar.getDay(),
    hour: solar.getHour(),
    minute: solar.getMinute(),
  };
}

// ============================================================
// 农历月份信息查询
// ============================================================

const MONTH_NAMES = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '腊月',
];

/**
 * 获取某年的农历月份信息列表
 *
 * @param year 农历年份
 * @returns 该年所有农历月份信息（含闰月）
 */
export function getLunarMonths(year: number): LunarMonthInfo[] {
  const months: LunarMonthInfo[] = [];
  const lunarYear = LunarYear.fromYear(year);
  const lunarMonths = lunarYear.getMonths();

  for (const lm of lunarMonths) {
    const rawMonth = lm.getMonth();
    const monthIdx = Math.abs(rawMonth);
    const isLeap = rawMonth < 0;
    months.push({
      month: monthIdx,
      name: isLeap ? `闰${MONTH_NAMES[monthIdx - 1] || monthIdx + '月'}` : (MONTH_NAMES[monthIdx - 1] || `${monthIdx}月`),
      isLeap,
      dayCount: lm.getDayCount(),
    });
  }

  return months;
}

/**
 * 获取某年某农历月的天数
 *
 * @param year 农历年份
 * @param month 月份数字（1-12）
 * @param isLeap 是否闰月
 * @returns 该月天数（29或30）
 */
export function getLunarMonthDays(year: number, month: number, isLeap: boolean): number {
  const months = getLunarMonths(year);
  const found = months.find(m => m.month === month && m.isLeap === isLeap);
  return found ? found.dayCount : 29;
}

/**
 * 检查某年是否有闰月
 *
 * @param year 农历年份
 * @returns 闰月月份（1-12），如果没有闰月则返回 0
 */
export function getLeapMonth(year: number): number {
  return LunarYear.fromYear(year).getLeapMonth();
}

/**
 * 获取农历月份的中文名称
 *
 * @param month 月份数字（1-12）
 * @returns 中文名称，如"正月"、"二月"
 */
export function getLunarMonthName(month: number): string {
  return MONTH_NAMES[month - 1] || `${month}月`;
}

/**
 * 获取农历日的中文表示
 *
 * @param day 日（1-30）
 * @returns 中文名称，如"初一"、"十五"
 */
export function getLunarDayName(day: number): string {
  const dayNames = [
    '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
  ];
  return dayNames[day - 1] || `${day}日`;
}
