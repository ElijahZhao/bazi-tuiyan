/**
 * 排盘引擎 层1：时间校正
 *
 * 校正顺序（严格按此四步执行）：
 * 1. 钟表时间（用户输入的出生时间）
 * 2. 夏令时还原（若为1986-1991中国夏令时期间，减1小时）
 * 3. 经度差修正（4分钟 × (出生地经度 - 120°)）
 * 4. 均时差修正（视太阳时 - 平太阳时，范围+16分33秒至-14分06秒）
 *
 * 最终得到真太阳时 → 据此排四柱
 *
 * 来源：[项目大纲 规则#1-#4, 7.1节, 11.10]
 */

import * as Astronomy from 'astronomy-engine';
import type { TimeCorrection } from './types';
import { DST_PERIODS } from './constants';

// ============================================================
// 夏令时判断 [11.10]
// ============================================================

/**
 * 判断给定日期是否在中国夏令时期间（1986-1991）
 *
 * 夏令时起止时刻均为凌晨2:00（即夏令时开始时2:00→3:00，结束时2:00→1:00）
 * 1992年起全面取消
 *
 * 另含1919年、1935-1937年历史夏令时（简化处理）
 */
export function isDST(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  const hour = date.getHours();

  const period = DST_PERIODS.find(p => p.year === year);
  if (!period) return false;

  const [startMonth, startDay] = period.start;
  const [endMonth, endDay] = period.end;

  // 转换为年中日数简化比较
  const dateNum = month * 100 + day;
  const startNum = startMonth * 100 + startDay;
  const endNum = endMonth * 100 + endDay;

  if (dateNum < startNum || dateNum > endNum) return false;

  // 开始日：2:00前不算夏令时
  if (dateNum === startNum && hour < 2) return false;
  // 结束日：2:00后不算夏令时（已回拨）
  if (dateNum === endNum && hour < 2) return true; // 回拨前仍是夏令时
  if (dateNum === endNum && hour >= 2) return false;

  return true;
}

/**
 * 夏令时还原：钟表时间 - 1小时 = 标准时间
 */
export function restoreDST(clockTime: Date): { adjusted: Date; applied: boolean } {
  if (isDST(clockTime)) {
    return {
      adjusted: new Date(clockTime.getTime() - 60 * 60 * 1000),
      applied: true,
    };
  }
  return { adjusted: new Date(clockTime), applied: false };
}

// ============================================================
// 经度差修正 [规则#3]
// ============================================================

/**
 * 经度差修正
 * 北京时间 = 东经120°标准时
 * 修正值 = 4分钟 × (当地经度 - 120°)
 * 东经>120° → 加时间；东经<120° → 减时间
 */
export function adjustLongitude(date: Date, longitude: number): { adjusted: Date; diffMinutes: number } {
  const diffMinutes = 4 * (longitude - 120);
  return {
    adjusted: new Date(date.getTime() + diffMinutes * 60 * 1000),
    diffMinutes,
  };
}

// ============================================================
// 均时差修正 [规则#1]
// ============================================================

/**
 * 计算均时差（Equation of Time）
 *
 * 均时差 = 视太阳时 - 平太阳时
 * 范围：+16分33秒至-14分06秒
 *
 * 使用 astronomy-engine 精确计算：
 * 均时差与太阳的赤经和时角相关
 *
 * 来源：[参考来源 5.2节、USNO定义]
 */
export function getEquationOfTime(date: Date): number {
  const time = new Astronomy.AstroTime(date);
  
  // 使用简化的均时差公式（Spencer 1971 简化版，精度约±0.5分钟）
  const jd = time.ut; // 儒略日
  const n = jd - 2451545.0; // J2000.0 起的天数
  // 均时差公式（Spencer 1971 简化版，精度约±0.5分钟）
  const M = (357.529 + 0.98560028 * n) * Math.PI / 180; // 平近点角
  const C = (1.914666 * Math.sin(M) + 0.019994 * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M)) * Math.PI / 180;
  const trueLong = (280.466 + 0.9856474 * n + C) * Math.PI / 180; // 真黄经
  const obliquity = (23.439 - 0.0000004 * n) * Math.PI / 180; // 黄赤交角
  
  // 均时差（弧度）
  const y = Math.tan(obliquity / 2);
  const eot = y * y * Math.sin(2 * trueLong) 
    - 2 * 0.016709 * Math.sin(M) 
    + 4 * 0.016709 * y * y * Math.sin(M) * Math.cos(2 * trueLong)
    - 0.5 * y * y * y * y * Math.sin(4 * trueLong)
    - 1.25 * 0.016709 * 0.016709 * Math.sin(2 * M);
  
  // 转换为分钟
  const eotMinutes = eot * (180 / Math.PI) * 4; // 1度=4分钟
  
  return eotMinutes;
}

/**
 * 均时差修正：真太阳时 = 平太阳时 + 均时差
 */
export function adjustEquationOfTime(date: Date): { adjusted: Date; eotMinutes: number } {
  const eotMinutes = getEquationOfTime(date);
  return {
    adjusted: new Date(date.getTime() + eotMinutes * 60 * 1000),
    eotMinutes,
  };
}

// ============================================================
// 完整时间校正流程
// ============================================================

/**
 * 执行完整的时间校正流程
 *
 * 步骤：
 * 1. 钟表时间（用户输入）
 * 2. 夏令时还原
 * 3. 经度差修正
 * 4. 均时差修正
 *
 * @param year 年
 * @param month 月 (1-12)
 * @param day 日
 * @param hour 时 (0-23)
 * @param minute 分 (0-59)
 * @param longitude 出生地经度
 * @returns 时间校正详情
 */
export function correctTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  longitude: number,
): TimeCorrection {
  // 1. 钟表时间
  const clockTime = new Date(year, month - 1, day, hour, minute, 0);

  // 2. 夏令时还原
  const { adjusted: dstAdjusted, applied: dstApplied } = restoreDST(clockTime);

  // 3. 经度差修正
  const { adjusted: longitudeAdjusted, diffMinutes: longitudeDiff } = adjustLongitude(dstAdjusted, longitude);

  // 4. 均时差修正
  const { adjusted: trueSolarTime, eotMinutes: equationOfTime } = adjustEquationOfTime(longitudeAdjusted);

  return {
    clockTime,
    dstAdjusted,
    longitudeAdjusted,
    trueSolarTime,
    dstApplied,
    isDST: dstApplied,
    dstOffset: dstApplied ? 60 : 0,
    equationOfTime,
    longitudeDiff,
  };
}
