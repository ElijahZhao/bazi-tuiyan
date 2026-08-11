/**
 * 大运流年计算模块
 *
 * 对应项目大纲：
 *   - 规则 #10：大运顺逆以年干阴阳为准（阳年男/阴年女顺排；阴年男/阳年女逆排）
 *   - 规则 #11：起运岁数（出生时刻→最近一"节"的精确时间差，3天=1岁）
 *   - 规则 #12：流年逐年干支 + 小运以时柱为起点
 *   - 数据表 11.20：大运起运岁数精确算法
 *
 * 大运方向判断依据是**年干阴阳**，不是日干！
 * 起运岁数精确到分钟，交节时刻由节气计算层（solar-terms.ts）提供。
 *
 * @module bazi/calculators/da-yun
 */

import { getNearestJie } from './solar-terms';
import { TIANGAN, TIANGAN_INDEX, TIANGAN_YINYANG } from '../constants/tiangan';
import { DIZHI, DIZHI_INDEX } from '../constants/dizhi';
import { CANGGAN_MAP } from '../constants/canggan';
import { getNayin } from '../constants/nayin';
import type {
  Pillar,
  DaYunItem,
  LiuNianItem,
  XiaoYunItem,
  TianGan,
  DiZhi,
  WuXing,
  BaziInput,
} from '../types';
import type { FourPillarsResult } from './four-pillars';

// ============================================================
// 返回类型定义
// ============================================================

/**
 * 起运岁数结果（对应数据表 11.20）
 *
 * 精确到分钟的时间差换算为岁/月/天/时（大运时间）。
 */
export interface StartAgeResult {
  /** 起运岁数（整数，3天=1岁） */
  years: number;
  /** 余月（1天=4月，1月=360分钟） */
  months: number;
  /** 余天（1时辰=10天，1天=12分钟） */
  days: number;
  /** 余时（大运时间，1分钟=2小时） */
  hours: number;
  /** 出生时刻到目标"节"的总分钟数 */
  totalMinutes: number;
}

/**
 * 大运流年计算结果
 */
export interface DaYunAndLiuYunResult {
  /** 大运列表（8步，每步10年） */
  daYun: DaYunItem[];
  /** 流年列表（覆盖大运年份范围） */
  liuNian: LiuNianItem[];
  /** 小运列表（60步，虚岁1~60岁） */
  xiaoYun: XiaoYunItem[];
}

// ============================================================
// 内部常量
// ============================================================

/**
 * 起运岁数换算常量（对应数据表 11.20）
 *
 * 换算关系：
 *   - 3天 = 1岁 → 1岁 = 4320 分钟（3 × 1440）
 *   - 1天 = 4月 → 1月 = 360 分钟（1440 ÷ 4）
 *   - 1时辰(2小时) = 10天 → 1天 = 12 分钟（120 ÷ 10）
 *   - 1分钟 = 2小时（大运时间）
 */
const MINUTES_PER_YEAR = 4320; // 3天 = 4320分钟
const MINUTES_PER_MONTH = 360; // 1月 = 360分钟（6小时）
const MINUTES_PER_DAY = 12; // 1天 = 12分钟（大运时间）
const HOURS_PER_MINUTE = 2; // 1分钟 = 2小时（大运时间）

/** 大运步数 */
const DA_YUN_STEPS = 8;

/** 每步大运年数 */
const DA_YUN_STEP_YEARS = 10;

/** 小运步数（虚岁1~60岁） */
const XIAO_YUN_STEPS = 60;

// ============================================================
// 辅助函数
// ============================================================

/**
 * 数学取模（正确处理负数）
 *
 * JavaScript 的 % 运算符对负数返回负值，
 * 此函数确保结果始终为非负数。
 *
 * @example
 * mod(-1, 60) // => 59
 * mod(5, 60)  // => 5
 */
function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/**
 * 构建 Pillar 对象
 *
 * 根据天干和地支，查表填充藏干（CANGGAN_MAP）和纳音（getNayin）信息。
 *
 * @param stem 天干
 * @param branch 地支
 * @returns 包含 stem, branch, hiddenStems, nayin, nayinElement 的 Pillar 对象
 */
function buildPillar(stem: string, branch: string): Pillar {
  const nayinEntry = getNayin(stem, branch);
  const hiddenStems = (CANGGAN_MAP[branch] ?? []) as TianGan[];

  return {
    stem: stem as TianGan,
    branch: branch as DiZhi,
    hiddenStems,
    nayin: nayinEntry?.nayinName,
    nayinElement: nayinEntry?.nayinElement as WuXing | undefined,
  };
}

/**
 * 根据天干和地支计算六十甲子序号（0~59）
 *
 * 使用中国剩余定理（CRT）求解：
 *   g ≡ stemIndex (mod 10)
 *   g ≡ branchIndex (mod 12)
 *
 * 公式：g = (stemIndex × 6 - branchIndex × 5) mod 60
 *
 * @param stem 天干
 * @param branch 地支
 * @returns 六十甲子序号（0~59）
 *
 * @example
 * getGanzhiIndex('甲', '子') // => 0
 * getGanzhiIndex('丙', '寅') // => 2
 * getGanzhiIndex('癸', '亥') // => 59
 */
function getGanzhiIndex(stem: string, branch: string): number {
  const stemIdx = TIANGAN_INDEX[stem];
  const branchIdx = DIZHI_INDEX[branch];
  return mod(stemIdx * 6 - branchIdx * 5, 60);
}

// ============================================================
// 1. 大运方向判断
// ============================================================

/**
 * 大运方向判断（对应规则 #10）
 *
 * 以**年干阴阳**为准（非日干！）：
 *   - 阳年男 / 阴年女 → 顺排（forward）
 *   - 阴年男 / 阳年女 → 逆排（backward）
 *
 * @param yearStem 年柱天干
 * @param gender 性别（male / female）
 * @returns 'forward'（顺排）或 'backward'（逆排）
 *
 * @example
 * // 甲年男 → 阳年男 → 顺排
 * getDaYunDirection('甲', 'male') // => 'forward'
 * // 乙年男 → 阴年男 → 逆排
 * getDaYunDirection('乙', 'male') // => 'backward'
 * // 甲年女 → 阳年女 → 逆排
 * getDaYunDirection('甲', 'female') // => 'backward'
 * // 乙年女 → 阴年女 → 顺排
 * getDaYunDirection('乙', 'female') // => 'forward'
 */
export function getDaYunDirection(
  yearStem: string,
  gender: 'male' | 'female'
): 'forward' | 'backward' {
  const yearYinYang = TIANGAN_YINYANG[yearStem]; // '阳' or '阴'

  if (yearYinYang === '阳') {
    // 阳年：男顺排，女逆排
    return gender === 'male' ? 'forward' : 'backward';
  } else {
    // 阴年：女顺排，男逆排
    return gender === 'female' ? 'forward' : 'backward';
  }
}

// ============================================================
// 2. 起运岁数计算
// ============================================================

/**
 * 起运岁数计算（对应规则 #11 和数据表 11.20）
 *
 * 计算步骤：
 *   1. 调用 getNearestJie(birthTime, direction) 获取最近的"节"交节时刻
 *      - 顺排（forward）：找出生时刻之后的下一个"节"
 *      - 逆排（backward）：找出生时刻之前的上一个"节"
 *   2. 计算出生时刻到目标"节"的时间差（精确到分钟）
 *   3. 换算为起运岁数：
 *      - 3天 = 1岁 → 1岁 = 4320分钟
 *      - 1天 = 4月 → 1月 = 360分钟（6小时）
 *      - 1时辰(2小时) = 10天 → 1天 = 12分钟
 *      - 1分钟 = 2小时（大运时间）
 *
 * 换算公式（对应 11.20 节）：
 *   - 岁 = Math.floor(总分钟数 / 4320)
 *   - 月 = Math.floor(余数1 / 360)
 *   - 天 = Math.floor(余数2 / 12)
 *   - 时 = 余数3 × 2
 *
 * @param birthTime 出生时刻（真太阳时 Date 对象）
 * @param direction 'forward'（顺排，数到下一个节）或 'backward'（逆排，数到上一个节）
 * @returns 起运岁数 { years, months, days, hours, totalMinutes }
 *
 * @example
 * // 验证示例（11.20节）：
 * // 出生时刻到下一个节的差为10天5小时30分钟
 * // 总分钟数 = 10×1440 + 5×60 + 30 = 14730
 * // 岁 = 14730 ÷ 4320 = 3岁（余 1770）
 * // 月 = 1770 ÷ 360 = 4月（余 330）
 * // 天 = 330 ÷ 12 = 27天（余 6）
 * // 时 = 6 × 2 = 12时
 * // 起运 = 3岁4月27天12时
 */
export function getStartAge(
  birthTime: Date,
  direction: 'forward' | 'backward'
): StartAgeResult {
  // 步骤1：获取最近的"节"交节时刻
  const jie = getNearestJie(birthTime, direction);

  if (!jie || !jie.time) {
    throw new Error(
      `无法获取最近"节"交节时刻：birthTime=${birthTime.toISOString()}, direction=${direction}`
    );
  }

  // 步骤2：计算时间差（精确到分钟）
  const diffMs = Math.abs(birthTime.getTime() - jie.time.getTime());
  const totalMinutes = Math.floor(diffMs / (60 * 1000));

  // 步骤3：换算为起运岁数（对应 11.20 节公式）
  // 岁 = Math.floor(总分钟数 / 4320)
  const years = Math.floor(totalMinutes / MINUTES_PER_YEAR);
  const remainder1 = totalMinutes % MINUTES_PER_YEAR;

  // 月 = Math.floor(余数1 / 360)
  const months = Math.floor(remainder1 / MINUTES_PER_MONTH);
  const remainder2 = remainder1 % MINUTES_PER_MONTH;

  // 天 = Math.floor(余数2 / 12)
  const days = Math.floor(remainder2 / MINUTES_PER_DAY);
  const remainder3 = remainder2 % MINUTES_PER_DAY;

  // 时 = 余数3 × 2（大运时间）
  const hours = remainder3 * HOURS_PER_MINUTE;

  return {
    years,
    months,
    days,
    hours,
    totalMinutes,
  };
}

// ============================================================
// 3. 大运排盘
// ============================================================

/**
 * 大运排盘（对应规则 #10 和 #7b）
 *
 * - 大运从月柱**下一柱**（顺排）或**上一柱**（逆排）开始
 * - 共排8步大运（80年），每步10年
 * - 六十甲子序号计算：ganzhiIndex = (stemIndex × 6 - branchIndex × 5) mod 60
 *   - 顺排：从 ganzhiIndex + 1 开始，每次 +1
 *   - 逆排：从 ganzhiIndex - 1 开始，每次 -1
 *
 * @param monthPillar 月柱
 * @param direction 'forward'（顺排）或 'backward'（逆排）
 * @param startAge 起运岁数 { years, months, days, hours }
 * @param birthYear 出生公历年
 * @returns 大运列表（8步）
 *
 * @example
 * // 月柱丙寅（ganzhiIndex=2），顺排
 * // 第一步大运 = 丁卯（ganzhiIndex=3），起运岁数 = startAge.years
 * // 第二步大运 = 戊辰（ganzhiIndex=4），起运岁数 = startAge.years + 10
 * // ...
 */
export function calculateDaYun(
  monthPillar: Pillar,
  direction: 'forward' | 'backward',
  startAge: { years: number; months: number; days: number; hours: number },
  birthYear: number
): DaYunItem[] {
  // 计算月柱的六十甲子序号
  const monthGanzhiIndex = getGanzhiIndex(monthPillar.stem, monthPillar.branch);

  // 方向符号：顺排 +1，逆排 -1
  const stepSign = direction === 'forward' ? 1 : -1;

  const daYunItems: DaYunItem[] = [];

  for (let i = 0; i < DA_YUN_STEPS; i++) {
    // 大运干支序号：从月柱下一柱（顺）/上一柱（逆）开始
    const pillarIndex = mod(monthGanzhiIndex + (i + 1) * stepSign, 60);

    // 天干 = 序号 % 10，地支 = 序号 % 12
    const stem = TIANGAN[pillarIndex % 10];
    const branch = DIZHI[pillarIndex % 12];
    const pillar = buildPillar(stem, branch);

    // 起运岁数与年份
    const stepStartAge = startAge.years + i * DA_YUN_STEP_YEARS;
    const stepEndAge = stepStartAge + DA_YUN_STEP_YEARS;
    const stepStartYear = birthYear + stepStartAge;
    const stepEndYear = stepStartYear + DA_YUN_STEP_YEARS;

    daYunItems.push({
      pillar,
      startAge: stepStartAge,
      startYear: stepStartYear,
      endAge: stepEndAge,
      endYear: stepEndYear,
      // 十神后续计算，此处留空
      tenGod: undefined,
    });
  }

  return daYunItems;
}

// ============================================================
// 4. 流年排盘
// ============================================================

/**
 * 流年排盘（对应规则 #12）
 *
 * - 流年逐年干支，年柱干支序号 = (year - 4) % 60
 * - 排大运覆盖的年份范围内的流年
 * - 虚岁 = year - birthYear + 1
 *
 * @param birthYear 出生公历年（用于计算虚岁）
 * @param daYunItems 大运列表（用于确定流年年份范围）
 * @returns 流年列表
 *
 * @example
 * // 1984年出生，大运起始年1992
 * // 流年1992 → 年柱干支 = (1992 - 4) % 60 = 1988 % 60 = 28 → 壬辰
 * // 虚岁 = 1992 - 1984 + 1 = 9岁
 */
export function calculateLiuNian(
  birthYear: number,
  daYunItems: DaYunItem[]
): LiuNianItem[] {
  if (daYunItems.length === 0) {
    return [];
  }

  // 流年年份范围：从第一步大运起始年到最后一步大运止运年
  const startYear = daYunItems[0].startYear;
  const endYear = daYunItems[daYunItems.length - 1].endYear;

  const liuNianItems: LiuNianItem[] = [];

  for (let year = startYear; year < endYear; year++) {
    // 年柱干支序号 = (year - 4) % 60（year=4 AD 是甲子年）
    const ganzhiIndex = mod(year - 4, 60);

    // 天干 = 序号 % 10，地支 = 序号 % 12
    const stem = TIANGAN[ganzhiIndex % 10];
    const branch = DIZHI[ganzhiIndex % 12];
    const pillar = buildPillar(stem, branch);

    // 虚岁 = year - birthYear + 1
    const age = year - birthYear + 1;

    liuNianItems.push({
      year,
      pillar,
      age,
    });
  }

  return liuNianItems;
}

// ============================================================
// 5. 小运排盘
// ============================================================

/**
 * 小运排盘（对应规则 #12）
 *
 * - 小运以**时柱**为起点
 * - 阳男阴女顺行 / 阴男阳女逆行（同大运方向）
 * - **虚岁一岁起运**：虚岁1岁 = 时柱本身，2岁 = 时柱下一柱（顺）/上一柱（逆）
 * - 逐年行一柱，共排60步
 *
 * @param timePillar 时柱
 * @param direction 'forward'（顺行）或 'backward'（逆行），同大运方向
 * @returns 小运列表（60步，虚岁1~60岁）
 *
 * @example
 * // 时柱甲子（ganzhiIndex=0），顺行
 * // 虚岁1岁 = 甲子（时柱本身）
 * // 虚岁2岁 = 乙丑（ganzhiIndex=1）
 * // 虚岁3岁 = 丙寅（ganzhiIndex=2）
 * // ...
 */
export function calculateXiaoYun(
  timePillar: Pillar,
  direction: 'forward' | 'backward'
): XiaoYunItem[] {
  // 计算时柱的六十甲子序号
  const timeGanzhiIndex = getGanzhiIndex(timePillar.stem, timePillar.branch);

  // 方向符号：顺行 +1，逆行 -1
  const stepSign = direction === 'forward' ? 1 : -1;

  const xiaoYunItems: XiaoYunItem[] = [];

  for (let age = 1; age <= XIAO_YUN_STEPS; age++) {
    // 虚岁1岁 = 时柱本身（偏移0），2岁 = 偏移1，3岁 = 偏移2，...
    const offset = age - 1;
    const pillarIndex = mod(timeGanzhiIndex + offset * stepSign, 60);

    // 天干 = 序号 % 10，地支 = 序号 % 12
    const stem = TIANGAN[pillarIndex % 10];
    const branch = DIZHI[pillarIndex % 12];
    const pillar = buildPillar(stem, branch);

    xiaoYunItems.push({
      age,
      pillar,
    });
  }

  return xiaoYunItems;
}

// ============================================================
// 6. 主函数
// ============================================================

/**
 * 大运流年计算主函数
 *
 * 整合大运方向判断、起运岁数计算、大运排盘、流年排盘、小运排盘，
 * 输出完整的大运流年结果。
 *
 * 计算流程：
 *   1. 从四柱结果获取年柱天干，判断大运方向（年干阴阳 + 性别）
 *   2. 用真太阳时计算起运岁数（出生时刻到最近"节"的时间差）
 *   3. 从月柱开始排8步大运
 *   4. 排大运覆盖年份范围内的流年
 *   5. 从时柱开始排60步小运
 *
 * @param input 排盘输入（需要 gender 和 birthDate）
 * @param fourPillars 四柱排盘结果（需要 yearPillar, monthPillar, timePillar, trueSolarTime）
 * @returns { daYun, liuNian, xiaoYun }
 *
 * @example
 * // 命例：1984-02-04 23:30 男 北京
 * // 年柱甲子（阳年男 → 顺排）
 * // 月柱丙寅 → 第一步大运丁卯
 * // 起运岁数由出生时刻到下一个"节"的时间差决定
 * calculateDaYunAndLiuYun(input, fourPillars)
 * // => { daYun: [...], liuNian: [...], xiaoYun: [...] }
 */
export function calculateDaYunAndLiuYun(
  input: BaziInput,
  fourPillars: FourPillarsResult
): DaYunAndLiuYunResult {
  // 步骤1：从四柱结果获取年柱天干，判断大运方向
  const yearStem = fourPillars.yearPillar.stem;
  const direction = getDaYunDirection(yearStem, input.gender);

  // 步骤2：用真太阳时计算起运岁数
  const startAge = getStartAge(fourPillars.trueSolarTime, direction);

  // 步骤3：从输入解析出生年份（用于计算虚岁和大运起始年）
  // birthDate 格式为 YYYY-MM-DD
  const birthYear = parseInt(input.birthDate.substring(0, 4), 10);

  // 步骤4：排8步大运（从月柱开始）
  const daYun = calculateDaYun(
    fourPillars.monthPillar,
    direction,
    startAge,
    birthYear
  );

  // 步骤5：排流年（覆盖大运年份范围）
  const liuNian = calculateLiuNian(birthYear, daYun);

  // 步骤6：排60步小运（从时柱开始，方向同大运）
  const xiaoYun = calculateXiaoYun(fourPillars.timePillar, direction);

  return {
    daYun,
    liuNian,
    xiaoYun,
  };
}
