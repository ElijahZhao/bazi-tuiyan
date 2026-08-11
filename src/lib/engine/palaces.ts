/**
 * 排盘引擎 层5：辅助宫位（胎元、命宫、身宫）
 *
 * 数据来源：
 * - 胎元：《三命通会》卷二 [参考来源 6.1]
 *   · 方法1（默认）：前三百日法——出生日前推三百日，以同干支日为胎元
 *   · 方法2（可选）：月干进一位、月支进三位法——民间简化口诀，非古籍正法
 * - 命宫：《三命通会》卷二 "逢卯即安命宫" [参考来源 6.21]
 * - 身宫：《古今图书集成·艺术典》卷六百九十八 [参考来源 6.18]
 *   · 方法1（默认）：古今图书集成法——如命顺则身逆，命逆则身顺
 *   · 方法2（可选）：逢酉安身法——出自五星正说类，非八字主流起例（暂未实现）
 *
 * 对应项目大纲 11.1（胎元三法）与 11.2（身宫两法）。
 */

import {
  type Stem,
  type Branch,
  stemIndex,
  branchIndex,
  stemFromIndex,
  branchFromIndex,
  wuHuDun,
  SIXTY_JIAZI,
  getNayin,
  getNayinElement,
} from './constants';
import type { Pillar, TaiYuan, MingGong, ShenGong } from './types';
import { getDayPillarIndex } from './solar-terms';

// ============================================================
// 内部辅助函数
// ============================================================

/**
 * 从六十甲子索引（0-59）创建 Pillar 对象
 */
function pillarFromIndex(idx: number): Pillar {
  const item = SIXTY_JIAZI[((idx % 60) + 60) % 60];
  return {
    stem: item.stem,
    branch: item.branch,
    ganzhi: item.ganzhi,
    nayin: item.nayin,
    nayinElement: item.nayinElement,
  };
}

/**
 * 从天干和地支创建 Pillar 对象
 *
 * 若干支组合存在于六十甲子中（正常情况），直接取纳音等字段；
 * 若不存在（理论上不会发生），则手动拼接并查纳音。
 */
function pillarFromStemBranch(stem: Stem, branch: Branch): Pillar {
  const idx = SIXTY_JIAZI.findIndex(
    (item) => item.stem === stem && item.branch === branch,
  );
  if (idx >= 0) {
    return pillarFromIndex(idx);
  }
  // fallback：理论上不会走到这里
  return {
    stem,
    branch,
    ganzhi: `${stem}${branch}`,
    nayin: getNayin(stem, branch),
    nayinElement: getNayinElement(stem, branch),
  };
}

/**
 * 安全取模：保证结果落在 [0, n) 区间
 * （JavaScript 的 % 对负数会返回负值，需额外处理）
 */
function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

// ============================================================
// 1. 胎元（Tai Yuan / Fetal Origin）
// ============================================================

/**
 * 计算胎元
 *
 * ---- 默认方法：前三百日法 [项目大纲 11.1 方法1] ----
 *
 * 出生日前推三百日，以同干支日为受胎之日。
 * 干支纪日六十日一循环，300 mod 60 = 0，
 * 故胎元干支与出生日干支相同。
 * 《三命通会》卷二："甲子日生便以甲子为受胎之日" [参考来源 6.1]
 *
 * 实现说明：从出生日期前推 300 天，调用 getDayPillarIndex 求得
 * 该日的六十甲子索引。由于 300 ≡ 0 (mod 60)，所得索引与出生
 * 日索引一致，结果即日柱干支本身。
 *
 * ---- 可选方法：月干进一位、月支进三位法 [项目大纲 11.1 方法2] ----
 *
 * 从月柱起，天干进一位、地支进三位。
 * 如丙寅月 → 丁巳为胎元（丙+1=丁，寅+3=巳）。
 * 此为民间简化口诀，非古籍正法，结果标注"民间简化法，非古籍正法"。
 *
 * @param birthDate   出生日期（真太阳时校正后的 Date 对象）
 * @param dayPillar   日柱（已排好的日柱干支，供参考/验证）
 * @param method      胎元计算方法，默认 '前三百日法'
 * @param monthPillar 月柱（仅当 method='月干进位月支进三法' 时需要）
 * @returns 胎元结果（含干支柱、方法名称、来源）
 */
export function calculateTaiYuan(
  birthDate: Date,
  dayPillar: Pillar,
  method: '前三百日法' | '月干进位月支进三法' = '前三百日法',
  monthPillar?: Pillar,
): TaiYuan {
  // ---- 可选方法：月干进一位、月支进三位法 ----
  if (method === '月干进位月支进三法') {
    if (!monthPillar) {
      throw new Error(
        "使用'月干进位月支进三法'计算胎元时必须提供 monthPillar（月柱）",
      );
    }
    const mStemIdx = stemIndex(monthPillar.stem);
    const mBranchIdx = branchIndex(monthPillar.branch);
    // 天干进一位、地支进三位
    const fetalStem = stemFromIndex(mStemIdx + 1);
    const fetalBranch = branchFromIndex(mBranchIdx + 3);
    const pillar = pillarFromStemBranch(fetalStem, fetalBranch);
    return {
      pillar,
      method: '月干进一位、月支进三位法（民间简化法，非古籍正法）',
      source: '民间简化口诀 [项目大纲 11.1 方法2]',
    };
  }

  // ---- 默认方法：前三百日法 ----
  // 从出生日前推 300 日
  const fetalDate = new Date(birthDate);
  fetalDate.setUTCDate(fetalDate.getUTCDate() - 300);

  // 用 getDayPillarIndex 求前推 300 日所在日的干支索引
  // 300 mod 60 = 0，故索引与出生日相同
  const fetalIdx = getDayPillarIndex(fetalDate);
  const pillar = pillarFromIndex(fetalIdx);

  // dayPillar 参数用于调用方传入已排好的日柱，此处可用作一致性验证
  // （胎元干支应与日柱干支相同，因 300 ≡ 0 mod 60）
  if (
    pillar.stem !== dayPillar.stem ||
    pillar.branch !== dayPillar.branch
  ) {
    // 理论上不会触发；若触发说明 getDayPillarIndex 基准有误
    console.warn(
      `[calculateTaiYuan] 胎元干支(${pillar.ganzhi})与日柱干支(${dayPillar.ganzhi})不一致，` +
        '请检查 getDayPillarIndex 基准日设置',
    );
  }

  return {
    pillar,
    method: '前三百日法',
    source: '《三命通会》卷二 [参考来源 6.1]',
  };
}

// ============================================================
// 2. 命宫（Ming Gong / Life Palace）
// ============================================================

/**
 * 计算命宫
 *
 * 公式 [参考来源 6.21]：
 *
 *   生月序号：寅=1, 卯=2, 辰=3, ..., 亥=10, 子=11, 丑=12
 *   A       = (1 - 生月序号) mod 12
 *   偏移     = (3 - 生时索引) mod 12
 *              （生时索引：子=0, 丑=1, ..., 亥=11，即标准地支索引）
 *   命宫索引 = (A + 偏移) mod 12
 *              （结果索引：0=子, 1=丑, ..., 11=亥）
 *
 * 命宫天干由出生年干用五虎遁推得（与月干同法）。
 *
 * 来源：《三命通会》卷二 "逢卯即安命宫" [参考来源 6.21]
 *
 * @param monthBranchIdx 生月支索引（0=子, 1=丑, ..., 11=亥）
 * @param hourBranchIdx  生时支索引（0=子, 1=丑, ..., 11=亥）
 * @param yearStem       出生年干
 * @returns 命宫结果（含地支、天干、来源）
 */
export function calculateMingGong(
  monthBranchIdx: number,
  hourBranchIdx: number,
  yearStem: Stem,
): MingGong {
  // 生月序号：寅=1, 卯=2, ..., 子=11, 丑=12
  // 由 monthBranchIdx（0=子, 1=丑, 2=寅, ...）转换
  // 寅(2)→1, 卯(3)→2, ..., 丑(1)→12, 子(0)→11
  const monthSerial = mod(monthBranchIdx - 2, 12) + 1;

  // A = (1 - 生月序号) mod 12
  const a = mod(1 - monthSerial, 12);

  // 偏移 = (3 - 生时索引) mod 12
  // 3 为卯的索引，即从生时逆数到卯的距离
  const offset = mod(3 - hourBranchIdx, 12);

  // 命宫索引 = (A + 偏移) mod 12（0=子, 1=丑, ..., 11=亥）
  const mingGongIdx = mod(a + offset, 12);

  // 命宫地支
  const mingGongBranch = branchFromIndex(mingGongIdx);

  // 命宫天干：用五虎遁从年干推（与排月干同理）
  const mingGongStem = wuHuDun(yearStem, mingGongIdx);

  return {
    branch: mingGongBranch,
    stem: mingGongStem,
    source: '《三命通会》卷二 "逢卯即安命宫" [参考来源 6.21]',
  };
}

// ============================================================
// 3. 身宫（Shen Gong / Body Palace）
// ============================================================

/**
 * 计算身宫
 *
 * 公式 [参考来源 6.18]：
 *
 *   offset = (生时支索引 - 生月支索引) mod 12
 *
 *   命逆（阴男 / 阳女）→ 身顺：
 *     身宫 = (生日支索引 + offset) mod 12
 *
 *   命顺（阳男 / 阴女）→ 身逆：
 *     身宫 = (生日支索引 - offset) mod 12
 *
 * 命顺 / 命逆判定（与大运起运方向一致）：
 *   命顺 = 阳男 或 阴女
 *   命逆 = 阴男 或 阳女
 *
 * 身宫方向与命宫（大运）方向相反：命顺则身逆，命逆则身顺。
 *
 * 身宫天干由出生年干用五虎遁推得。
 *
 * 来源：《古今图书集成·艺术典》卷六百九十八 [参考来源 6.18]
 *   "将本人生月支加生日支，如命顺则身逆，命逆则身顺，
 *    数至生时支安身宫"
 *
 * @param monthBranchIdx 生月支索引（0=子, 1=丑, ..., 11=亥）
 * @param dayBranchIdx   生日支索引（0=子, 1=丑, ..., 11=亥）
 * @param hourBranchIdx  生时支索引（0=子, 1=丑, ..., 11=亥）
 * @param gender         性别（'男' 或 '女'）
 * @param yearStemIsYang 出生年干是否为阳干
 * @param yearStem       出生年干
 * @returns 身宫结果（含地支、天干、方法、来源）
 */
export function calculateShenGong(
  monthBranchIdx: number,
  dayBranchIdx: number,
  hourBranchIdx: number,
  gender: '男' | '女',
  yearStemIsYang: boolean,
  yearStem: Stem,
): ShenGong {
  // offset = (生时支索引 - 生月支索引) mod 12
  const offset = mod(hourBranchIdx - monthBranchIdx, 12);

  // 命顺 / 命逆判定
  // 命顺 = 阳男 或 阴女（大运顺行）
  // 命逆 = 阴男 或 阳女（大运逆行）
  const isMingShun =
    (yearStemIsYang && gender === '男') ||
    (!yearStemIsYang && gender === '女');
  const isMingNi = !isMingShun; // 阴男 / 阳女

  // 命逆 → 身顺：身宫 = (生日支索引 + offset) mod 12
  // 命顺 → 身逆：身宫 = (生日支索引 - offset) mod 12
  let shenGongIdx: number;
  if (isMingNi) {
    // 命逆则身顺
    shenGongIdx = mod(dayBranchIdx + offset, 12);
  } else {
    // 命顺则身逆
    shenGongIdx = mod(dayBranchIdx - offset, 12);
  }

  // 身宫地支
  const shenGongBranch = branchFromIndex(shenGongIdx);

  // 身宫天干：用五虎遁从年干推（与命宫天干同法）
  const shenGongStem = wuHuDun(yearStem, shenGongIdx);

  return {
    branch: shenGongBranch,
    stem: shenGongStem,
    method: '古今图书集成法',
    source: '《古今图书集成·艺术典》卷六百九十八 [参考来源 6.18]',
  };
}
