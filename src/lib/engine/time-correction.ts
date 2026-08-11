/**
 * 排盘引擎 层1：时间校正
 *
 * 校正顺序（严格按此四步执行）：
 * 1. 钟表时间（用户输入的出生时间 + 出生地时区）
 * 2. 夏令时还原（若为1986-1991中国夏令时期间，减1小时）
 * 3. 经度差修正（4分钟 × (出生地经度 - 标准子午线)）
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
 *
 * 注意：此函数使用原始数值参数而非 Date 对象，避免浏览器时区干扰
 */
export function isDST(year: number, month: number, day: number, hour: number): boolean {
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
export function restoreDST(
  year: number, month: number, day: number, hour: number, minute: number,
  timezone: number,
): { adjustedMs: number; applied: boolean } {
  if (timezone === 8 && isDST(year, month, day, hour)) {
    // 中国夏令时：减1小时
    const adjusted = Date.UTC(year, month - 1, day, hour, minute, 0) - 60 * 60 * 1000;
    return { adjustedMs: adjusted, applied: true };
  }
  return {
    adjustedMs: Date.UTC(year, month - 1, day, hour, minute, 0),
    applied: false,
  };
}

// ============================================================
// 经度差修正 [规则#3]
// ============================================================

/**
 * 经度差修正
 *
 * 通用公式：修正值 = 4分钟 × (当地经度 - 标准子午线经度)
 * 标准子午线 = timezone × 15°
 *
 * 北京时间（UTC+8）：标准子午线 = 8 × 15 = 120°E
 * 美国东部（UTC-5）：标准子午线 = -5 × 15 = 75°W
 *
 * 东经>标准子午线 → 加时间；西经<标准子午线 → 减时间
 */
export function adjustLongitude(dateMs: number, longitude: number, timezone: number): { adjustedMs: number; diffMinutes: number } {
  const standardMeridian = timezone * 15;
  const diffMinutes = 4 * (longitude - standardMeridian);
  return {
    adjustedMs: dateMs + diffMinutes * 60 * 1000,
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
export function getEquationOfTime(dateMs: number): number {
  const date = new Date(dateMs);
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
 *
 * 注意：dateMs 是"本地时间存为UTC"，需先转换为实际UTC再计算天文均时差
 */
export function adjustEquationOfTime(dateMs: number, timezone: number = 8): { adjustedMs: number; eotMinutes: number } {
  // 转换为实际UTC计算均时差（天文量取决于地球轨道位置=实际UTC时刻）
  const utcMs = dateMs - timezone * 60 * 60 * 1000;
  const eotMinutes = getEquationOfTime(utcMs);
  // 均时差修正应用到本地时间线
  return {
    adjustedMs: dateMs + eotMinutes * 60 * 1000,
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
 * 1. 钟表时间（用户输入 + 出生地时区）
 * 2. 夏令时还原（中国1986-1991）
 * 3. 时区→UTC 转换
 * 4. 经度差修正（相对于标准子午线）
 * 5. 均时差修正
 *
 * @param year 年
 * @param month 月 (1-12)
 * @param day 日
 * @param hour 时 (0-23)
 * @param minute 分 (0-59)
 * @param longitude 出生地经度（东经为正，西经为负）
 * @param timezone UTC 偏移小时数（默认 8 = 北京时间 UTC+8）
 * @returns 时间校正详情
 */
export function correctTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  longitude: number,
  timezone: number = 8,
): TimeCorrection {
  // 1. 钟表时间（用 Date.UTC 避免浏览器时区干扰）
  //    注意：此处存储的是用户输入的本地时间（非实际UTC），用 getUTC* 方法读取
  const clockMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  const clockTime = new Date(clockMs);

  // 2. 夏令时还原（仅中国 timezone=8 时检查）
  const { adjustedMs: dstMs, applied: dstApplied } = restoreDST(year, month, day, hour, minute, timezone);
  const dstAdjusted = new Date(dstMs);

  // 3. 经度差修正（相对于标准子午线 timezone×15°）
  //    不做时区→UTC转换，保持本地时间表示
  //    真太阳时 = 当地标准时 + 经度差 + 均时差
  const { adjustedMs: lonMs, diffMinutes: longitudeDiff } = adjustLongitude(dstMs, longitude, timezone);
  const longitudeAdjusted = new Date(lonMs);

  // 4. 均时差修正
  const { adjustedMs: trueSolarMs, eotMinutes: equationOfTime } = adjustEquationOfTime(lonMs);
  const trueSolarTime = new Date(trueSolarMs);

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
    timezone,
  };
}
