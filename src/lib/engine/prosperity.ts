/**
 * 排盘引擎 层9：旺衰格局判断
 *
 * 五行旺相休囚死（五季×五行表）
 * 人元司令分野（每月藏干用事日数）
 * 日主旺衰（得令+得地+得势综合判断）
 * 格局取用（月令为主 + 五法：扶抑/病药/调候/专旺/通关）
 *
 * 来源：[项目大纲 规则#26-#28, 11.4, 11.5]
 */

import {
  type Stem, type Branch, type Element,
  STEM_ELEMENTS, BRANCH_ELEMENTS,
  STEM_YIN_YANG, BRANCH_HIDDEN_STEMS,
  GENERATING, OVERCOMING,
  stemIndex, branchIndex,
} from './constants';
import type { FourPillars, ProsperityResult, ElementStrength, HiddenStemEntry } from './types';
import { getMonthBranchIndex } from './solar-terms';
import { getTenGod } from './analysis';

// ============================================================
// 五行旺相休囚死全表 [项目大纲 11.4]
// 来源：《三命通会》[参考来源 6.9]
// ============================================================

// 当令者旺，令生者相，生令者休，克令者囚，令克者死
const WANG_XIANG_XIU_QIU_SI: Record<string, { 旺: Element; 相: Element; 休: Element; 囚: Element; 死: Element }> = {
  // 春（寅卯月）木旺
  '寅': { 旺: '木', 相: '火', 休: '水', 囚: '金', 死: '土' },
  '卯': { 旺: '木', 相: '火', 休: '水', 囚: '金', 死: '土' },
  // 夏（巳午月）火旺
  '巳': { 旺: '火', 相: '土', 休: '木', 囚: '水', 死: '金' },
  '午': { 旺: '火', 相: '土', 休: '木', 囚: '水', 死: '金' },
  // 秋（申酉月）金旺
  '申': { 旺: '金', 相: '水', 休: '土', 囚: '火', 死: '木' },
  '酉': { 旺: '金', 相: '水', 休: '土', 囚: '火', 死: '木' },
  // 冬（亥子月）水旺
  '亥': { 旺: '水', 相: '木', 休: '金', 囚: '土', 死: '火' },
  '子': { 旺: '水', 相: '木', 休: '金', 囚: '土', 死: '火' },
  // 四季月（辰戌丑未月）土旺
  '辰': { 旺: '土', 相: '金', 休: '火', 囚: '木', 死: '水' },
  '戌': { 旺: '土', 相: '金', 休: '火', 囚: '木', 死: '水' },
  '丑': { 旺: '土', 相: '金', 休: '火', 囚: '木', 死: '水' },
  '未': { 旺: '土', 相: '金', 休: '火', 囚: '木', 死: '水' },
};

/**
 * 获取月支对应的旺相休囚死表
 */
export function getWangXiang(monthBranch: Branch): Record<'旺' | '相' | '休' | '囚' | '死', Element> {
  return WANG_XIANG_XIU_QIU_SI[monthBranch];
}

/**
 * 获取某五行在指定月支的状态
 */
export function getElementStatus(element: Element, monthBranch: Branch): '旺' | '相' | '休' | '囚' | '死' {
  const table = WANG_XIANG_XIU_QIU_SI[monthBranch];
  for (const [status, el] of Object.entries(table)) {
    if (el === element) return status as '旺' | '相' | '休' | '囚' | '死';
  }
  return '休'; // fallback
}

// ============================================================
// 人元司令分野 [项目大纲 11.5]
// 来源：《三命通会》卷一·论人元司事 [参考来源 6.10]
// ============================================================

export interface RenYuanSiLing {
  stems: { stem: Stem; days: number; note?: string }[];
  totalDays: number;
}

// 完整的人元司令分野数据
const REN_YUAN_DATA: Record<Branch, { stem: Stem; days: number; note?: string }[]> = {
  寅: [
    { stem: '戊', days: 5, note: '艮土' },
    { stem: '丙', days: 5, note: '长生' },
    { stem: '甲', days: 20 },
  ],
  卯: [
    { stem: '甲', days: 7 },
    { stem: '乙', days: 23 },
  ],
  辰: [
    { stem: '乙', days: 7 },
    { stem: '壬', days: 5, note: '墓库' },
    { stem: '戊', days: 18 },
  ],
  巳: [
    { stem: '戊', days: 7 },
    { stem: '庚', days: 5, note: '长生' },
    { stem: '丙', days: 18 },
  ],
  午: [
    { stem: '丙', days: 7 },
    { stem: '丁', days: 23 },
  ],
  未: [
    { stem: '丁', days: 7 },
    { stem: '甲', days: 5, note: '墓库' },
    { stem: '己', days: 18 },
  ],
  申: [
    { stem: '戊', days: 5, note: '坤土' },
    { stem: '壬', days: 5, note: '长生' },
    { stem: '庚', days: 20 },
  ],
  酉: [
    { stem: '庚', days: 7 },
    { stem: '辛', days: 23 },
  ],
  戌: [
    { stem: '辛', days: 7 },
    { stem: '丙', days: 5, note: '墓库' },
    { stem: '戊', days: 18 },
  ],
  亥: [
    { stem: '戊', days: 5 },
    { stem: '甲', days: 5, note: '长生' },
    { stem: '壬', days: 20 },
  ],
  子: [
    { stem: '壬', days: 7 },
    { stem: '癸', days: 23 },
  ],
  丑: [
    { stem: '癸', days: 7 },
    { stem: '庚', days: 5, note: '墓库' },
    { stem: '己', days: 18 },
  ],
};

/**
 * 获取人元司令分野
 */
export function getRenYuanSiLing(monthBranch: Branch): { stem: Stem; days: number; note?: string }[] {
  return REN_YUAN_DATA[monthBranch] || [];
}

/**
 * 根据出生日在月内的位置，判断司令之气
 * 简化版：按总日数等比例分配
 */
export function getSiLingStem(monthBranch: Branch, dayInMonth: number): Stem {
  const data = REN_YUAN_DATA[monthBranch];
  if (!data || data.length === 0) return BRANCH_HIDDEN_STEMS[monthBranch][0].stem;

  const totalDays = data.reduce((sum, d) => sum + d.days, 0);
  const scaledDay = Math.floor((dayInMonth / 31) * totalDays) + 1;

  let cumulative = 0;
  for (const entry of data) {
    cumulative += entry.days;
    if (scaledDay <= cumulative) {
      return entry.stem;
    }
  }

  return data[data.length - 1].stem;
}

// ============================================================
// 五行力量计算
// ============================================================

/**
 * 计算四柱中各五行的力量分布
 *
 * 统计四柱天干和地支藏干的五行数量
 * 天干算1份，地支藏干按力量比例计算
 */
export function calculateElementStrengths(
  fourPillars: FourPillars,
  hiddenStems: { year: HiddenStemEntry[]; month: HiddenStemEntry[]; day: HiddenStemEntry[]; hour: HiddenStemEntry[] },
  monthBranch: Branch,
): ElementStrength[] {
  const counts: Record<Element, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };

  // 天干
  const stems: Stem[] = [
    fourPillars.year.stem,
    fourPillars.month.stem,
    fourPillars.day.stem,
    fourPillars.hour.stem,
  ];

  for (const stem of stems) {
    const el: Element = STEM_ELEMENTS[stem];
    counts[el] += 1.0; // 天干算1份
  }

  // 地支藏干（按力量比例）
  const allHidden = [
    ...hiddenStems.year,
    ...hiddenStems.month,
    ...hiddenStems.day,
    ...hiddenStems.hour,
  ];

  for (const entry of allHidden) {
    const el: Element = STEM_ELEMENTS[entry.stem];
    counts[el] += entry.ratio; // 藏干按比例
  }

  // 计算总数和比例
  const total: number = Object.values(counts).reduce((a: number, b: number) => a + b, 0);

  const result: ElementStrength[] = (['木', '火', '土', '金', '水'] as Element[]).map(el => ({
    element: el,
    count: counts[el],
    ratio: total > 0 ? counts[el] / total : 0,
    status: getElementStatus(el, monthBranch),
  }));

  return result;
}

// ============================================================
// 日主旺衰判断 [项目大纲 规则#27]
// 得令+得地+得势综合判断
// ============================================================

/**
 * 判断日主旺衰
 *
 * 得令：日主五行在月支处于旺或相状态
 * 得地：日主在地支藏干中有根（特别是月支藏干）
 * 得势：日主在天干中有多数同党（比劫多）或生助（印多）
 */
export function calculateProsperity(
  fourPillars: FourPillars,
  hiddenStems: { year: HiddenStemEntry[]; month: HiddenStemEntry[]; day: HiddenStemEntry[]; hour: HiddenStemEntry[] },
  trueSolarTime: Date,
): ProsperityResult {
  const dayStem = fourPillars.day.stem;
  const dayElement = STEM_ELEMENTS[dayStem];
  const monthBranch = fourPillars.month.branch;

  // ========== 得令 ==========
  // 日主五行在月支处于旺或相状态
  const dayStatus = getElementStatus(dayElement, monthBranch);
  const deLing = dayStatus === '旺' || dayStatus === '相';

  // ========== 得地 ==========
  // 日主在地支藏干中有根
  const allHidden = [
    ...hiddenStems.year,
    ...hiddenStems.month,
    ...hiddenStems.day,
    ...hiddenStems.hour,
  ];
  const rootCount = allHidden.filter(h => STEM_ELEMENTS[h.stem] === dayElement).length;
  const deDi = rootCount >= 2; // 至少2个地支藏干有根

  // ========== 得势 ==========
  // 日主在天干中比劫多或印多
  const stems: Stem[] = [fourPillars.year.stem, fourPillars.month.stem, fourPillars.hour.stem]; // 不含日主本身
  let supportCount = 0;
  for (const stem of stems) {
    const stemEl: Element = STEM_ELEMENTS[stem];
    // 比劫：同五行
    if (stemEl === dayElement) supportCount++;
    // 印：生我之五行
    if (GENERATING[stemEl] === dayElement) supportCount++;
  }
  const deShi = supportCount >= 2;

  // ========== 综合判断 ==========
  const score = (deLing ? 2 : 0) + (deDi ? 1 : 0) + (deShi ? 1 : 0);
  let dayMasterStrength: '旺' | '偏旺' | '中和' | '偏弱' | '弱';
  if (score >= 3) dayMasterStrength = '旺';
  else if (score === 2) dayMasterStrength = '偏旺';
  else if (score === 1) dayMasterStrength = '偏弱';
  else dayMasterStrength = '弱';

  // 如果得分在中间但得令，调整
  if (score === 2 && !deLing) dayMasterStrength = '中和';
  if (score === 1 && deLing) dayMasterStrength = '中和';

  // ========== 五行力量分布 ==========
  const elementStrengths = calculateElementStrengths(fourPillars, hiddenStems, monthBranch);

  // ========== 格局取用 [项目大纲 规则#28] ==========
  // 月令为主（《子平真诠》："八字用神，专求月令"）
  const { pattern, yongShen, yongShenMethod } = determinePattern(fourPillars, dayStem, dayElement, monthBranch, dayMasterStrength, elementStrengths);

  return {
    elementStrengths,
    dayMasterStrength,
    deLing,
    deDi,
    deShi,
    pattern,
    yongShen,
    yongShenMethod,
  };
}

// ============================================================
// 格局取用 [项目大纲 规则#28]
// 来源：《子平真诠》[参考来源 6.5, 6.7]
// ============================================================

/**
 * 确定格局和用神
 *
 * 月令为主：
 * - 月令本气透干 → 以本气十神定格
 * - 月令本气不透 → 看中气/余气透干
 * - 月令无用神 → 另取（看四柱有无财官煞食透干会支）
 *
 * 用神五法：
 * - 扶抑：日强抑之，日弱扶之
 * - 病药：以伤其扶者为病，以去其抑者为病
 * - 调候：金水生于冬令，木火生于夏令
 * - 专旺：四柱气势偏于一方
 * - 通关：两神对峙，须调和
 *
 * 财官印食顺用，煞伤劫刃逆用
 */
function determinePattern(
  fourPillars: FourPillars,
  dayStem: Stem,
  dayElement: Element,
  monthBranch: Branch,
  dayMasterStrength: string,
  elementStrengths: ElementStrength[],
): { pattern: string; yongShen: Element | null; yongShenMethod: string } {
  // 月支藏干
  const monthHidden = BRANCH_HIDDEN_STEMS[monthBranch];
  const monthMainStem = monthHidden[0].stem; // 月令本气
  const monthMainGod = getTenGod(dayStem, monthMainStem);

  // 检查月令本气是否透干
  const allStems = [fourPillars.year.stem, fourPillars.month.stem, fourPillars.hour.stem];
  const mainStemTransparent = allStems.includes(monthMainStem);

  // 确定格局
  let pattern: string = '';
  const godNames: Record<string, string> = {
    '比肩': '建禄/月劫格',
    '劫财': '月劫格',
    '食神': '食神格',
    '伤官': '伤官格',
    '偏财': '偏财格',
    '正财': '正财格',
    '七杀': '七杀格',
    '正官': '正官格',
    '偏印': '偏印格',
    '正印': '正印格',
  };

  if (mainStemTransparent) {
    pattern = godNames[monthMainGod] || `${monthMainGod}格`;
  } else {
    // 检查中气/余气透干
    let foundPattern = false;
    for (let i = 1; i < monthHidden.length; i++) {
      if (allStems.includes(monthHidden[i].stem)) {
        const god = getTenGod(dayStem, monthHidden[i].stem);
        pattern = godNames[god] || `${god}格`;
        foundPattern = true;
        break;
      }
    }
    if (!foundPattern) {
      pattern = godNames[monthMainGod] || `${monthMainGod}格`;
    }
  }

  // 确定用神
  let yongShen: Element | null = null;
  let yongShenMethod = '';

  if (dayMasterStrength === '旺' || dayMasterStrength === '偏旺') {
    // 日主旺 → 扶抑法：抑之
    // 用神取克、泄、耗
    yongShen = OVERCOMING[dayElement]; // 克我者为官杀
    yongShenMethod = '扶抑（抑旺）';
  } else if (dayMasterStrength === '弱' || dayMasterStrength === '偏弱') {
    // 日主弱 → 扶抑法：扶之
    // 用神取生、助
    yongShen = GENERATING[dayElement]; // 生我者为印
    yongShenMethod = '扶抑（扶弱）';
  } else {
    // 中和 → 看调候或通关
    // 简化：取月令本气所生之五行
    const monthElement = BRANCH_ELEMENTS[monthBranch];
    yongShen = monthElement;
    yongShenMethod = '调候/通关';
  }

  return { pattern, yongShen, yongShenMethod };
}
