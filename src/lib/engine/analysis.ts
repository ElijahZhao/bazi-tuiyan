/**
 * 排盘引擎 层6：十神、十二长生、纳音验证
 *
 * 十神：以日主为中心，按五行生克和阴阳同异关系确定 [项目大纲 11.18]
 * 十二长生：阳干顺行（无争议），阴干逆行（标注参考性）[项目大纲 11.13]
 * 纳音：基于太玄数公式验证 [项目大纲 11.7]
 *
 * 来源：[项目大纲 11.13, 11.18]；《渊海子平》《三命通会》
 */

import {
  type Stem,
  type Branch,
  type Element,
  STEM_ELEMENTS,
  STEM_YIN_YANG,
  STEM_TAIXUAN,
  BRANCH_TAIXUAN,
  GENERATING,
  OVERCOMING,
  branchIndex,
  getNayin,
  getNayinElement,
  SIXTY_JIAZI,
} from './constants';
import type { TenGod, LifeStage } from './types';

// 重新导出 constants.ts 中的纳音查表函数与数据，便于统一引用
export { getNayin, getNayinElement, SIXTY_JIAZI };

// ============================================================
// 一、十神（Ten Gods）[项目大纲 11.18]
// ============================================================

/**
 * 十神生成规则一览（以日主为中心）：
 *
 * | 十神 | 关系 | 阴阳 | 说明                       |
 * |------|------|------|----------------------------|
 * | 比肩 | 同我 | 同   | 与日主同五行、同阴阳       |
 * | 劫财 | 同我 | 异   | 与日主同五行、异阴阳       |
 * | 食神 | 我生 | 同   | 日主所生，同阴阳           |
 * | 伤官 | 我生 | 异   | 日主所生，异阴阳           |
 * | 偏财 | 我克 | 同   | 日主所克，同阴阳           |
 * | 正财 | 我克 | 异   | 日主所克，异阴阳           |
 * | 七杀 | 克我 | 同   | 克日主，同阴阳             |
 * | 正官 | 克我 | 异   | 克日主，异阴阳             |
 * | 偏印 | 生我 | 同   | 生日主，同阴阳             |
 * | 正印 | 生我 | 异   | 生日主，异阴阳             |
 */

/**
 * 计算十神
 *
 * 以日主天干为中心，根据目标天干与日主的五行生克关系及阴阳同异确定十神。
 * 使用 STEM_ELEMENTS（天干五行）与 STEM_YIN_YANG（天干阴阳）判断。
 *
 * @param dayMaster 日主天干
 * @param target    目标天干
 * @returns 十神
 */
export function getTenGod(dayMaster: Stem, target: Stem): TenGod {
  const dmElement = STEM_ELEMENTS[dayMaster];
  const targetElement = STEM_ELEMENTS[target];
  const sameYinYang = STEM_YIN_YANG[dayMaster] === STEM_YIN_YANG[target];

  // 同我 → 比肩 / 劫财
  if (dmElement === targetElement) {
    return sameYinYang ? '比肩' : '劫财';
  }

  // 我生 → 食神 / 伤官
  if (GENERATING[dmElement] === targetElement) {
    return sameYinYang ? '食神' : '伤官';
  }

  // 我克 → 偏财 / 正财
  if (OVERCOMING[dmElement] === targetElement) {
    return sameYinYang ? '偏财' : '正财';
  }

  // 克我 → 七杀 / 正官
  if (OVERCOMING[targetElement] === dmElement) {
    return sameYinYang ? '七杀' : '正官';
  }

  // 生我 → 偏印 / 正印（此时 GENERATING[targetElement] === dmElement 必然成立）
  return sameYinYang ? '偏印' : '正印';
}

// ============================================================
// 二、十二长生（Twelve Life Stages）[项目大纲 11.13]
// ============================================================

/**
 * 十二长生十二宫顺序：
 * 长生 → 沐浴 → 冠带 → 临官 → 帝旺 → 衰 → 病 → 死 → 墓 → 绝 → 胎 → 养
 */
export const LIFE_STAGES: LifeStage[] = [
  '长生', '沐浴', '冠带', '临官', '帝旺',
  '衰', '病', '死', '墓', '绝', '胎', '养',
];

/**
 * 各天干的长生起点地支。
 *
 * 阳干（顺行，无争议）：
 *   甲(木)→亥、丙(火)→寅、戊(土)→寅（火土同长生）、庚(金)→巳、壬(水)→申
 *
 * 阴干（逆行，标注参考性——存在学术争议）：
 *   乙(木)→午、丁(火)→酉、己(土)→酉（火土同长生）、辛(金)→子、癸(水)→卯
 */
const CHANGSHENG_START: Record<Stem, Branch> = {
  // 阳干（顺行）
  甲: '亥', // 阳木
  丙: '寅', // 阳火
  戊: '寅', // 阳土（火土同长生：火生土，故火的长生位亦是土的长生位）
  庚: '巳', // 阳金
  壬: '申', // 阳水
  // 阴干（逆行，参考性）
  乙: '午', // 阴木
  丁: '酉', // 阴火
  己: '酉', // 阴土（火土同长生）
  辛: '子', // 阴金
  癸: '卯', // 阴水
};

/**
 * 计算十二长生阶段
 *
 * 阳干：从长生位顺行（地支索引递增）数至目标地支，无争议。
 * 阴干：从长生位逆行（地支索引递减）数至目标地支，标注"参考性"
 *       （部分流派认为阴干也顺行，与阳干同起始，故存在学术争议）。
 *
 * @param stem   天干
 * @param branch 目标地支
 * @returns { stage: 长生阶段; isReference: 是否为阴干逆行（参考性） }
 */
export function getLifeStage(
  stem: Stem,
  branch: Branch,
): { stage: LifeStage; isReference: boolean } {
  const isYang = STEM_YIN_YANG[stem] === '阳';
  const changsheng = CHANGSHENG_START[stem];
  const startIdx = branchIndex(changsheng);
  const targetIdx = branchIndex(branch);

  let offset: number;
  if (isYang) {
    // 顺行：从长生位向目标位顺数
    offset = ((targetIdx - startIdx) % 12 + 12) % 12;
  } else {
    // 逆行：从长生位向目标位逆数
    offset = ((startIdx - targetIdx) % 12 + 12) % 12;
  }

  return {
    stage: LIFE_STAGES[offset],
    isReference: !isYang,
  };
}

// ============================================================
// 三、纳音验证（Na Yin）[项目大纲 11.7]
// ============================================================

/**
 * 太玄数余数 → 河图五行映射（对应项目大纲 11.7）：
 * 1=水、2=火、3=木、4=金、5=土
 */
const TAIXUAN_RESULT_TO_ELEMENT: Record<number, Element> = {
  1: '水',
  2: '火',
  3: '木',
  4: '金',
  5: '土',
};

/**
 * 使用太玄数公式验证纳音五行
 *
 * 计算步骤（对应项目大纲 11.7）：
 * 1. 取一对干支的四个字（2 天干 + 2 地支）的太玄数相加
 * 2. 49 减去总和得差值
 * 3. 差值对 5 取余（余数为 0 时按 5 算）
 * 4. 余数对应河图五行：1=水、2=火、3=木、4=金、5=土
 * 5. 纳音五行 = 余数五行所生之五行（即 GENERATING 映射，"所生"）
 *
 * 太玄数取值：
 *   天干：甲己=9、乙庚=8、丙辛=7、丁壬=6、戊癸=5
 *   地支：子午=9、丑未=8、寅申=7、卯酉=6、辰戌=5、巳亥=4
 *
 * 示例：甲子乙丑（海中金）
 *   甲9 + 子9 + 乙8 + 丑8 = 34；49−34=15；15 mod 5=0→5（土）；土生金 → 金 ✓
 *
 * @param stem1   第一柱天干
 * @param branch1 第一柱地支
 * @param stem2   第二柱天干
 * @param branch2 第二柱地支
 * @returns 纳音五行
 */
export function verifyNayin(
  stem1: Stem,
  branch1: Branch,
  stem2: Stem,
  branch2: Branch,
): Element {
  // 1. 四字太玄数求和
  const sum =
    STEM_TAIXUAN[stem1] +
    BRANCH_TAIXUAN[branch1] +
    STEM_TAIXUAN[stem2] +
    BRANCH_TAIXUAN[branch2];

  // 2. 49 减总和得差值
  const difference = 49 - sum;

  // 3. 对 5 取余（确保非负，余数 0 时按 5 算）
  let remainder = ((difference % 5) + 5) % 5;
  if (remainder === 0) {
    remainder = 5;
  }

  // 4. 余数 → 河图五行
  const heTuElement = TAIXUAN_RESULT_TO_ELEMENT[remainder];

  // 5. 纳音五行 = 所生之五行
  return GENERATING[heTuElement];
}

/**
 * 校验单个干支的纳音五行是否与太玄数公式一致
 *
 * 给定单柱干支，在六十甲子中找到其纳音对（相邻两柱同属一纳音），
 * 再用太玄数公式验证，返回公式计算值与查表值是否吻合。
 *
 * @param stem   天干
 * @param branch 地支
 * @returns { formula: 太玄数公式计算值; lookup: 查表值; match: 是否一致 }
 */
export function checkNayinConsistency(
  stem: Stem,
  branch: Branch,
): { formula: Element; lookup: Element; match: boolean } {
  const idx = SIXTY_JIAZI.findIndex(
    (item) => item.stem === stem && item.branch === branch,
  );
  const lookup = getNayinElement(stem, branch);

  if (idx < 0) {
    return { formula: lookup, lookup, match: false };
  }

  // 纳音以两柱为一对：偶数索引与其后一柱同组，奇数索引与其前一柱同组
  const pairIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
  const partner = SIXTY_JIAZI[pairIdx];

  const formula = verifyNayin(
    stem,
    branch,
    partner.stem,
    partner.branch,
  );

  return { formula, lookup, match: formula === lookup };
}
