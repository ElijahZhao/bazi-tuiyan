/**
 * 排盘引擎 层9：旺衰格局
 *
 * 五行旺相休囚死（五季×五行表）
 * 人元司令分野（每月藏干用事日数）
 * 日主旺衰（得令+得地+得势综合判断）
 * 格局取用（月令为主 + 五法）
 *
 * 来源：[项目大纲 规则#26-#28, 11.4, 11.5]
 */

import type { Stem, Branch, Element, FourPillars, WangShuaiInfo, RenYuanSiLing, Gender } from './types';
import {
  STEM_ELEMENT, BRANCH_ELEMENT,
  WANG_SHUAI, getSeason,
  REN_YUAN_SI_LING,
  HIDDEN_STEMS,
  GENERATING, OVERCOMING,
  getTenGod,
  stemIndex, branchIndex,
} from './constants';
import { getSolarTermTime } from './solar-terms';

// ============================================================
// 五行旺相休囚死
// ============================================================

export function getElementStatus(monthBranch: Branch): Record<Element, '旺' | '相' | '休' | '囚' | '死'> {
  const season = getSeason(monthBranch);
  return WANG_SHUAI[season];
}

// ============================================================
// 人元司令分野
// ============================================================

export function getRenYuanSiLing(
  monthBranch: Branch,
  trueSolarTime: Date,
): RenYuanSiLing {
  const segments = REN_YUAN_SI_LING[monthBranch] || [];

  // 计算出生日在当月节气中的位置
  // 获取当月起始节气的交节时刻
  const termName = getJieNameForMonth(monthBranch);
  const year = trueSolarTime.getUTCFullYear();
  const jieTime = getSolarTermTime(year, termName);

  // 计算出生日距节气交节时刻的天数
  const dayDiff = Math.floor((trueSolarTime.getTime() - jieTime.getTime()) / (24 * 60 * 60 * 1000));

  // 按比例分配（每月总日数按30日计算，实际节气月天数可能不同）
  let currentSegment: { stem: Stem; description: string } | undefined;
  let cumulativeDays = 0;
  for (const seg of segments) {
    cumulativeDays += seg.days;
    if (dayDiff < cumulativeDays) {
      currentSegment = { stem: seg.stem, description: seg.description };
      break;
    }
  }
  // 如果超出范围（节气月天数>30），用最后一段
  if (!currentSegment && segments.length > 0) {
    const last = segments[segments.length - 1];
    currentSegment = { stem: last.stem, description: last.description };
  }

  return { month: monthBranch, segments, currentSegment };
}

function getJieNameForMonth(monthBranch: Branch): string {
  const map: Record<Branch, string> = {
    寅: '立春', 卯: '惊蛰', 辰: '清明', 巳: '立夏',
    午: '芒种', 未: '小暑', 申: '立秋', 酉: '白露',
    戌: '寒露', 亥: '立冬', 子: '大雪', 丑: '小寒',
  };
  return map[monthBranch] || '立春';
}

// ============================================================
// 日主旺衰判断
// ============================================================

export function calculateWangShuai(
  fourPillars: FourPillars,
  trueSolarTime: Date,
): WangShuaiInfo {
  const dayMaster = fourPillars.day.stem;
  const dmElement = STEM_ELEMENT[dayMaster];
  const monthBranch = fourPillars.month.branch;

  // 五行旺相休囚死
  const elementStatus = getElementStatus(monthBranch);

  // 得令：日主五行在月令旺或相
  const dmStatus = elementStatus[dmElement];
  const deLing = dmStatus === '旺' || dmStatus === '相';

  // 得地：日主在地支中有根（通根）
  const allBranches: Branch[] = [
    fourPillars.year.branch,
    fourPillars.month.branch,
    fourPillars.day.branch,
    fourPillars.hour.branch,
  ];
  let rootStrength = 0;
  for (const branch of allBranches) {
    const hidden = HIDDEN_STEMS[branch] || [];
    for (const h of hidden) {
      if (STEM_ELEMENT[h.stem] === dmElement) {
        rootStrength += h.ratio;
      }
    }
  }
  const deDi = rootStrength >= 0.6; // 至少一个本气根

  // 得势：天干中与日主同类或生日主的多
  const allStems: Stem[] = [
    fourPillars.year.stem,
    fourPillars.month.stem,
    fourPillars.hour.stem, // 不含日主自己
  ];
  let supportCount = 0;
  for (const stem of allStems) {
    const sElem = STEM_ELEMENT[stem];
    if (sElem === dmElement || GENERATING[sElem] === dmElement) {
      supportCount++;
    }
  }
  const deShi = supportCount >= 2;

  // 综合判断旺衰
  const score = (deLing ? 2 : 0) + (deDi ? 1 : 0) + (deShi ? 1 : 0);
  let dayMasterStrength: WangShuaiInfo['dayMasterStrength'];
  if (score >= 3) dayMasterStrength = '旺';
  else if (score === 2) dayMasterStrength = '偏旺';
  else if (score === 1) dayMasterStrength = '偏弱';
  else dayMasterStrength = '弱';

  // 格局取用（简化版）
  const pattern = determinePattern(fourPillars, dmElement, monthBranch);
  const yongShen = determineYongShen(dayMasterStrength, dmElement, monthBranch);

  return {
    elementStatus,
    dayMasterStrength,
    deLing,
    deDi,
    deShi,
    pattern,
    yongShen,
  };
}

// ============================================================
// 格局判断
// ============================================================

function determinePattern(fourPillars: FourPillars, dmElement: Element, monthBranch: Branch): string {
  const monthHidden = HIDDEN_STEMS[monthBranch] || [];
  const mainQi = monthHidden[0]?.stem;
  if (!mainQi) return '未知';

  const mainQiElement = STEM_ELEMENT[mainQi];
  const tenGod = getTenGod(fourPillars.day.stem, mainQi);

  // 基本格局判断
  if (tenGod === '比肩' || tenGod === '劫财') {
    return tenGod === '比肩' ? '建禄格' : '月刃格';
  }
  if (tenGod === '食神' || tenGod === '伤官') {
    return tenGod === '食神' ? '食神格' : '伤官格';
  }
  if (tenGod === '偏财' || tenGod === '正财') {
    return tenGod === '偏财' ? '偏财格' : '正财格';
  }
  if (tenGod === '七杀' || tenGod === '正官') {
    return tenGod === '七杀' ? '七杀格' : '正官格';
  }
  if (tenGod === '偏印' || tenGod === '正印') {
    return tenGod === '偏印' ? '偏印格' : '正印格';
  }

  return '未知';
}

// ============================================================
// 用神判断（简化版）
// ============================================================

function determineYongShen(
  strength: WangShuaiInfo['dayMasterStrength'],
  dmElement: Element,
  monthBranch: Branch,
): string {
  const season = getSeason(monthBranch);

  if (strength === '旺' || strength === '偏旺') {
    // 旺则克之泄之耗之
    const keElement = OVERCOMING[dmElement]; // 克我者
    const xieElement = GENERATING[dmElement]; // 我生者
    return `${keElement}${xieElement}（克泄耗）`;
  } else if (strength === '弱' || strength === '偏弱') {
    // 弱则生之扶之
    const shengElement = Object.keys(GENERATING).find(k => GENERATING[k as Element] === dmElement) as Element;
    return `${dmElement}${shengElement}（生扶）`;
  }
  return '中和（调候为主）';
}

// ============================================================
// 五行计数
// ============================================================

export function countElements(fourPillars: FourPillars): Record<Element, number> {
  const count: Record<Element, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };

  // 天干
  const stems = [
    fourPillars.year.stem,
    fourPillars.month.stem,
    fourPillars.day.stem,
    fourPillars.hour.stem,
  ];
  for (const stem of stems) {
    count[STEM_ELEMENT[stem]]++;
  }

  // 地支藏干（按力量比例）
  const branches = [
    fourPillars.year.branch,
    fourPillars.month.branch,
    fourPillars.day.branch,
    fourPillars.hour.branch,
  ];
  for (const branch of branches) {
    const hidden = HIDDEN_STEMS[branch] || [];
    for (const h of hidden) {
      count[STEM_ELEMENT[h.stem]] += h.ratio;
    }
  }

  // 取整
  for (const key of Object.keys(count) as Element[]) {
    count[key] = Math.round(count[key] * 10) / 10;
  }

  return count;
}
