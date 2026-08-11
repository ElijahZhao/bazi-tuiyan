/**
 * 四柱排盘核心模块
 *
 * 对应项目大纲：规则 #6~#9（四柱排盘），是整个排盘引擎最关键的模块。
 *
 * 四柱排盘包括：
 * - 年柱：以立春交节时刻为界（规则 #6）
 * - 月柱：以十二节划分，月干用五虎遁（规则 #7）
 * - 日柱：干支纪日从公元前720年连续至今，以零点为日始（规则 #8）
 * - 时柱：时支按时辰，时干用五鼠遁（规则 #9）
 *
 * 夜子时规则（规则 #8 关键）：
 * - 夜子时（23:00-00:00）：日柱用当日，时柱用次日日干遁五鼠遁
 *   例如：戊辰日23:30 → 日柱戊辰，次日日干己，五鼠遁"甲己还加甲"→时柱甲子
 * - 子正（00:00-01:00）：日柱和时柱均用当日（新一日）日干遁五鼠遁
 *
 * @module bazi/calculators/four-pillars
 */

import { correctTime, getShiZhi } from './time-correction';
import { checkLichunBoundary, getBirthMonthBranch } from './solar-terms';
import { TIANGAN, TIANGAN_INDEX, WU_HU_DUN_START, WU_SHU_DUN_START } from '../constants/tiangan';
import { DIZHI, DIZHI_INDEX } from '../constants/dizhi';
import { getNayin } from '../constants/nayin';
import { CANGGAN_MAP } from '../constants/canggan';
import type { BaziInput, Pillar, TianGan, DiZhi, WuXing } from '../types';

// ============================================================
// 返回类型定义
// ============================================================

/**
 * 四柱排盘结果
 *
 * 包含完整的年月日时四柱信息，以及时间校正说明和夜子时标记。
 */
export interface FourPillarsResult {
  /** 真太阳时（钟表时间→夏令时还原→经度差修正→均时差修正后的结果） */
  trueSolarTime: Date;
  /** 年柱（以立春交节时刻为界） */
  yearPillar: Pillar;
  /** 月柱（以十二节划分，月干用五虎遁） */
  monthPillar: Pillar;
  /** 日柱（以零点为日始；夜子时日柱用当日） */
  dayPillar: Pillar;
  /** 时柱（时干用五鼠遁） */
  timePillar: Pillar;
  /** 日主 = 日柱天干 */
  dayMaster: string;
  /** 时间校正步骤说明 */
  corrections: string[];
  /** 是否为夜子时（23:00-00:00） */
  isNightZiShi: boolean;
}

// ============================================================
// 内部常量
// ============================================================

/**
 * 日柱计算参考点：1900-01-31 = 甲辰日
 *
 * - 天干索引：0（甲）
 * - 地支索引：4（辰）
 * - 六十甲子序号：40
 *
 * 干支纪日从公元前720年连续至今，从未间断。
 * 参考点来源：光明日报《中国古天文历法学》
 */
const REF_DATE_UTC = new Date(Date.UTC(1900, 0, 31)); // 1900-01-31 00:00:00 UTC
const REF_GANZHI_INDEX = 40; // 甲辰在六十甲子中的序号（0-59）

/**
 * 月支顺序（从寅开始，对应正月）
 *
 * 寅(0) 卯(1) 辰(2) 巳(3) 午(4) 未(5)
 * 申(6) 酉(7) 戌(8) 亥(9) 子(10) 丑(11)
 *
 * 对应项目大纲 11.11 节月支与节气对应表。
 */
const YUEZHI_ORDER = [
  '寅', '卯', '辰', '巳', '午', '未',
  '申', '酉', '戌', '亥', '子', '丑',
] as const;

/**
 * 一天的毫秒数（用于计算次日日期）
 */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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

// ============================================================
// 1. 日柱计算
// ============================================================

/**
 * 计算日柱干支
 *
 * 干支纪日从公元前720年（春秋鲁隐公三年）连续至今，从未间断。
 *
 * 计算方法：
 * - 参考点：1900-01-31 = 甲辰日（天干索引0，地支索引4，六十甲子序号40）
 * - 对于任意日期，计算与参考点的天数差，然后 mod 60 得到六十甲子序号
 * - stem_index = ganzhiIndex % 10
 * - branch_index = ganzhiIndex % 12
 *
 * 重要注意事项：
 * - 必须用 UTC 时间计算天数差，避免时区影响
 * - 对于夜子时（23:00-00:00），日柱仍然用当天，不用次日
 * - 对于子正（00:00-01:00），日柱用新的一天
 *
 * @param date 日期（真太阳时 Date 对象，用本地方法读取年月日）
 * @returns { stem, branch, ganzhiIndex }
 *
 * @example
 * // 1984-02-04 = 戊辰日
 * // 从1900-01-31到1984-02-04的天数差 = 30684天
 * // (40 + 30684) % 60 = 30724 % 60 = 4 → 戊辰
 * getDayPillar(new Date(1984, 1, 4))
 * // => { stem: '戊', branch: '辰', ganzhiIndex: 4 }
 */
export function getDayPillar(date: Date): {
  stem: string;
  branch: string;
  ganzhiIndex: number;
} {
  // 提取日期的年月日（使用本地方法获取真太阳时的日历日期）
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // 使用 UTC 日期计算天数差，避免时区/DST 影响天数计数
  const targetDateUTC = new Date(Date.UTC(year, month, day));

  // 天数差 = (目标日期 - 参考日期) / 一天毫秒数
  // 使用 Math.round 避免浮点精度问题
  const dayDiff = Math.round(
    (targetDateUTC.getTime() - REF_DATE_UTC.getTime()) / ONE_DAY_MS
  );

  // 六十甲子序号 = (参考点序号 + 天数差) mod 60
  const ganzhiIndex = mod(REF_GANZHI_INDEX + dayDiff, 60);

  // 天干索引 = 序号 % 10，地支索引 = 序号 % 12
  const stemIndex = ganzhiIndex % 10;
  const branchIndex = ganzhiIndex % 12;

  return {
    stem: TIANGAN[stemIndex],
    branch: DIZHI[branchIndex],
    ganzhiIndex,
  };
}

// ============================================================
// 2. 年柱计算
// ============================================================

/**
 * 计算年柱干支
 *
 * 对应规则 #6：年柱以立春交节时刻为界
 * - 立春前出生 → 用上一年干支
 * - 立春后出生 → 用当年干支
 *
 * 年柱干支序号 = (year - 4) % 60（year=4 AD 是甲子年）
 * - stem_index = ganzhiIndex % 10
 * - branch_index = ganzhiIndex % 12
 *
 * @param birthTime 出生时间（真太阳时 Date 对象）
 * @returns { stem, branch, ganzhiIndex, year }
 *
 * @example
 * // 1984年立春后 → 甲子年
 * getYearPillar(trueSolarTime) // => { stem: '甲', branch: '子', ganzhiIndex: 0, year: 1984 }
 * // 1990年立春前 → 己巳年（上一年）
 * getYearPillar(trueSolarTime) // => { stem: '己', branch: '巳', ganzhiIndex: 5, year: 1989 }
 */
export function getYearPillar(birthTime: Date): {
  stem: string;
  branch: string;
  ganzhiIndex: number;
  year: number;
} {
  // 判断是否在立春之后，获取应使用的年份
  const { year } = checkLichunBoundary(birthTime);

  // 年柱干支序号 = (year - 4) % 60
  // year=4 AD 是甲子年（序号0）
  const ganzhiIndex = mod(year - 4, 60);

  const stemIndex = ganzhiIndex % 10;
  const branchIndex = ganzhiIndex % 12;

  return {
    stem: TIANGAN[stemIndex],
    branch: DIZHI[branchIndex],
    ganzhiIndex,
    year,
  };
}

// ============================================================
// 3. 月柱计算
// ============================================================

/**
 * 计算月柱干支
 *
 * 对应规则 #7：月柱以十二节划分，月干用五虎遁
 *
 * 计算方法：
 * 1. 用 getBirthMonthBranch(birthTime) 获取月支（由出生时刻所在的节气区间确定）
 * 2. 用五虎遁从年干推月干：
 *    - 年干甲/己 → 寅月天干为丙（甲己之年丙作首）
 *    - 年干乙/庚 → 寅月天干为戊（乙庚之岁戊为头）
 *    - 年干丙/辛 → 寅月天干为庚（丙辛必定寻庚起）
 *    - 年干丁/壬 → 寅月天干为壬（丁壬壬位顺行流）
 *    - 年干戊/癸 → 寅月天干为甲（戊癸甲寅之上好追求）
 * 3. 从寅月天干开始，按月支顺序（寅卯辰巳午未申酉戌亥子丑）顺排
 *
 * @param birthTime 出生时间（真太阳时 Date 对象）
 * @param yearStem 年柱天干
 * @returns { stem, branch }
 *
 * @example
 * // 1984年（甲年）立春后 → 月支寅，五虎遁甲年丙作首 → 丙寅
 * getMonthPillar(trueSolarTime, '甲') // => { stem: '丙', branch: '寅' }
 */
export function getMonthPillar(birthTime: Date, yearStem: string): {
  stem: string;
  branch: string;
} {
  // 步骤1：获取月支（由出生时刻所在的节气区间确定）
  const monthBranchInfo = getBirthMonthBranch(birthTime);
  const monthBranch = monthBranchInfo?.yuezhi ?? '寅'; // 兜底默认寅月

  // 步骤2：五虎遁——从年干推寅月天干
  const startStem = WU_HU_DUN_START[yearStem]; // 寅月的天干
  const startStemIdx = TIANGAN_INDEX[startStem];

  // 步骤3：月支在月支顺序中的位置
  // 寅(0) 卯(1) 辰(2) ... 丑(11)
  const yuezhiIdx = YUEZHI_ORDER.indexOf(monthBranch as (typeof YUEZHI_ORDER)[number]);

  // 月干 = (寅月天干索引 + 月支位置) % 10
  const monthStemIdx = mod(startStemIdx + yuezhiIdx, 10);
  const monthStem = TIANGAN[monthStemIdx];

  return {
    stem: monthStem,
    branch: monthBranch,
  };
}

// ============================================================
// 4. 时柱计算
// ============================================================

/**
 * 计算时柱干支
 *
 * 对应规则 #8、#9：
 * - 时支按时辰（23:00-01:00=子时，01:00-03:00=丑时，...）
 * - 时干用五鼠遁
 *
 * 夜子时规则（关键！）：
 * - **夜子时（23:00-00:00）**：日柱用当日，时柱用**次日日干**遁五鼠遁
 *   例如：戊辰日23:30 → 日柱戊辰，次日日干己，五鼠遁"甲己还加甲"→时柱甲子
 * - **子正（00:00-01:00）**：日柱和时柱均用当日（新一日）日干遁五鼠遁
 *
 * 五鼠遁口诀：
 *   甲己还加甲，乙庚丙作初，
 *   丙辛从戊起，丁壬庚子居，
 *   戊癸何方发，壬子是正途。
 *
 * @param trueSolarTime 真太阳时
 * @param dayStem 当日日柱天干
 * @param isNightZiShi 是否为夜子时（23:00-00:00）
 * @param enableNightZiShi 是否启用夜子时区分
 * @returns { stem, branch }
 *
 * @example
 * // 戊辰日23:30，夜子时
 * // 次日日干 = 己，五鼠遁"甲己还加甲"→子时甲子
 * getTimePillar(trueSolarTime, '戊', true, true) // => { stem: '甲', branch: '子' }
 */
export function getTimePillar(
  trueSolarTime: Date,
  dayStem: string,
  isNightZiShi: boolean,
  enableNightZiShi: boolean
): { stem: string; branch: string } {
  // 获取时辰地支
  const { shizhi } = getShiZhi(trueSolarTime, enableNightZiShi);

  // 确定用于五鼠遁的日干
  let stemForDun = dayStem;
  if (isNightZiShi && enableNightZiShi) {
    // 夜子时：用次日日干遁五鼠遁
    // 次日日干 = 当日日干前进一位（天干每日顺行一位）
    const dayStemIdx = TIANGAN_INDEX[dayStem];
    stemForDun = TIANGAN[mod(dayStemIdx + 1, 10)];
  }

  // 五鼠遁：日干→子时天干
  const startStem = WU_SHU_DUN_START[stemForDun]; // 子时的天干
  const startStemIdx = TIANGAN_INDEX[startStem];

  // 时支索引：子=0, 丑=1, 寅=2, ... 亥=11
  const shizhiIdx = DIZHI_INDEX[shizhi] ?? 0;

  // 时干 = (子时天干索引 + 时支索引) % 10
  const timeStemIdx = mod(startStemIdx + shizhiIdx, 10);
  const timeStem = TIANGAN[timeStemIdx];

  return {
    stem: timeStem,
    branch: shizhi,
  };
}

// ============================================================
// 5. 四柱排盘主函数
// ============================================================

/**
 * 四柱排盘主函数
 *
 * 整合时间校正、日柱、年柱、月柱、时柱的计算，输出完整的四柱排盘结果。
 *
 * 计算流程：
 * 1. 调用 correctTime() 进行时间校正，得到真太阳时
 * 2. 调用 getShiZhi() 获取时辰地支和是否夜子时
 * 3. 计算日柱（基于真太阳时的日期；夜子时日柱用当日）
 * 4. 计算年柱（用 checkLichunBoundary 判断立春边界）
 * 5. 计算月柱（用 getBirthMonthBranch 获取月支，再用五虎遁推月干）
 * 6. 计算时柱（夜子时用次日日干遁五鼠遁，否则用当日日干）
 *
 * 重要：真太阳时可能跨日，需要根据真太阳时的日期来判断日柱。
 * 例如用户输入 1984-02-05 00:10，真太阳时校正后可能是 1984-02-04 23:42，
 * 此时日柱用2月4日，时柱用2月5日的日干遁五鼠遁（夜子时规则）。
 *
 * @param input 排盘输入（出生日期、时间、性别、经度等）
 * @returns 四柱排盘结果
 *
 * @example
 * // 命例1: 1984-02-04 23:30 男 北京(116.41°)
 * calculateFourPillars({
 *   birthDate: '1984-02-04',
 *   birthTime: '23:30',
 *   gender: 'male',
 *   longitude: 116.41
 * })
 * // => 年柱甲子 月柱丙寅 日柱戊辰 时柱甲子
 *
 * @example
 * // 命例3: 1990-02-03 10:00 男 广州(113.27°)
 * calculateFourPillars({
 *   birthDate: '1990-02-03',
 *   birthTime: '10:00',
 *   gender: 'male',
 *   longitude: 113.27
 * })
 * // => 年柱己巳 月柱丁丑 日柱己亥 时柱己巳
 */
export function calculateFourPillars(input: BaziInput): FourPillarsResult {
  const enableNightZiShi = input.enableNightZiShi ?? true;

  // 步骤1：时间校正，得到真太阳时
  const correctionResult = correctTime(
    input.birthDate,
    input.birthTime,
    input.longitude,
    enableNightZiShi
  );
  const trueSolarTime = correctionResult.trueSolarTime;

  // 步骤2：获取时辰地支和是否夜子时
  const { isNightZiShi } = getShiZhi(trueSolarTime, enableNightZiShi);

  // 步骤3：计算日柱（基于真太阳时的日期）
  // 真太阳时可能跨日，需要根据真太阳时的日期来判断
  // 夜子时（23:00-00:00）日柱用当天，子正（00:00-01:00）日柱用新的一天
  const dayPillarInfo = getDayPillar(trueSolarTime);
  const dayPillar = buildPillar(dayPillarInfo.stem, dayPillarInfo.branch);
  const dayMaster = dayPillarInfo.stem;

  // 步骤4：计算年柱（用 checkLichunBoundary 判断立春边界）
  const yearPillarInfo = getYearPillar(trueSolarTime);
  const yearPillar = buildPillar(yearPillarInfo.stem, yearPillarInfo.branch);

  // 步骤5：计算月柱（用五虎遁推月干）
  const monthPillarInfo = getMonthPillar(trueSolarTime, yearPillarInfo.stem);
  const monthPillar = buildPillar(monthPillarInfo.stem, monthPillarInfo.branch);

  // 步骤6：计算时柱
  // - 夜子时（23:00-00:00）：时干用次日日干遁五鼠遁
  //   getTimePillar 内部会根据 isNightZiShi 自动计算次日日干
  // - 子正（00:00-01:00）或其它时辰：时干用当日日干遁五鼠遁
  //
  // dayPillarForTimeCalc 用于时柱五鼠遁计算的日柱信息
  // 夜子时时，次日日干 = 当日日干 + 1（由 getTimePillar 内部处理）
  const dayPillarForTimeCalc = dayPillarInfo;

  const timePillarInfo = getTimePillar(
    trueSolarTime,
    dayPillarForTimeCalc.stem,
    isNightZiShi,
    enableNightZiShi
  );
  const timePillar = buildPillar(timePillarInfo.stem, timePillarInfo.branch);

  return {
    trueSolarTime,
    yearPillar,
    monthPillar,
    dayPillar,
    timePillar,
    dayMaster,
    corrections: correctionResult.corrections,
    isNightZiShi,
  };
}
