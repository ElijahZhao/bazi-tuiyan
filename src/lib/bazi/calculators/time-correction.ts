/**
 * 时间校正层
 * 对应项目大纲：规则 #1~#4
 *
 * 校正顺序（严格按此四步执行）：
 * 1. 钟表时间（用户输入的出生时间）
 * 2. 夏令时还原（若为1986-1991中国夏令时期间，减1小时）
 * 3. 经度差修正（4分钟 × (出生地经度 - 120°)）
 * 4. 均时差修正（视太阳时 - 平太阳时，范围+16分33秒至-14分06秒）
 *
 * 最终得到真太阳时 → 据此排四柱
 *
 * 来源：
 *   - 紫金山天文台：均时差定义、经度差修正
 *   - USNO：均时差范围（+16分33秒至-14分06秒）
 *   - 国家授时中心：北京时间 = UTC(NTSC) + 8小时
 */

import { isChinaDST, longitudeCorrection, STANDARD_LONGITUDE, EOT_MAX, EOT_MIN } from '../constants/dst';

/**
 * 时间校正结果
 */
export interface TimeCorrectionResult {
  originalTime: Date;       // 原始输入时间（北京时间）
  isDST: boolean;           // 是否处于夏令时
  dstCorrectedTime: Date;   // 夏令时还原后的标准时间
  longitudeOffset: number;  // 经度差修正（分钟）
  longitudeCorrectedTime: Date; // 经度修正后的时间
  eotOffset: number;        // 均时差修正（分钟）
  trueSolarTime: Date;      // 最终真太阳时
  corrections: string[];    // 校正步骤说明
}

/**
 * 计算均时差（Equation of Time）
 *
 * 均时差 = 视太阳时 - 平太阳时
 * 范围：+16分33秒（约11月3日）至 -14分06秒（约2月11日）
 *
 * 使用 NOAA 近似公式，精度约 ±0.5分钟：
 * B = 360/365 * (N - 81)  （N = 年内日序号，1月1日=1）
 * EOT = 9.87*sin(2B) - 7.53*cos(B) - 1.5*sin(B)  （分钟）
 *
 * @param date 日期
 * @returns 均时差（分钟），正值表示视太阳时快于平太阳时
 */
export function getEquationOfTime(date: Date): number {
  const year = date.getFullYear();
  // 计算年内日序号 N
  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;

  // B = 360/365 * (N - 81)，以度为单位
  const B = ((360 / 365) * (dayOfYear - 81)) * (Math.PI / 180); // 转为弧度

  // NOAA 公式
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

  // 限制在合理范围内（+16分33秒至-14分06秒）
  const clampedEot = Math.max(EOT_MIN / 60, Math.min(EOT_MAX / 60, eot));

  return clampedEot; // 返回分钟
}

/**
 * 时间校正主函数
 *
 * 严格按照四步顺序执行：
 * 1. 钟表时间（用户输入）
 * 2. 夏令时还原
 * 3. 经度差修正
 * 4. 均时差修正
 *
 * @param birthDate 出生日期（YYYY-MM-DD）
 * @param birthTime 出生时间（HH:MM）
 * @param longitude 出生地经度（东经，如北京116.41）
 * @param enableNightZiShi 是否启用夜子时区分（默认true）
 * @returns 时间校正结果
 */
export function correctTime(
  birthDate: string,
  birthTime: string,
  longitude: number,
  enableNightZiShi: boolean = true
): TimeCorrectionResult {
  const corrections: string[] = [];

  // 步骤1：解析原始时间（假设为北京时间）
  const [year, month, day] = birthDate.split('-').map(Number);
  const [hour, minute] = birthTime.split(':').map(Number);
  const originalTime = new Date(year, month - 1, day, hour, minute, 0);

  // 步骤2：夏令时还原
  let dstCorrectedTime = originalTime;
  const dst = isChinaDST(year, month, day, hour);
  if (dst) {
    dstCorrectedTime = new Date(originalTime.getTime() - 60 * 60 * 1000); // 减1小时
    corrections.push(`夏令时还原：${year}年${month}月${day}日处于夏令时期间，钟表时间减1小时 → ${dstCorrectedTime.getHours().toString().padStart(2, '0')}:${dstCorrectedTime.getMinutes().toString().padStart(2, '0')}`);
  }

  // 步骤3：经度差修正
  // 4分钟 × (当地经度 - 120°)
  // 正值表示当地时间比北京时间快（经度>120°，如上海121.47°）
  // 负值表示当地时间比北京时间慢（经度<120°，如北京116.41°）
  const lonOffset = longitudeCorrection(longitude); // 分钟
  const longitudeCorrectedTime = new Date(dstCorrectedTime.getTime() + lonOffset * 60 * 1000);
  corrections.push(`经度差修正：出生地经度${longitude}°，修正量 = 4分钟 × (${longitude} - 120) = ${lonOffset > 0 ? '+' : ''}${lonOffset.toFixed(2)}分钟`);

  // 步骤4：均时差修正
  // 均时差 = 视太阳时 - 平太阳时
  // 真太阳时 = 平太阳时 + 均时差
  // 这里平太阳时就是经度修正后的时间
  const eot = getEquationOfTime(longitudeCorrectedTime); // 分钟
  const trueSolarTime = new Date(longitudeCorrectedTime.getTime() + eot * 60 * 1000);
  corrections.push(`均时差修正：当日均时差 = ${eot > 0 ? '+' : ''}${eot.toFixed(2)}分钟`);

  corrections.push(`真太阳时：${trueSolarTime.getFullYear()}-${(trueSolarTime.getMonth() + 1).toString().padStart(2, '0')}-${trueSolarTime.getDate().toString().padStart(2, '0')} ${trueSolarTime.getHours().toString().padStart(2, '0')}:${trueSolarTime.getMinutes().toString().padStart(2, '0')}`);

  return {
    originalTime,
    isDST: dst,
    dstCorrectedTime,
    longitudeOffset: lonOffset,
    longitudeCorrectedTime,
    eotOffset: eot,
    trueSolarTime,
    corrections
  };
}

/**
 * 根据真太阳时确定时辰地支
 *
 * 对应规则 #8、#9：时柱用五鼠遁
 * 时辰对照：
 * 子时: 23:00-01:00 (跨日)
 * 丑时: 01:00-03:00
 * 寅时: 03:00-05:00
 * 卯时: 05:00-07:00
 * 辰时: 07:00-09:00
 * 巳时: 09:00-11:00
 * 午时: 11:00-13:00
 * 未时: 13:00-15:00
 * 申时: 15:00-17:00
 * 酉时: 17:00-19:00
 * 戌时: 19:00-21:00
 * 亥时: 21:00-23:00
 *
 * @param trueSolarTime 真太阳时
 * @param enableNightZiShi 是否启用夜子时区分
 * @returns { shizhi: string, isNightZiShi: boolean }
 *   shizhi: 时辰地支
 *   isNightZiShi: 是否为夜子时（23:00-00:00）
 */
export function getShiZhi(trueSolarTime: Date, enableNightZiShi: boolean = true): {
  shizhi: string;
  isNightZiShi: boolean;
} {
  const hour = trueSolarTime.getHours();
  const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  // 时辰索引计算
  // 23:00-01:00 = 子时(0)
  // 01:00-03:00 = 丑时(1)
  // ...
  // 21:00-23:00 = 亥时(11)
  let zhiIndex: number;
  if (hour === 23 || hour === 0) {
    zhiIndex = 0; // 子时
  } else {
    zhiIndex = Math.floor((hour + 1) / 2);
  }

  // 判断是否为夜子时（23:00-00:00）
  const isNightZiShi = enableNightZiShi && hour === 23;

  return {
    shizhi: DIZHI[zhiIndex],
    isNightZiShi
  };
}
