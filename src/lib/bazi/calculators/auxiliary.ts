/**
 * 辅助宫位计算模块（胎元 / 命宫 / 身宫）
 *
 * 对应项目大纲：
 * - 规则 #13、数据表 11.1：胎元三法（前三百日法 / 月干进位法 / 受胎月法）
 * - 规则 #14、数据表 11.15：命宫排法（子上起正月逆数至生月，安时顺数至卯，逢卯即安命宫）
 * - 规则 #15、数据表 11.16：身宫排法（命顺身逆 / 命逆身顺；逢酉安身法）
 *
 * 三宫均复用 Pillar 结构（含藏干、纳音）。
 * 命宫、身宫的天干统一用五虎遁从年干推算。
 *
 * @module bazi/calculators/auxiliary
 */

import { TIANGAN, TIANGAN_INDEX, WU_HU_DUN_START, TIANGAN_YINYANG } from '../constants/tiangan';
import { DIZHI, DIZHI_INDEX } from '../constants/dizhi';
import { CANGGAN_MAP } from '../constants/canggan';
import { getNayin } from '../constants/nayin';
import { getDayPillar } from './four-pillars';
import type { FourPillarsResult } from './four-pillars';
import type { Pillar, BaziInput, TianGan, DiZhi, WuXing } from '../types';

// ============================================================
// 内部常量
// ============================================================

/**
 * 月支顺序（从寅开始，对应正月）
 *
 * 寅(0) 卯(1) 辰(2) 巳(3) 午(4) 未(5)
 * 申(6) 酉(7) 戌(8) 亥(9) 子(10) 丑(11)
 *
 * 对应项目大纲 11.11 节月支与节气对应表。
 * 命宫生月序号 = 该顺序中的位置 + 1（寅=1, 卯=2, ..., 丑=12）。
 */
const YUEZHI_ORDER = [
  '寅', '卯', '辰', '巳', '午', '未',
  '申', '酉', '戌', '亥', '子', '丑',
] as const;

/** 一天的毫秒数（用于前三百日法前推日期） */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** 前三百日法固定前推天数（《三命通会》卷二："以当生前三百日为十月之气"） */
const FORWARD_300_DAYS = 300;

/** 卯在地支序列中的索引（子=0 体系），命宫"逢卯即安"用 */
const MAO_INDEX = 3;

/** 酉在地支序列中的索引（子=0 体系），身宫"逢酉安身法"用 */
const YOU_INDEX = 9;

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
 * mod(-1, 12) // => 11
 * mod(5, 12)  // => 5
 */
function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/**
 * 构建 Pillar 对象
 *
 * 根据天干和地支，查表填充藏干（CANGGAN_MAP）和纳音（getNayin）信息。
 * 与 four-pillars.ts 中的 buildPillar 行为一致，保证三宫结构与四柱统一。
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
 * 用五虎遁从年干推算某地支对应的天干
 *
 * 五虎遁：年干→寅月天干，然后按寅卯辰巳午未申酉戌亥子丑顺序顺排。
 * 命宫、身宫的天干均用此法从年干推（与月干推法相同）。
 *
 * @param yearStem 年柱天干
 * @param branch 目标地支（须为月支序列中的地支，即十二地支之一）
 * @returns 该地支在当年五虎遁体系下对应的天干
 */
function getStemByWuHuDun(yearStem: string, branch: string): string {
  const startStem = WU_HU_DUN_START[yearStem]; // 寅月的天干
  const startStemIdx = TIANGAN_INDEX[startStem];
  // 目标地支在月支顺序中的位置（寅=0, 卯=1, ..., 丑=11）
  const yuezhiIdx = YUEZHI_ORDER.indexOf(branch as (typeof YUEZHI_ORDER)[number]);

  // 天干 = (寅月天干索引 + 月支位置) % 10
  const stemIdx = mod(startStemIdx + yuezhiIdx, 10);
  return TIANGAN[stemIdx];
}

// ============================================================
// 1. 胎元计算
// ============================================================

/**
 * 计算胎元
 *
 * 对应规则 #13、数据表 11.1。三法支持，默认前三百日法。
 *
 * **方法1（默认）：前三百日法**
 * - 来源：《三命通会》卷二原文："以当生前三百日为十月之气"
 * - 从出生日前推300天，计算那一天的干支为胎元
 * - 注：300 = 5 × 60，故胎元干支与日柱相同（"找同干支日"），
 *   此处仍按算法实际前推300天后调用 getDayPillar 计算，以保证忠实于古籍算法
 *
 * **方法2：月干进一位、月支进三位法**
 * - 来源：民间简化口诀，非古籍正法
 * - 从月柱起，天干进一位、地支进三位。如丙寅月 → 丁巳为胎元
 *
 * **方法3：受胎月法**
 * - 以出生月前推十个月所在月份为胎元月
 * - 简化实现：月干退10位（天干10位一循环，mod 10 不变，故天干不变），
 *   月支退10位（mod 12 等价于进2位）。由于10个月恰为"1年+2月"，
 *   五虎遁起干退2位、月份进2位，净偏移为0，故天干恒等于月干
 *
 * @param birthDate 出生日期（真太阳时 Date 对象）
 * @param dayPillar 日柱（前三百日法结果与之同干支，因 300 = 5×60）
 * @param monthPillar 月柱（方法2、方法3 使用）
 * @param method 计算方法，默认 'forward300'
 * @returns 胎元柱
 *
 * @example
 * // 方法2：丙寅月 → 丁巳为胎元
 * calculateTaiYuan(birthDate, dayPillar, { stem: '丙', branch: '寅', hiddenStems: [] }, 'stemBranchAdvance')
 * // => { stem: '丁', branch: '巳', ... }
 */
export function calculateTaiYuan(
  birthDate: Date,
  dayPillar: Pillar,
  monthPillar: Pillar,
  method: 'forward300' | 'stemBranchAdvance' | 'conceptionMonth' = 'forward300'
): Pillar {
  if (method === 'stemBranchAdvance') {
    // 月干进一位、月支进三位法（民间简化口诀，非古籍正法）
    // 如丙寅月 → 丁巳为胎元
    const monthStemIdx = TIANGAN_INDEX[monthPillar.stem];
    const monthBranchIdx = DIZHI_INDEX[monthPillar.branch];
    const stemIdx = mod(monthStemIdx + 1, 10);
    const branchIdx = mod(monthBranchIdx + 3, 12);
    return buildPillar(TIANGAN[stemIdx], DIZHI[branchIdx]);
  }

  if (method === 'conceptionMonth') {
    // 受胎月法：以出生月前推十个月所在月份为胎元月
    // 月干退10位（mod 10 不变）、月支退10位（mod 12）
    const monthStemIdx = TIANGAN_INDEX[monthPillar.stem];
    const monthBranchIdx = DIZHI_INDEX[monthPillar.branch];
    const stemIdx = mod(monthStemIdx - 10, 10);
    const branchIdx = mod(monthBranchIdx - 10, 12);
    return buildPillar(TIANGAN[stemIdx], DIZHI[branchIdx]);
  }

  // 前三百日法（默认，《三命通会》卷二原文）
  // 从出生日前推300天，计算那一天的干支为胎元
  // 300 = 5 × 60，故结果与日柱（dayPillar）同干支
  const conceptionDate = new Date(
    birthDate.getTime() - FORWARD_300_DAYS * ONE_DAY_MS
  );
  const { stem, branch } = getDayPillar(conceptionDate);
  return buildPillar(stem, branch);
}

// ============================================================
// 2. 命宫计算
// ============================================================

/**
 * 计算命宫
 *
 * 对应规则 #14、数据表 11.15。
 *
 * 口诀："子上起正月逆数至生月，安时顺数至卯。逢卯即安命宫。"
 * （《三命通会》卷二"逢卯即安命宫"）
 *
 * **公式化**（生月序号：寅=1, 卯=2, ..., 丑=12；生时索引：子=0, ..., 亥=11）：
 * - A = (1 - 生月序号) mod 12 （结果：0=子, 1=丑, ..., 11=亥）
 * - 偏移 = (3 - 生时索引) mod 12 （3 = 卯的索引）
 * - 命宫索引 = (A + 偏移) mod 12
 *
 * 注意：生月序号按寅=1起编（非子=0体系），生时索引按子=0起编，两套索引体系不同。
 *
 * 命宫天干用五虎遁从年干推算（按命宫地支在月支顺序中的位置）。
 *
 * @param monthBranch 月柱地支
 * @param timeBranch 时柱地支
 * @param yearStem 年柱天干
 * @returns 命宫柱
 *
 * @example
 * // 正月(寅) 子时 → 命宫=卯
 * calculateMingGong('寅', '子', '甲') // => { branch: '卯', ... }
 * // 三月(辰) 子时 → 命宫=丑
 * calculateMingGong('辰', '子', '甲') // => { branch: '丑', ... }
 * // 八月(酉) 辰时 → 命宫=辰
 * calculateMingGong('酉', '辰', '甲') // => { branch: '辰', ... }
 */
export function calculateMingGong(
  monthBranch: string,
  timeBranch: string,
  yearStem: string
): Pillar {
  // 生月序号：寅=1, 卯=2, ..., 丑=12（= 月支在 YUEZHI_ORDER 中的位置 + 1）
  const monthSerial =
    YUEZHI_ORDER.indexOf(monthBranch as (typeof YUEZHI_ORDER)[number]) + 1;

  // A = (1 - 生月序号) mod 12（结果：0=子, 1=丑, ..., 11=亥）
  const a = mod(1 - monthSerial, 12);

  // 偏移 = (3 - 生时索引) mod 12（3 = 卯的索引）
  const timeIdx = DIZHI_INDEX[timeBranch];
  const offset = mod(MAO_INDEX - timeIdx, 12);

  // 命宫索引 = (A + 偏移) mod 12
  const mingGongIdx = mod(a + offset, 12);
  const mingGongBranch = DIZHI[mingGongIdx];

  // 命宫天干：五虎遁从年干推
  const mingGongStem = getStemByWuHuDun(yearStem, mingGongBranch);

  return buildPillar(mingGongStem, mingGongBranch);
}

// ============================================================
// 3. 身宫计算
// ============================================================

/**
 * 计算身宫
 *
 * 对应规则 #15、数据表 11.16。两法支持，默认古今图书集成法。
 *
 * **方法1（默认）：古今图书集成法**
 * - 来源：《古今图书集成·艺术典》卷六百九十八
 * - 口诀："将本人生月支加生日支，如命顺则身逆，如命逆则身顺，数至生时支便安身宫。"
 * - 命的顺逆由年干阴阳+性别决定（与日柱天干无关）：
 *   阳男/阴女=命顺→身逆；阴男/阳女=命逆→身顺
 * - 公式化（地支索引：子=0,丑=1,...,亥=11）：
 *   - 偏移 = (生时支索引 - 生月支索引) mod 12
 *   - 命顺→身逆：身宫 = (生日支索引 - 偏移) mod 12
 *   - 命逆→身顺：身宫 = (生日支索引 + 偏移) mod 12
 *
 * **方法2：逢酉安身法**
 * - 逢酉即安身（类比逢卯安命）
 * - 来源：《神峰通考》五星正说类
 * - 注意：此法属五星正说类，不等于八字完整起例
 * - 实现：与命宫公式同构，将目标由卯(3)改为酉(9)
 *   - A = (1 - 生月序号) mod 12
 *   - 偏移 = (9 - 生时索引) mod 12
 *   - 身宫索引 = (A + 偏移) mod 12
 *
 * 身宫天干用五虎遁从年干推算（与命宫同法）。
 *
 * @param monthBranch 月柱地支
 * @param dayBranch 日柱地支
 * @param timeBranch 时柱地支
 * @param yearStem 年柱天干
 * @param gender 性别
 * @param method 计算方法，默认 'gujinTushu'
 * @returns 身宫柱
 *
 * @example
 * // 古今图书集成法示例（《古今图书集成》原文例）：
 * // 生月=巳(索引5)，生日=未(索引7)，生时=寅(索引2)，阴男（命逆→身顺）
 * // 偏移 = (2 - 5) mod 12 = 9
 * // 身宫 = (7 + 9) mod 12 = 4 = 辰
 * calculateShenGong('巳', '未', '寅', '乙', 'male', 'gujinTushu')
 * // => { branch: '辰', ... }
 */
export function calculateShenGong(
  monthBranch: string,
  dayBranch: string,
  timeBranch: string,
  yearStem: string,
  gender: 'male' | 'female',
  method: 'gujinTushu' | 'fengyou' = 'gujinTushu'
): Pillar {
  if (method === 'fengyou') {
    // 逢酉安身法：类比逢卯安命，将目标改为酉
    // A = (1 - 生月序号) mod 12，偏移 = (9 - 生时索引) mod 12（9 = 酉的索引）
    const monthSerial =
      YUEZHI_ORDER.indexOf(monthBranch as (typeof YUEZHI_ORDER)[number]) + 1;
    const a = mod(1 - monthSerial, 12);
    const timeIdx = DIZHI_INDEX[timeBranch];
    const offset = mod(YOU_INDEX - timeIdx, 12);
    const shenGongIdx = mod(a + offset, 12);
    const shenGongBranch = DIZHI[shenGongIdx];
    const shenGongStem = getStemByWuHuDun(yearStem, shenGongBranch);
    return buildPillar(shenGongStem, shenGongBranch);
  }

  // 古今图书集成法（默认）
  const monthIdx = DIZHI_INDEX[monthBranch];
  const dayIdx = DIZHI_INDEX[dayBranch];
  const timeIdx = DIZHI_INDEX[timeBranch];

  // 偏移 = (生时支索引 - 生月支索引) mod 12
  const offset = mod(timeIdx - monthIdx, 12);

  // 判断命的顺逆：阳男/阴女=命顺；阴男/阳女=命逆
  // 由年干阴阳 + 性别决定，与日柱天干无关
  const yearStemYinYang = TIANGAN_YINYANG[yearStem];
  const isMingShun =
    (yearStemYinYang === '阳' && gender === 'male') ||
    (yearStemYinYang === '阴' && gender === 'female');

  // 命顺→身逆：身宫 = (生日支索引 - 偏移) mod 12
  // 命逆→身顺：身宫 = (生日支索引 + 偏移) mod 12
  const shenGongIdx = isMingShun
    ? mod(dayIdx - offset, 12)
    : mod(dayIdx + offset, 12);
  const shenGongBranch = DIZHI[shenGongIdx];

  // 身宫天干：五虎遁从年干推
  const shenGongStem = getStemByWuHuDun(yearStem, shenGongBranch);

  return buildPillar(shenGongStem, shenGongBranch);
}

// ============================================================
// 4. 主函数：辅助宫位整合计算
// ============================================================

/**
 * 辅助宫位计算主函数
 *
 * 整合胎元、命宫、身宫的计算，输出三宫柱。
 *
 * 从四柱排盘结果（fourPillars）获取：
 * - dayPillar（日柱：胎元前三百日法参考、身宫生日支）
 * - monthPillar（月柱：胎元方法2/3、命宫/身宫生月支）
 * - yearPillar（年柱：命宫/身宫天干五虎遁起算）
 * - timePillar（时柱：命宫/身宫生时支）
 * - trueSolarTime（真太阳时：胎元前三百日法前推基准）
 *
 * 从排盘输入（input）获取：
 * - gender（性别：身宫命顺逆判断）
 * - taiyuanMethod（胎元计算方法，默认 forward300）
 * - shengongMethod（身宫计算方法，默认 gujinTushu）
 *
 * @param input 排盘输入
 * @param fourPillars 四柱排盘结果
 * @returns { taiYuan, mingGong, shenGong }
 */
export function calculateAuxiliaryPalaces(
  input: BaziInput,
  fourPillars: FourPillarsResult
): { taiYuan: Pillar; mingGong: Pillar; shenGong: Pillar } {
  const { dayPillar, monthPillar, yearPillar, timePillar, trueSolarTime } =
    fourPillars;

  const { gender } = input;
  const taiyuanMethod = input.taiyuanMethod ?? 'forward300';
  const shengongMethod = input.shengongMethod ?? 'gujinTushu';

  // 胎元
  const taiYuan = calculateTaiYuan(
    trueSolarTime,
    dayPillar,
    monthPillar,
    taiyuanMethod
  );

  // 命宫
  const mingGong = calculateMingGong(
    monthPillar.branch,
    timePillar.branch,
    yearPillar.stem
  );

  // 身宫
  const shenGong = calculateShenGong(
    monthPillar.branch,
    dayPillar.branch,
    timePillar.branch,
    yearPillar.stem,
    gender,
    shengongMethod
  );

  return { taiYuan, mingGong, shenGong };
}
