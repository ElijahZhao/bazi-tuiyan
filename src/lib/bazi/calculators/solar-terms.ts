/**
 * 节气计算层
 * 对应项目大纲：规则 #5 节气以定气法天文算法
 *
 * 使用 astronomy-engine 库计算太阳视黄经，精确找到每个节气交节时刻。
 * 天文算法基于 VSOP87 行星理论，精度 < 1秒。
 * 以紫金山天文台数据为最终校准基准。
 *
 * 来源：GB/T 33661-2017《农历的编算和颁行》
 *   - 立春 = 太阳地心视黄经 315°
 *   - 每个节气相差 15°
 */

import * as Astronomy from 'astronomy-engine';
import { SOLAR_TERM_LONGITUDE, SOLAR_TERMS, SHI_ER_JIE } from '../constants/dizhi';

/**
 * 节气信息
 */
export interface SolarTermInfo {
  name: string;           // 节气名称
  longitude: number;      // 黄经度数
  time: Date;             // 交节时刻（UTC）
  timeBeijing: Date;      // 交节时刻（北京时间，UTC+8）
  isJie: boolean;         // 是否为"节"（true=节，false=气）
}

/**
 * 判断节气名称是"节"还是"气"
 * 十二节：立春、惊蛰、清明、立夏、芒种、小暑、立秋、白露、寒露、立冬、大雪、小寒
 * 十二气：雨水、春分、谷雨、小满、夏至、大暑、处暑、秋分、霜降、小雪、冬至、大寒
 */
export function isJie(termName: string): boolean {
  return SHI_ER_JIE.includes(termName as any);
}

/**
 * 计算指定年份某个节气的精确交节时刻
 *
 * 使用 astronomy-engine 的 SearchSunLongitude 函数，
 * 该函数使用二分搜索找到太阳视黄经等于目标值的精确时刻。
 *
 * @param year 年份（公历）
 * @param termName 节气名称（如"立春"）
 * @returns 节气信息，包含交节时刻
 */
export function getSolarTermTime(year: number, termName: string): SolarTermInfo | null {
  const targetLon = SOLAR_TERM_LONGITUDE[termName];
  if (targetLon === undefined) return null;

  // 确定搜索起始时间
  // 节气在每年中的大致日期范围（用于缩小搜索范围）
  const termIndex = SOLAR_TERMS.indexOf(termName as any);
  // 立春(0)在2月，雨水(1)在2月，...，小寒(22)在1月，大寒(23)在1月
  // 大致月份：立春≈2/4, 惊蛰≈3/5, 清明≈4/5, ... 
  // 简化：根据节气序号估算月份
  const monthEstimate = Math.floor((termIndex / 2) + 2) % 12 || 12; // 1-12
  const adjustedMonth = monthEstimate <= 0 ? 12 : monthEstimate;

  // 搜索范围：估计月份前15天到后15天
  const startTime = new Date(Date.UTC(year, adjustedMonth - 1, 1));
  // 向前偏移15天，确保不漏
  startTime.setUTCDate(startTime.getUTCDate() - 15);

  try {
    // SearchSunLongitude: 搜索太阳视黄经等于目标值的时刻
    // 参数：targetLon(目标黄经), startTime(搜索起点), limitDays(搜索天数限制)
    const result = Astronomy.SearchSunLongitude(targetLon, startTime, 45);

    if (!result) return null;

    // SearchSunLongitude 返回 AstroTime 对象，其 .date 属性为 Date
    const resultDate = result.date;

    // 转换为北京时间（UTC+8）
    const beijingTime = new Date(resultDate.getTime() + 8 * 60 * 60 * 1000);

    return {
      name: termName,
      longitude: targetLon,
      time: resultDate,
      timeBeijing: beijingTime,
      isJie: isJie(termName)
    };
  } catch (e) {
    console.error(`计算节气 ${termName}(${year}) 失败:`, e);
    return null;
  }
}

/**
 * 获取指定年份的全部24节气
 */
export function getAllSolarTermsForYear(year: number): SolarTermInfo[] {
  const results: SolarTermInfo[] = [];
  for (const term of SOLAR_TERMS) {
    // 小寒和大寒可能在年初（1月），需要搜索上一年12月到当年1月
    // 立春在2月初
    // 为了确保正确，对于小寒(index=22)和大寒(index=23)，搜索年份可能需要调整
    let searchYear = year;
    if (term === '小寒' || term === '大寒') {
      // 小寒和大寒在公历1月，属于该年份
      searchYear = year;
    }

    const info = getSolarTermTime(searchYear, term);
    if (info) {
      // 确保节气属于目标年份
      const beijingYear = info.timeBeijing.getFullYear();
      if (beijingYear === year || (term === '小寒' && beijingYear === year) || (term === '大寒' && beijingYear === year)) {
        results.push(info);
      } else if (beijingYear === year - 1 || beijingYear === year + 1) {
        // 跨年节气，仍加入结果
        results.push(info);
      }
    }
  }
  return results.sort((a, b) => a.time.getTime() - b.time.getTime());
}

/**
 * 获取指定时间附近的"节"（用于大运起运计算）
 *
 * 对应规则 #11：起运岁数，数到"节"不数"气"
 * 顺排：从出生时刻向前数到下一个"节"
 * 逆排：从出生时刻向后数到上一个"节"
 *
 * @param birthTime 出生时间（UTC Date对象）
 * @param direction 'forward' = 找下一个节（顺排），'backward' = 找上一个节（逆排）
 * @returns 最近的"节"信息，包含交节时刻
 */
export function getNearestJie(birthTime: Date, direction: 'forward' | 'backward'): SolarTermInfo | null {
  const year = birthTime.getUTCFullYear();
  const beijingYear = new Date(birthTime.getTime() + 8 * 60 * 60 * 1000).getUTCFullYear();

  // 收集前后两年的所有"节"
  const allTerms: SolarTermInfo[] = [];
  for (let y = beijingYear - 1; y <= beijingYear + 1; y++) {
    const terms = getAllSolarTermsForYear(y);
    allTerms.push(...terms.filter(t => t.isJie));
  }

  // 按时间排序
  allTerms.sort((a, b) => a.time.getTime() - b.time.getTime());

  if (direction === 'forward') {
    // 找出生时刻之后的第一个"节"
    for (const term of allTerms) {
      if (term.time.getTime() > birthTime.getTime()) {
        return term;
      }
    }
  } else {
    // 找出生时刻之前的最后一个"节"
    let result: SolarTermInfo | null = null;
    for (const term of allTerms) {
      if (term.time.getTime() < birthTime.getTime()) {
        result = term;
      } else {
        break;
      }
    }
    return result;
  }

  return null;
}

/**
 * 判断给定时间是否在立春之后（用于年柱判断）
 *
 * 对应规则 #6：年柱以立春交节时刻为界
 * 立春前1分钟出生 → 用上一年干支
 *
 * @param birthTime 出生时间（UTC Date对象）
 * @returns { isAfterLichun: boolean, lichunTime: Date, year: number }
 *   isAfterLichun: true表示在立春之后（用新年干支），false表示在立春之前（用上一年干支）
 *   lichunTime: 当年或上一年立春的精确时刻
 *   year: 应使用的年柱年份
 */
export function checkLichunBoundary(birthTime: Date): {
  isAfterLichun: boolean;
  lichunTime: Date;
  year: number;
} {
  const beijingTime = new Date(birthTime.getTime() + 8 * 60 * 60 * 1000);
  const beijingYear = beijingTime.getUTCFullYear();

  // 获取当年立春时间
  const lichunCurrent = getSolarTermTime(beijingYear, '立春');
  // 获取上一年立春时间
  const lichunPrev = getSolarTermTime(beijingYear - 1, '立春');

  if (lichunCurrent && lichunCurrent.time.getTime() <= birthTime.getTime()) {
    // 在当年立春之后 → 用当年干支
    return {
      isAfterLichun: true,
      lichunTime: lichunCurrent.time,
      year: beijingYear
    };
  } else if (lichunPrev) {
    // 在当年立春之前 → 用上一年干支
    return {
      isAfterLichun: false,
      lichunTime: lichunPrev.time,
      year: beijingYear - 1
    };
  }

  // 兜底：直接用公历年份
  return {
    isAfterLichun: true,
    lichunTime: lichunCurrent?.time ?? new Date(Date.UTC(beijingYear, 1, 4)),
    year: beijingYear
  };
}

/**
 * 获取出生时刻所在月支
 *
 * 对应规则 #7：月柱以十二节划分
 * 月支由出生时刻所在的节气区间确定
 *
 * @param birthTime 出生时间（UTC Date对象）
 * @returns { yuezhi: string, jieName: string, jieTime: Date }
 */
export function getBirthMonthBranch(birthTime: Date): {
  yuezhi: string;
  jieName: string;
  jieTime: Date;
} | null {
  const beijingTime = new Date(birthTime.getTime() + 8 * 60 * 60 * 1000);
  const beijingYear = beijingTime.getUTCFullYear();

  // 收集前后一年的所有"节"
  const allJie: SolarTermInfo[] = [];
  for (let y = beijingYear - 1; y <= beijingYear + 1; y++) {
    const terms = getAllSolarTermsForYear(y);
    allJie.push(...terms.filter(t => t.isJie));
  }

  // 按时间排序
  allJie.sort((a, b) => a.time.getTime() - b.time.getTime());

  // 月支与节的对应关系（节→月支）
  const jieToYuezhi: Record<string, string> = {
    '立春': '寅', '惊蛰': '卯', '清明': '辰', '立夏': '巳',
    '芒种': '午', '小暑': '未', '立秋': '申', '白露': '酉',
    '寒露': '戌', '立冬': '亥', '大雪': '子', '小寒': '丑'
  };

  // 找到出生时刻所在的节气区间
  let result: { yuezhi: string; jieName: string; jieTime: Date } | null = null;
  for (const term of allJie) {
    if (term.time.getTime() <= birthTime.getTime()) {
      const yuezhi = jieToYuezhi[term.name];
      if (yuezhi) {
        result = {
          yuezhi,
          jieName: term.name,
          jieTime: term.time
        };
      }
    } else {
      break;
    }
  }

  return result;
}

/**
 * 获取出生时刻的太阳视黄经
 * 用于调试和验证
 */
export function getSunLongitude(date: Date): number {
  const pos = Astronomy.SunPosition(date);
  return pos.elon;
}
