/**
 * 十神计算模块
 *
 * 对应项目大纲规则 #17（十神）和详细数据表 11.18（十神对照表）。
 *
 * 以日主（日柱天干）为中心，按五行生克和阴阳同异关系确定十神。
 *
 * 十神生成规则（11.18 节）：
 *
 * | 十神   | 关系 | 阴阳     | 说明                         |
 * |--------|------|----------|------------------------------|
 * | 比肩   | 同我 | 同阴阳   | 与日主同五行、同阴阳         |
 * | 劫财   | 同我 | 异阴阳   | 与日主同五行、异阴阳         |
 * | 食神   | 我生 | 同阴阳   | 日主所生，同阴阳             |
 * | 伤官   | 我生 | 异阴阳   | 日主所生，异阴阳             |
 * | 偏财   | 我克 | 同阴阳   | 日主所克，同阴阳             |
 * | 正财   | 我克 | 异阴阳   | 日主所克，异阴阳             |
 * | 七杀   | 克我 | 同阴阳   | 克日主，同阴阳               |
 * | 正官   | 克我 | 异阴阳   | 克日主，异阴阳               |
 * | 偏印   | 生我 | 同阴阳   | 生日主，同阴阳               |
 * | 正印   | 生我 | 异阴阳   | 生日主，异阴阳               |
 *
 * @module bazi/calculators/ten-gods
 */

import { TIANGAN, TIANGAN_INDEX, TIANGAN_WUXING, TIANGAN_YINYANG } from '../constants/tiangan';
import { WUXING_SHENG, WUXING_KE } from '../constants/wuxing';
import type { Pillar } from '../types';

// ============================================================
// 1. 十神计算核心函数
// ============================================================

/**
 * 十神计算
 *
 * 以日主为中心，按五行生克和阴阳同异关系确定十神。
 *
 * 五行关系判定优先级：
 * 1. 同我（同五行）→ 比肩 / 劫财
 * 2. 我生（日主生目标，WUXING_SHENG[日主五行] === 目标五行）→ 食神 / 伤官
 * 3. 我克（日主克目标，WUXING_KE[日主五行] === 目标五行）→ 偏财 / 正财
 * 4. 克我（目标克日主，WUXING_KE[目标五行] === 日主五行）→ 七杀 / 正官
 * 5. 生我（目标生日主，WUXING_SHENG[目标五行] === 日主五行）→ 偏印 / 正印
 *
 * 阴阳同异判定：
 * - 同阴阳 → 偏星（偏财/偏印/七杀/食神）或 比肩
 * - 异阴阳 → 正星（正财/正印/正官/伤官）或 劫财
 *
 * @param dayMaster 日主天干（日柱天干）
 * @param targetStem 目标天干
 * @returns 十神名称（比肩/劫财/食神/伤官/偏财/正财/七杀/正官/偏印/正印），无效输入返回空字符串
 *
 * @example
 * // 甲日主
 * getTenGod('甲', '甲') // => '比肩'（同我，同阴阳）
 * getTenGod('甲', '乙') // => '劫财'（同我，异阴阳）
 * getTenGod('甲', '丙') // => '食神'（我生，同阴阳）
 * getTenGod('甲', '丁') // => '伤官'（我生，异阴阳）
 * getTenGod('甲', '戊') // => '偏财'（我克，同阴阳）
 * getTenGod('甲', '己') // => '正财'（我克，异阴阳）
 * getTenGod('甲', '庚') // => '七杀'（克我，同阴阳）
 * getTenGod('甲', '辛') // => '正官'（克我，异阴阳）
 * getTenGod('甲', '壬') // => '偏印'（生我，同阴阳）
 * getTenGod('甲', '癸') // => '正印'（生我，异阴阳）
 *
 * @example
 * // 乙日主（阴干）
 * getTenGod('乙', '甲') // => '劫财'（同我，异阴阳：乙阴甲阳）
 * getTenGod('乙', '丙') // => '伤官'（我生，异阴阳：乙阴丙阳）
 * getTenGod('乙', '庚') // => '正官'（克我，异阴阳：乙阴庚阳）
 */
export function getTenGod(dayMaster: string, targetStem: string): string {
  // 输入校验：确保 dayMaster 和 targetStem 是有效的天干
  if (TIANGAN_INDEX[dayMaster] === undefined || TIANGAN_INDEX[targetStem] === undefined) {
    return '';
  }

  const dmElement = TIANGAN_WUXING[dayMaster];
  const targetElement = TIANGAN_WUXING[targetStem];
  const dmYinYang = TIANGAN_YINYANG[dayMaster];
  const targetYinYang = TIANGAN_YINYANG[targetStem];
  const sameYinYang = dmYinYang === targetYinYang;

  // 同我（同五行）
  if (dmElement === targetElement) {
    return sameYinYang ? '比肩' : '劫财';
  }
  // 我生（日主生目标）
  if (WUXING_SHENG[dmElement] === targetElement) {
    return sameYinYang ? '食神' : '伤官';
  }
  // 我克（日主克目标）
  if (WUXING_KE[dmElement] === targetElement) {
    return sameYinYang ? '偏财' : '正财';
  }
  // 克我（目标克日主）
  if (WUXING_KE[targetElement] === dmElement) {
    return sameYinYang ? '七杀' : '正官';
  }
  // 生我（目标生日主）
  if (WUXING_SHENG[targetElement] === dmElement) {
    return sameYinYang ? '偏印' : '正印';
  }

  return '';
}

// ============================================================
// 2. 四柱十神标注
// ============================================================

/**
 * 为四柱标注十神（以日主为中心）
 *
 * 此函数直接修改传入的 Pillar 对象，设置其 `tenGod` 属性：
 * - **日柱天干** = 日主本身，标注为 `'日主'`（不计算十神）
 * - **年柱、月柱、时柱**的天干 = 以日主为中心计算的十神
 * - **胎元、命宫、身宫**的天干也标注十神
 *
 * 注意：日柱天干是日主本身，不需要标注十神。此处设为 `'日主'`
 * 仅供 UI 展示标识，并非十神名称。
 *
 * @param yearPillar 年柱
 * @param monthPillar 月柱
 * @param dayPillar 日柱（天干即日主）
 * @param timePillar 时柱
 * @param taiYuan 胎元
 * @param mingGong 命宫
 * @param shenGong 身宫
 *
 * @example
 * // 甲子年 丙寅月 戊辰日 庚申时
 * // 日主 = 戊
 * assignTenGods(yearPillar, monthPillar, dayPillar, timePillar, taiYuan, mingGong, shenGong)
 * // yearPillar.tenGod  = '七杀'（甲木克戊土，同阳）
 * // monthPillar.tenGod = '偏印'（丙火生戊土，同阳）
 * // dayPillar.tenGod   = '日主'
 * // timePillar.tenGod  = '食神'（戊土生庚金，同阳）
 */
export function assignTenGods(
  yearPillar: Pillar,
  monthPillar: Pillar,
  dayPillar: Pillar,
  timePillar: Pillar,
  taiYuan: Pillar,
  mingGong: Pillar,
  shenGong: Pillar
): void {
  const dayMaster = dayPillar.stem;

  // 日柱天干 = 日主本身，标注为"日主"（不计算十神）
  dayPillar.tenGod = '日主';

  // 年柱、月柱、时柱天干标注十神（以日主为中心）
  yearPillar.tenGod = getTenGod(dayMaster, yearPillar.stem);
  monthPillar.tenGod = getTenGod(dayMaster, monthPillar.stem);
  timePillar.tenGod = getTenGod(dayMaster, timePillar.stem);

  // 胎元、命宫、身宫天干标注十神
  taiYuan.tenGod = getTenGod(dayMaster, taiYuan.stem);
  mingGong.tenGod = getTenGod(dayMaster, mingGong.stem);
  shenGong.tenGod = getTenGod(dayMaster, shenGong.stem);
}

// ============================================================
// 3. 藏干十神计算
// ============================================================

/**
 * 藏干十神计算
 *
 * 为地支藏干标注十神（以日主为中心）。每个藏干按 `getTenGod` 规则
 * 计算十神，返回藏干与十神的对应列表，顺序与输入 hiddenStems 一致
 * （即本气/中气/余气顺序）。
 *
 * @param dayMaster 日主天干
 * @param hiddenStems 藏干列表（本气/中气/余气顺序）
 * @returns 藏干与十神的对应列表
 *
 * @example
 * // 日主甲木，寅支藏干 [甲(本气), 丙(中气), 戊(余气)]
 * getHiddenStemTenGods('甲', ['甲', '丙', '戊'])
 * // => [
 * //   { stem: '甲', tenGod: '比肩' },  // 同我，同阳
 * //   { stem: '丙', tenGod: '食神' },  // 我生，同阳
 * //   { stem: '戊', tenGod: '偏财' }   // 我克，同阳
 * // ]
 *
 * @example
 * // 日主庚金，申支藏干 [庚(本气), 壬(中气), 戊(余气)]
 * getHiddenStemTenGods('庚', ['庚', '壬', '戊'])
 * // => [
 * //   { stem: '庚', tenGod: '比肩' },
 * //   { stem: '壬', tenGod: '食神' },  // 庚金生壬水，同阳
 * //   { stem: '戊', tenGod: '偏印' }   // 戊土生庚金，同阳
 * // ]
 */
export function getHiddenStemTenGods(
  dayMaster: string,
  hiddenStems: string[]
): { stem: string; tenGod: string }[] {
  const validTiangan = TIANGAN as readonly string[];

  return hiddenStems
    .filter((stem) => validTiangan.includes(stem))
    .map((stem) => ({
      stem,
      tenGod: getTenGod(dayMaster, stem),
    }));
}
