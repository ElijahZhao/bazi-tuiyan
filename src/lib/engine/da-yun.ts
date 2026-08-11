/**
 * 排盘引擎 层4：大运 / 流年 / 流月 / 流日 / 流时 / 小运
 *
 * 大运顺逆以年干阴阳+性别为准：阳男/阴女顺排，阴男/阳女逆排
 * 起运岁数：出生时刻→最近一"节"的精确时间差，3天=1岁
 *
 * 来源：[项目大纲 规则#10-#12, 11.20]
 */

import {
  type Stem, type Branch,
  HEAVENLY_STEMS, EARTHLY_BRANCHES,
  STEM_YIN_YANG,
  SIXTY_JIAZI,
  pillarFromIndex, pillarFromStemBranch,
  wuHuDun, wuShuDun,
} from './constants';
import type {
  Pillar, DaYun, DaYunResult,
  LiuNian, LiuYue, LiuRi, LiuShi, XiaoYun,
  FourPillars, Gender,
} from './types';
import {
  getSolarTermTime, TWELVE_JIE,
  getDayPillarIndex,
} from './solar-terms';

// ============================================================
// 大运方向
// ============================================================

export function getDaYunDirection(yearStem: Stem, gender: Gender): '顺' | '逆' {
  const isYangStem = STEM_YIN_YANG[yearStem] === '阳';
  if (isYangStem) {
    return gender === '男' ? '顺' : '逆';
  } else {
    return gender === '男' ? '逆' : '顺';
  }
}

// ============================================================
// 起运岁数计算 [11.20]
// ============================================================

export function calculateStartAge(
  trueSolarTime: Date,
  yearStem: Stem,
  gender: Gender,
): { direction: '顺' | '逆'; startAge: number; startMonth: number; startDay: number; startHour: number } {
  const direction = getDaYunDirection(yearStem, gender);
  const year = trueSolarTime.getFullYear();

  let targetTermTime: Date;
  if (direction === '顺') {
    targetTermTime = findNextJie(trueSolarTime, year);
  } else {
    targetTermTime = findPrevJie(trueSolarTime, year);
  }

  let diffMs: number;
  if (direction === '顺') {
    diffMs = targetTermTime.getTime() - trueSolarTime.getTime();
  } else {
    diffMs = trueSolarTime.getTime() - targetTermTime.getTime();
  }
  if (diffMs < 0) diffMs = Math.abs(diffMs);

  const totalMinutes = Math.floor(diffMs / (60 * 1000));

  // 换算公式 [11.20]
  const startAge = Math.floor(totalMinutes / 4320);
  let remainder = totalMinutes - startAge * 4320;
  const startMonth = Math.floor(remainder / 360);
  remainder = remainder - startMonth * 360;
  const startDay = Math.floor(remainder / 12);
  remainder = remainder - startDay * 12;
  const startHour = remainder * 2;

  return { direction, startAge, startMonth, startDay, startHour };
}

function findNextJie(time: Date, year: number): Date {
  const jieTimes: { time: Date; name: string }[] = [];
  for (const term of TWELVE_JIE) {
    try {
      jieTimes.push({ time: getSolarTermTime(year, term.name), name: term.name });
    } catch { /* ignore */ }
  }
  // 小寒、大寒可能在1月，属于上一年的节气周期
  for (const term of TWELVE_JIE) {
    if (term.name === '小寒' || term.name === '大寒') {
      try {
        jieTimes.push({ time: getSolarTermTime(year - 1, term.name), name: term.name });
        jieTimes.push({ time: getSolarTermTime(year + 1, term.name), name: term.name });
      } catch { /* ignore */ }
    }
  }
  jieTimes.sort((a, b) => a.time.getTime() - b.time.getTime());
  for (const jie of jieTimes) {
    if (jie.time.getTime() > time.getTime()) return jie.time;
  }
  return new Date(time.getTime() + 365 * 86400000);
}

function findPrevJie(time: Date, year: number): Date {
  const jieTimes: { time: Date; name: string }[] = [];
  for (const term of TWELVE_JIE) {
    try {
      jieTimes.push({ time: getSolarTermTime(year, term.name), name: term.name });
    } catch { /* ignore */ }
  }
  for (const term of TWELVE_JIE) {
    if (term.name === '小寒' || term.name === '大寒') {
      try {
        jieTimes.push({ time: getSolarTermTime(year - 1, term.name), name: term.name });
      } catch { /* ignore */ }
    }
  }
  jieTimes.sort((a, b) => a.time.getTime() - b.time.getTime());
  for (let i = jieTimes.length - 1; i >= 0; i--) {
    if (jieTimes[i].time.getTime() < time.getTime()) return jieTimes[i].time;
  }
  return new Date(time.getTime() - 365 * 86400000);
}

// ============================================================
// 大运排盘
// ============================================================

export function calculateDaYun(
  trueSolarTime: Date,
  fourPillars: FourPillars,
  yearStem: Stem,
  gender: Gender,
): DaYunResult {
  const startAgeInfo = calculateStartAge(trueSolarTime, yearStem, gender);
  const direction = startAgeInfo.direction;

  const monthIdx = SIXTY_JIAZI.findIndex(
    item => item.stem === fourPillars.month.stem && item.branch === fourPillars.month.branch,
  );

  const steps: DaYun[] = [];
  for (let i = 0; i < 8; i++) {
    let dayunIdx: number;
    if (direction === '顺') {
      dayunIdx = monthIdx + 1 + i;
    } else {
      dayunIdx = monthIdx - 1 - i;
    }
    dayunIdx = ((dayunIdx % 60) + 60) % 60;
    const startAge = startAgeInfo.startAge + i * 10;
    const startYear = trueSolarTime.getFullYear() + startAge;
    steps.push({ index: i + 1, startAge, startYear, pillar: pillarFromIndex(dayunIdx) });
  }

  return {
    direction,
    startAge: startAgeInfo.startAge,
    startMonth: startAgeInfo.startMonth,
    startDay: startAgeInfo.startDay,
    startHour: startAgeInfo.startHour,
    steps,
  };
}

// ============================================================
// 流年
// ============================================================

export function calculateLiuNian(currentYear: number, range: number = 5): LiuNian[] {
  const result: LiuNian[] = [];
  for (let i = -range; i <= range; i++) {
    const year = currentYear + i;
    const idx = ((year - 4) % 60 + 60) % 60;
    result.push({ year, pillar: pillarFromIndex(idx) });
  }
  return result;
}

// ============================================================
// 流月 [规则#12] — 以节为界，月干用流年干遁五虎遁
// ============================================================

export function calculateLiuYue(liuNianYear: number): LiuYue[] {
  const yearStem = HEAVENLY_STEMS[((liuNianYear - 4) % 10 + 10) % 10] as Stem;
  const result: LiuYue[] = [];
  const monthBranches: Branch[] = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
  for (const monthBranch of monthBranches) {
    const monthBranchIdx = EARTHLY_BRANCHES.indexOf(monthBranch);
    const monthStem = wuHuDun(yearStem, monthBranchIdx);
    result.push({ monthBranch, pillar: pillarFromStemBranch(monthStem, monthBranch) });
  }
  return result;
}

// ============================================================
// 流日
// ============================================================

export function calculateLiuRi(date: Date): LiuRi {
  const idx = getDayPillarIndex(date);
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return { date: dateStr, pillar: pillarFromIndex(idx) };
}

// ============================================================
// 流时 [规则#12] — 用五鼠遁（以流日干遁）
// ============================================================

export function calculateLiuShi(liuRiDate: Date): LiuShi[] {
  const dayIdx = getDayPillarIndex(liuRiDate);
  const dayStem = SIXTY_JIAZI[dayIdx].stem;
  const result: LiuShi[] = [];
  for (let i = 0; i < 12; i++) {
    const hourBranch = EARTHLY_BRANCHES[i];
    const hourStem = wuShuDun(dayStem, i);
    result.push({ hourBranch, pillar: pillarFromStemBranch(hourStem, hourBranch) });
  }
  return result;
}

// ============================================================
// 小运 [规则#12]
// 时柱为起点，阳男阴女顺行/阴男阳女逆行（同大运方向）
// 虚岁一岁起运（虚岁1岁=时柱本身），逐年行一柱
// ============================================================

export function calculateXiaoYun(
  fourPillars: FourPillars,
  yearStem: Stem,
  gender: Gender,
  count: number = 8,
): XiaoYun[] {
  const direction = getDaYunDirection(yearStem, gender);
  const hourIdx = SIXTY_JIAZI.findIndex(
    item => item.stem === fourPillars.hour.stem && item.branch === fourPillars.hour.branch,
  );
  const result: XiaoYun[] = [];
  for (let i = 0; i < count; i++) {
    let idx: number;
    if (direction === '顺') {
      idx = hourIdx + i;
    } else {
      idx = hourIdx - i;
    }
    idx = ((idx % 60) + 60) % 60;
    result.push({ age: i + 1, pillar: pillarFromIndex(idx) });
  }
  return result;
}
