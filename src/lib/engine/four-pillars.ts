/**
 * 排盘引擎 层3：四柱排盘
 *
 * 四柱 = 年柱 + 月柱 + 日柱 + 时柱
 *
 * 年柱：以立春交节时刻为界 [规则#6]
 * 月柱：十二节划分 + 五虎遁 [规则#7]
 * 日柱：零点为日始 + 夜子时/子正区分 [规则#8]
 * 时柱：五鼠遁 [规则#9]
 *
 * 来源：[项目大纲 第三节规则、第十一章数据表]
 */

import type { Stem, Branch, Pillar, PillarDetail, FourPillars, BirthInput, TimeCorrection } from './types';
import {
  HEAVENLY_STEMS, EARTHLY_BRANCHES,
  STEM_ELEMENT, BRANCH_ELEMENT,
  STEM_YIN_YANG,
  HIDDEN_STEMS,
  SIXTY_JIAZI,
  pillarFromIndex, pillarFromStemBranch,
  jiaZiIndex,
  wuHuDun, wuShuDun,
  getTenGod, getKongWang,
  stemIndex, branchIndex,
} from './constants';
import {
  getYearPillarIndex,
  getDayPillarIndex,
  getMonthBranchIndex,
  getHourBranchIndex,
} from './solar-terms';

// ============================================================
// 年柱
// ============================================================

export function calcYearPillar(trueSolarTime: Date): Pillar {
  const idx = getYearPillarIndex(trueSolarTime);
  return pillarFromIndex(idx);
}

// ============================================================
// 月柱
// ============================================================

export function calcMonthPillar(trueSolarTime: Date, yearStem: Stem): Pillar {
  const monthBranchIdx = getMonthBranchIndex(trueSolarTime);
  const monthBranch = EARTHLY_BRANCHES[monthBranchIdx];
  // 五虎遁：年干 → 月干
  const monthStem = wuHuDun(yearStem, monthBranchIdx);
  return pillarFromStemBranch(monthStem, monthBranch);
}

// ============================================================
// 日柱 + 时柱（含夜子时/子正处理）
// ============================================================

/**
 * 计算日柱和时柱
 *
 * [规则#8] 夜子时/子正区分：
 * - 夜子时（23:00-00:00）：日柱用当日，时柱用次日日干遁五鼠遁
 *   如戊辰日23:30 → 日柱戊辰，次日日干己，五鼠遁"甲己还加甲"→时柱甲子
 * - 子正（00:00-01:00）：日柱和时柱均用当日（新一日）日干遁五鼠遁
 *
 * [规则#9] 时柱用五鼠遁：日干 → 时干
 *
 * @param trueSolarTime 真太阳时
 * @param enableNightZi 是否启用夜子时/子正区分
 * @returns { dayPillar, hourPillar }
 */
export function calcDayHourPillars(
  trueSolarTime: Date,
  enableNightZi: boolean = true,
): { dayPillar: Pillar; hourPillar: Pillar; isNightZi: boolean } {
  const hour = trueSolarTime.getHours();
  const hourBranchIdx = getHourBranchIndex(hour);

  // 是否为夜子时（23:00-00:00）
  const isNightZi = enableNightZi && hour >= 23;

  if (isNightZi) {
    // 夜子时：日柱用当日，时柱用次日日干遁五鼠遁
    const dayIdx = getDayPillarIndex(trueSolarTime);
    const dayPillar = pillarFromIndex(dayIdx);

    // 次日日柱
    const nextDay = new Date(trueSolarTime.getTime() + 24 * 60 * 60 * 1000);
    const nextDayIdx = getDayPillarIndex(nextDay);
    const nextDayStem = SIXTY_JIAZI[nextDayIdx].stem;

    // 五鼠遁：次日日干 → 时干
    const hourStem = wuShuDun(nextDayStem, hourBranchIdx);
    const hourBranch = EARTHLY_BRANCHES[hourBranchIdx];
    const hourPillar = pillarFromStemBranch(hourStem, hourBranch);

    return { dayPillar, hourPillar, isNightZi: true };
  }

  // 正常情况或子正（00:00-01:00）：日柱和时柱均用当日日干
  const dayIdx = getDayPillarIndex(trueSolarTime);
  const dayPillar = pillarFromIndex(dayIdx);
  const dayStem = SIXTY_JIAZI[dayIdx].stem;

  // 五鼠遁：当日日干 → 时干
  const hourStem = wuShuDun(dayStem, hourBranchIdx);
  const hourBranch = EARTHLY_BRANCHES[hourBranchIdx];
  const hourPillar = pillarFromStemBranch(hourStem, hourBranch);

  return { dayPillar, hourPillar, isNightZi: false };
}

// ============================================================
// 四柱组装
// ============================================================

/**
 * 计算四柱（年月日时）并附加详细信息
 *
 * 附加信息：
 * - 藏干（地支藏干表）
 * - 十神（以日主为中心）
 * - 空亡（日柱查旬空）
 * - 五行旺相休囚死
 *
 * @param input 出生信息
 * @param timeCorrection 时间校正结果
 * @returns 四柱详情
 */
export function calculateFourPillars(
  input: BirthInput,
  timeCorrection: TimeCorrection,
): FourPillars {
  const trueSolarTime = timeCorrection.trueSolarTime;
  const enableNightZi = input.enableNightZi !== false;

  // 年柱
  const yearPillar = calcYearPillar(trueSolarTime);

  // 月柱
  const monthPillar = calcMonthPillar(trueSolarTime, yearPillar.stem);

  // 日柱 + 时柱
  const { dayPillar, hourPillar } = calcDayHourPillars(trueSolarTime, enableNightZi);

  // 日主
  const dayMaster = dayPillar.stem;

  // 组装详细信息
  const buildDetail = (pillar: Pillar): PillarDetail => {
    const hiddenStems = HIDDEN_STEMS[pillar.branch] || [];
    const tenGod = getTenGod(dayMaster, pillar.stem);
    const pillarIdx = jiaZiIndex(pillar.stem, pillar.branch);
    const kongWang = pillarIdx >= 0 ? getKongWang(pillarIdx) : [];

    return {
      ...pillar,
      hiddenStems,
      tenGod,
      kongWang,
      shenSha: [], // 神煞由 shen-sha.ts 填充
    };
  };

  return {
    year: buildDetail(yearPillar),
    month: buildDetail(monthPillar),
    day: buildDetail(dayPillar),
    hour: buildDetail(hourPillar),
  };
}
