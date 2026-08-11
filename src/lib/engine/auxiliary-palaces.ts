/**
 * 排盘引擎 层5：辅助宫位（胎元 / 命宫 / 身宫）
 *
 * 胎元：默认前三百日法（《三命通会》卷二）
 * 命宫：子上起正月逆数至生月，安时顺数至卯（逢卯安命宫）
 * 身宫：生月支加生日支，命顺身逆/命逆身顺（古今图书集成法）
 *
 * 来源：[项目大纲 规则#13-#15, 11.1, 11.15, 11.16]
 */

import type { Stem, Branch, Pillar, Gender, FourPillars } from './types';
import {
  EARTHLY_BRANCHES, HEAVENLY_STEMS,
  pillarFromStemBranch,
  stemIndex, branchIndex,
  stemFromIndex, branchFromIndex,
  getMonthOrdinal,
} from './constants';
import { SIXTY_JIAZI, pillarFromIndex } from './constants';
import { getDayPillarIndex } from './solar-terms';

// ============================================================
// 胎元 [规则#13, 11.1]
// ============================================================

/**
 * 胎元 — 前三百日法（默认）
 *
 * 《三命通会》卷二："以当生前三百日为十月之气"
 * 出生日前推三百日，以同干支日为胎元
 *
 * @param trueSolarTime 真太阳时
 * @returns 胎元柱
 */
export function calcTaiYuan(trueSolarTime: Date): Pillar {
  // 前推300日
  const conceptionDate = new Date(trueSolarTime.getTime() - 300 * 24 * 60 * 60 * 1000);
  const idx = getDayPillarIndex(conceptionDate);
  return pillarFromIndex(idx);
}

/**
 * 胎元 — 月干进一位、月支进三位法（民间简化法）
 * 从月柱起，天干进一位、地支进三位
 */
export function calcTaiYuanSimple(monthStem: Stem, monthBranch: Branch): Pillar {
  const newStem = stemFromIndex(stemIndex(monthStem) + 1);
  const newBranch = branchFromIndex(branchIndex(monthBranch) + 3);
  return pillarFromStemBranch(newStem, newBranch);
}

// ============================================================
// 命宫 [规则#14, 11.15]
// ============================================================

/**
 * 命宫 — 逢卯安命宫
 *
 * 《三命通会》卷二："子上起正月逆数至生月，安时顺数至卯。逢卯即安命宫。"
 *
 * 公式化：
 * - A = (1 - 生月序号) mod 12 （生月序号：寅=1, 卯=2, ..., 丑=12）
 * - 偏移 = (3 - 生时索引) mod 12 （3 = 卯的索引）
 * - 命宫索引 = (A + 偏移) mod 12
 *
 * @param monthBranch 月支
 * @param hourBranch 时支
 * @returns 命宫柱（仅地支有意义，天干用五虎遁补）
 */
export function calcMingGong(monthBranch: Branch, hourBranch: Branch, yearStem: Stem): Pillar {
  const monthOrd = getMonthOrdinal(monthBranch); // 寅=1,...,丑=12
  const hourIdx = branchIndex(hourBranch);       // 子=0,...,亥=11

  const A = ((1 - monthOrd) % 12 + 12) % 12;
  const offset = ((3 - hourIdx) % 12 + 12) % 12;
  const mingGongBranchIdx = (A + offset) % 12;

  const mingGongBranch = EARTHLY_BRANCHES[mingGongBranchIdx];
  // 命宫天干用五虎遁（与月柱天干同法，年干遁）
  const mingGongStem = wuHuDun(yearStem, mingGongBranchIdx);

  return pillarFromStemBranch(mingGongStem, mingGongBranch);
}

// ============================================================
// 身宫 [规则#15, 11.16]
// ============================================================

/**
 * 身宫 — 古今图书集成法（默认）
 *
 * 《古今图书集成·艺术典》卷六百九十八：
 * "将本人生月支加生日支，如命顺则身逆，如命逆则身顺，数至生时支便安身宫。"
 *
 * 公式化：
 * - 偏移 = (生时支索引 - 生月支索引) mod 12
 * - 若命逆（阴男/阳女）→ 身顺：身宫 = (生日支索引 + 偏移) mod 12
 * - 若命顺（阳男/阴女）→ 身逆：身宫 = (生日支索引 - 偏移) mod 12
 *
 * @param monthBranch 月支
 * @param dayBranch 日支
 * @param hourBranch 时支
 * @param yearStem 年干
 * @param gender 性别
 * @returns 身宫柱
 */
export function calcShenGong(
  monthBranch: Branch,
  dayBranch: Branch,
  hourBranch: Branch,
  yearStem: Stem,
  gender: Gender,
): Pillar {
  const monthIdx = branchIndex(monthBranch);
  const dayIdx = branchIndex(dayBranch);
  const hourIdx = branchIndex(hourBranch);

  const offset = ((hourIdx - monthIdx) % 12 + 12) % 12;

  // 判断命顺逆
  const isYangStem = STEM_YIN_YANG[yearStem] === '阳';
  const isMingShun = (isYangStem && gender === '男') || (!isYangStem && gender === '女');

  let shenGongBranchIdx: number;
  if (!isMingShun) {
    // 命逆 → 身顺
    shenGongBranchIdx = (dayIdx + offset) % 12;
  } else {
    // 命顺 → 身逆
    shenGongBranchIdx = ((dayIdx - offset) % 12 + 12) % 12;
  }

  const shenGongBranch = EARTHLY_BRANCHES[shenGongBranchIdx];
  // 身宫天干用五虎遁
  const shenGongStem = wuHuDun(yearStem, shenGongBranchIdx);

  return pillarFromStemBranch(shenGongStem, shenGongBranch);
}

// ============================================================
// 辅助宫位组装
// ============================================================

import { STEM_YIN_YANG, wuHuDun } from './constants';

export function calculateAuxiliaryPalaces(
  trueSolarTime: Date,
  fourPillars: FourPillars,
  input: { gender: Gender },
): import('./types').AuxiliaryPalaces {
  const taiYuan = calcTaiYuan(trueSolarTime);

  const mingGong = calcMingGong(
    fourPillars.month.branch,
    fourPillars.hour.branch,
    fourPillars.year.stem,
  );

  const shenGong = calcShenGong(
    fourPillars.month.branch,
    fourPillars.day.branch,
    fourPillars.hour.branch,
    fourPillars.year.stem,
    input.gender,
  );

  return {
    taiYuan,
    taiYuanMethod: '前三百日法（《三命通会》卷二）',
    mingGong,
    shenGong,
    shenGongMethod: '古今图书集成法（《古今图书集成·艺术典》卷六百九十八）',
  };
}
