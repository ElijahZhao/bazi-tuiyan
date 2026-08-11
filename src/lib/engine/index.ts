/**
 * 八字推演引擎 — 主入口
 *
 * 调用各层模块，生成完整命盘对象。
 *
 * 排盘引擎9层架构：
 * 1. 时间校正（真太阳时/夏令时/经度差/均时差）
 * 2. 节气天文计算（太阳黄经/交节时刻/月支确定）
 * 3. 四柱排盘（年柱立春界/月柱五虎遁/日柱夜子时/时柱五鼠遁）
 * 4. 大运流年流月流日流时小运
 * 5. 辅助宫位（胎元/命宫/身宫）
 * 6. 十神/纳音/十二长生
 * 7. 神煞25+种
 * 8. 关系分析（刑冲合害破/暗合/拱夹虚邀）
 * 9. 旺衰格局
 */

import type { BirthInput, BaziChart, HiddenStem } from './types';
import { correctTime } from './time-correction';
import { calculateFourPillars } from './four-pillars';
import { calculateDaYun, calculateLiuNian, calculateXiaoYun, calculateLiuYue, calculateLiuRi, calculateLiuShi } from './da-yun';
import { calculateAuxiliaryPalaces } from './auxiliary-palaces';
import { getTenGod, getLifeStage } from './analysis';
import { calculateShenSha } from './shen-sha';
import { calculateRelations } from './relations';
import { calculateProsperity } from './prosperity';
import { countElements, getRenYuanSiLing } from './wang-shuai';
import {
  STEM_ELEMENT,
  HIDDEN_STEMS,
  jiaZiIndex,
  getKongWang,
  CITIES,
  CITY_LONGITUDES as CITY_LON,
} from './constants';

// ============================================================
// 排盘主函数
// ============================================================

/**
 * 排盘主函数
 *
 * 输入公历生辰 + 性别 + 出生地经度
 * 输出完整命盘对象
 */
export function paipan(input: BirthInput): BaziChart {
  // ========== 层1：时间校正 ==========
  const timezone = input.timezone ?? CITIES[input.birthPlace || '']?.timezone ?? 8;
  const timeCorrection = correctTime(
    input.year,
    input.month,
    input.day,
    input.hour,
    input.minute,
    input.longitude,
    timezone,
  );
  const trueSolarTime = timeCorrection.trueSolarTime;

  // ========== 层2-3：节气计算 + 四柱排盘 ==========
  const fourPillars = calculateFourPillars(input, timeCorrection);

  // 日主
  const dayMaster = fourPillars.day.stem;
  const dayMasterElement = STEM_ELEMENT[dayMaster];

  // ========== 藏干 ==========
  const hiddenStems: {
    year: HiddenStem[];
    month: HiddenStem[];
    day: HiddenStem[];
    hour: HiddenStem[];
  } = {
    year: fourPillars.year.hiddenStems,
    month: fourPillars.month.hiddenStems,
    day: fourPillars.day.hiddenStems,
    hour: fourPillars.hour.hiddenStems,
  };

  // ========== 层6：十神 ==========
  const tenGods = {
    year: fourPillars.year.tenGod,
    month: fourPillars.month.tenGod,
    day: '日主',
    hour: fourPillars.hour.tenGod,
    hiddenStems: {
      year: hiddenStems.year.map((h) => ({ stem: h.stem, tenGod: getTenGod(dayMaster, h.stem) })),
      month: hiddenStems.month.map((h) => ({ stem: h.stem, tenGod: getTenGod(dayMaster, h.stem) })),
      day: hiddenStems.day.map((h) => ({ stem: h.stem, tenGod: getTenGod(dayMaster, h.stem) })),
      hour: hiddenStems.hour.map((h) => ({ stem: h.stem, tenGod: getTenGod(dayMaster, h.stem) })),
    },
  };

  // 纳音
  const nayin = {
    year: fourPillars.year.nayin,
    month: fourPillars.month.nayin,
    day: fourPillars.day.nayin,
    hour: fourPillars.hour.nayin,
  };

  // ========== 层4：大运/流年/小运 ==========
  const yearStem = fourPillars.year.stem;
  const daYun = calculateDaYun(trueSolarTime, fourPillars, yearStem, input.gender);
  const liuNian = calculateLiuNian(input.year);
  const xiaoYun = calculateXiaoYun(fourPillars, yearStem, input.gender);

  // ========== 层5：辅助宫位 ==========
  const auxiliary = calculateAuxiliaryPalaces(trueSolarTime, fourPillars, {
    gender: input.gender,
  });

  // ========== 层6：十二长生 ==========
  const lifeStages = {
    year: getLifeStage(fourPillars.year.stem, fourPillars.year.branch).stage,
    month: getLifeStage(fourPillars.month.stem, fourPillars.month.branch).stage,
    day: getLifeStage(fourPillars.day.stem, fourPillars.day.branch).stage,
    hour: getLifeStage(fourPillars.hour.stem, fourPillars.hour.branch).stage,
  };

  // ========== 层7：神煞 ==========
  const shenSha = calculateShenSha(fourPillars, input.gender);

  // ========== 空亡 ==========
  const dayPillarIdx = jiaZiIndex(fourPillars.day.stem, fourPillars.day.branch);
  const yearPillarIdx = jiaZiIndex(fourPillars.year.stem, fourPillars.year.branch);
  const kongWang = {
    day: dayPillarIdx >= 0 ? getKongWang(dayPillarIdx) : [],
    year: yearPillarIdx >= 0 ? getKongWang(yearPillarIdx) : [],
  };

  // ========== 层8：关系分析 ==========
  const relations = calculateRelations(fourPillars);

  // ========== 层9：旺衰格局 ==========
  const prosperity = calculateProsperity(fourPillars, hiddenStems, trueSolarTime);
  const elementCount = countElements(fourPillars);

  // ========== 人元司令分野 ==========
  const renYuanSiLing = getRenYuanSiLing(fourPillars.month.branch, trueSolarTime);

  // ========== 流月/流日/流时（基于当前日期） ==========
  const now = new Date();
  const currentYear = now.getFullYear();
  const liuYue = calculateLiuYue(currentYear);
  const liuRi = calculateLiuRi(now);
  const liuShi = calculateLiuShi(now);

  // ========== 生成完整命盘 ==========
  const chart: BaziChart = {
    id: generateChartId(input),
    input,
    timeCorrection,
    fourPillars,
    dayMaster,
    dayMasterElement,
    hiddenStems,
    tenGods,
    nayin,
    daYun,
    liuNian,
    xiaoYun,
    taiYuan: auxiliary.taiYuan,
    mingGong: auxiliary.mingGong,
    shenGong: auxiliary.shenGong,
    lifeStages,
    shenSha,
    kongWang,
    branchRelations: relations.branchRelations,
    stemRelations: relations.stemRelations,
    anHeRelations: relations.anHeRelations,
    gongJiaRelations: relations.gongJiaRelations,
    prosperity,
    elementCount,
    renYuanSiLing,
    liuYue,
    liuRi,
    liuShi,
    createdAt: new Date().toISOString(),
  };

  return chart;
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 生成命盘ID
 */
function generateChartId(input: BirthInput): string {
  const dateStr = `${input.year}${String(input.month).padStart(2, '0')}${String(input.day).padStart(2, '0')}${String(input.hour).padStart(2, '0')}${String(input.minute).padStart(2, '0')}`;
  const genderStr = input.gender === '男' ? 'M' : 'F';
  const lonStr = String(Math.round(input.longitude * 100));
  return `${dateStr}${genderStr}${lonStr}`;
}

// ============================================================
// 导出
// ============================================================

/**
 * 中国主要城市经度表
 */
export const CITY_LONGITUDES = CITY_LON;

// Re-export 常用类型和函数
export type {
  BaziChart,
  BirthInput,
  FourPillars,
  Pillar,
  PillarDetail,
  TimeCorrection,
  DaYunResult,
  LiuYue,
  LiuRi,
  LiuShi,
  RenYuanSiLing,
  Stem,
  Branch,
  Element,
  TenGod,
} from './types';

export { correctTime } from './time-correction';
export { calculateFourPillars } from './four-pillars';
export { getSolarTermTime, getYearSolarTerms } from './solar-terms';
