/**
 * 关系分析模块
 *
 * 对应项目大纲规则 #22（天干五合 + 化气条件）、#23（地支关系系统）、
 * #24（暗合）、#25（拱夹虚邀）、#29（天干相克/相冲），
 * 以及详细数据表 11.14（地支关系系统完整表）、11.19（天干五合对照表）、
 * 11.21（拱夹虚邀判断方法）。
 *
 * 本模块负责检测四柱（含胎元、命宫、身宫）中天干与地支之间的所有关系：
 *
 * 地支关系（规则 #23、#24、#25）：
 * - 六合（6组）：子丑合土、寅亥合木、卯戌合火、辰酉合金、巳申合水、午未合火/土
 * - 六冲（6组）：子午冲、丑未冲、寅申冲、卯酉冲、辰戌冲、巳亥冲
 * - 三合局（4组）：申子辰水局、寅午戌火局、巳酉丑金局、亥卯未木局
 * - 半三合（8组）：生旺半合 + 旺墓半合
 * - 三会局（4组）：寅卯辰木、巳午未火、申酉戌金、亥子丑水
 * - 三刑（4类）：无恩之刑、恃势之刑、无礼之刑、自刑
 * - 六害（6组）：子未害、丑午害、寅巳害、卯辰害、申亥害、酉戌害
 * - 相破（6组）：子酉破、丑辰破、寅亥破、卯午破、巳申破、未戌破
 * - 暗合（核心四组+争议组）：基于藏干天干五合原理
 * - 拱夹虚邀：拱=三合局首尾缺中神，夹=三会局首尾缺中神
 *
 * 天干关系（规则 #22、#29）：
 * - 天干五合：甲己化土、乙庚化金、丙辛化水、丁壬化木、戊癸化火
 *   化气条件三要素：①月令当化神 ②无争合妒合且化神不被克破 ③化神透引
 *   三者俱备方论真化
 * - 天干冲破：甲庚冲、乙辛冲、丙壬冲、丁癸冲（戊己居中不以冲论）
 * - 天干相克：庚辛克甲乙、甲乙克戊己、戊己克壬癸、壬癸克丙丁、丙丁克庚辛
 *
 * @module bazi/calculators/relations
 */

import {
  DIZHI_LIUHE, DIZHI_LIUCHONG, DIZHI_SANHE, DIZHI_BANSANHE,
  DIZHI_SANHUI, DIZHI_SANXING, DIZHI_LIUHAI, DIZHI_XIANGPO,
  DIZHI_ANHE, DIZHI_GONG, DIZHI_JIA
} from '../constants/dizhi';
import {
  TIANGAN_WUHE, TIANGAN_CHONGPO, TIANGAN_XIANGKE,
  TIANGAN_INDEX, TIANGAN_YINYANG, TIANGAN_WUXING
} from '../constants/tiangan';
import { WUXING_SHENG, WUXING_KE } from '../constants/wuxing';
import type { Pillar, RelationResult, StemRelationResult, DiZhi, WuXing, TianGan } from '../types';

// ============================================================
// 辅助函数
// ============================================================

/**
 * 判断两地支是否无序匹配给定的地支对
 *
 * @param b1 第一个地支
 * @param b2 第二个地支
 * @param pair 给定的地支对 [a, b]
 * @returns 如果 {b1, b2} === {a, b}（无序）则返回 true
 *
 * @example
 * matchUnorderedPair('子', '丑', ['子', '丑']) // => true
 * matchUnorderedPair('丑', '子', ['子', '丑']) // => true
 * matchUnorderedPair('子', '午', ['子', '丑']) // => false
 * matchUnorderedPair('辰', '辰', ['辰', '辰']) // => true（自刑）
 */
function matchUnorderedPair(b1: string, b2: string, pair: [string, string]): boolean {
  return (b1 === pair[0] && b2 === pair[1]) || (b1 === pair[1] && b2 === pair[0]);
}

/**
 * 判断三地支是否无序匹配给定的三地支组
 *
 * 要求三个地支互不相同且集合完全匹配。
 *
 * @param branches 三个地支 [b1, b2, b3]
 * @param triple 给定的三地支组 [a, b, c]
 * @returns 如果 {b1, b2, b3} === {a, b, c}（无序）则返回 true
 *
 * @example
 * matchUnorderedTriple(['申', '子', '辰'], ['申', '子', '辰']) // => true
 * matchUnorderedTriple(['辰', '申', '子'], ['申', '子', '辰']) // => true
 * matchUnorderedTriple(['申', '子', '子'], ['申', '子', '辰']) // => false（重复地支）
 */
function matchUnorderedTriple(
  branches: string[],
  triple: [string, string, string]
): boolean {
  const set1 = new Set(branches);
  const set2 = new Set(triple);
  // 三地支必须互不相同
  if (set1.size !== 3 || set2.size !== 3) return false;
  for (const b of triple) {
    if (!set1.has(b)) return false;
  }
  return true;
}

// ============================================================
// 1. 地支关系分析
// ============================================================

/**
 * 地支关系分析
 *
 * 检查四柱地支（含胎元、命宫、身宫）之间的所有关系：
 * - 六合：检查任意两地支是否在 DIZHI_LIUHE 中
 * - 六冲：检查任意两地支是否在 DIZHI_LIUCHONG 中
 * - 三合：检查任意三地支是否在 DIZHI_SANHE 中
 * - 半三合：检查任意两地支是否在 DIZHI_BANSANHE 中
 * - 三会：检查任意三地支是否在 DIZHI_SANHUI 中
 * - 三刑：检查任意两地支是否在 DIZHI_SANXING 中（含自刑）
 * - 六害：检查任意两地支是否在 DIZHI_LIUHAI 中
 * - 相破：检查任意两地支是否在 DIZHI_XIANGPO 中
 * - 暗合：检查任意两地支是否在 DIZHI_ANHE 中
 *   （暗合基于藏干天干五合原理，非地支直接关系）
 * - 拱夹：检查任意两地支是否在 DIZHI_GONG（拱）或 DIZHI_JIA（夹）中
 *
 * @param pillars 柱位列表，每项包含名称和柱信息
 * @returns 地支关系结果列表
 */
export function analyzeBranchRelations(
  pillars: { name: string; pillar: Pillar }[]
): RelationResult[] {
  const results: RelationResult[] = [];
  const n = pillars.length;

  // ----------------------------------------------------------
  // 两两地支关系（六合/六冲/半三合/三刑/六害/相破/暗合/拱夹）
  // ----------------------------------------------------------
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const b1 = pillars[i].pillar.branch;
      const b2 = pillars[j].pillar.branch;
      const loc1 = pillars[i].name;
      const loc2 = pillars[j].name;

      // —— 六合 ——
      for (const entry of DIZHI_LIUHE) {
        if (matchUnorderedPair(b1, b2, entry.branches)) {
          results.push({
            type: 'liuhe',
            branches: [b1, b2] as DiZhi[],
            locations: [loc1, loc2],
            description: `${entry.branches[0]}${entry.branches[1]}合化${entry.element}` +
              (entry.note ? `（${entry.note}）` : ''),
            element: entry.element as WuXing,
          });
        }
      }

      // —— 六冲 ——
      for (const entry of DIZHI_LIUCHONG) {
        if (matchUnorderedPair(b1, b2, entry.branches)) {
          results.push({
            type: 'liuchong',
            branches: [b1, b2] as DiZhi[],
            locations: [loc1, loc2],
            description: `${entry.branches[0]}${entry.branches[1]}冲（${entry.description}）`,
          });
        }
      }

      // —— 半三合 ——
      for (const entry of DIZHI_BANSANHE) {
        if (matchUnorderedPair(b1, b2, entry.branches)) {
          results.push({
            type: 'bansanhe',
            branches: [b1, b2] as DiZhi[],
            locations: [loc1, loc2],
            description: `${entry.branches[0]}${entry.branches[1]}${entry.type}（${entry.element}）`,
            element: entry.element as WuXing,
          });
        }
      }

      // —— 三刑（含自刑）——
      // 三刑为成组检测：无恩之刑(寅巳申)、恃势之刑(丑戌未)、
      // 无礼之刑(子卯)、自刑(辰午酉亥)
      for (const group of DIZHI_SANXING) {
        for (const pair of group.branches) {
          if (matchUnorderedPair(b1, b2, pair)) {
            results.push({
              type: 'sanxing',
              branches: [b1, b2] as DiZhi[],
              locations: [loc1, loc2],
              description: `${b1}${b2}${group.type}（${group.description}）`,
            });
          }
        }
      }

      // —— 六害 ——
      for (const pair of DIZHI_LIUHAI) {
        if (matchUnorderedPair(b1, b2, pair)) {
          results.push({
            type: 'liuhai',
            branches: [b1, b2] as DiZhi[],
            locations: [loc1, loc2],
            description: `${pair[0]}${pair[1]}相害`,
          });
        }
      }

      // —— 相破 ——
      for (const pair of DIZHI_XIANGPO) {
        if (matchUnorderedPair(b1, b2, pair)) {
          results.push({
            type: 'xiangpo',
            branches: [b1, b2] as DiZhi[],
            locations: [loc1, loc2],
            description: `${pair[0]}${pair[1]}相破`,
          });
        }
      }

      // —— 暗合（基于藏干天干五合原理，非地支直接关系）——
      // 核心四组：寅丑(甲己合)、午亥(丁壬合)、卯申(乙庚合)、子巳(癸戊合)
      // 争议组：巳戌(丙辛合)
      for (const entry of DIZHI_ANHE) {
        if (matchUnorderedPair(b1, b2, entry.branches)) {
          results.push({
            type: 'anhe',
            branches: [b1, b2] as DiZhi[],
            locations: [loc1, loc2],
            description: `${entry.branches[0]}${entry.branches[1]}暗合` +
              `（藏干${entry.hiddenStems[0]}${entry.hiddenStems[1]}合）` +
              (entry.note ? `（${entry.note}）` : ''),
          });
        }
      }

      // —— 拱（三合局首尾两支缺中神）——
      for (const entry of DIZHI_GONG) {
        if (matchUnorderedPair(b1, b2, entry.branches)) {
          results.push({
            type: 'gongjia',
            branches: [b1, b2] as DiZhi[],
            locations: [loc1, loc2],
            description: `${entry.branches[0]}${entry.branches[1]}拱${entry.virtual}` +
              `（${entry.element}局中神）`,
            element: entry.element as WuXing,
          });
        }
      }

      // —— 夹（三会局首尾两支缺中神）——
      for (const entry of DIZHI_JIA) {
        if (matchUnorderedPair(b1, b2, entry.branches)) {
          results.push({
            type: 'gongjia',
            branches: [b1, b2] as DiZhi[],
            locations: [loc1, loc2],
            description: `${entry.branches[0]}${entry.branches[1]}夹${entry.virtual}` +
              `（${entry.element}局中神）`,
            element: entry.element as WuXing,
          });
        }
      }
    }
  }

  // ----------------------------------------------------------
  // 三地支关系（三合局/三会局）
  // ----------------------------------------------------------
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        const b1 = pillars[i].pillar.branch;
        const b2 = pillars[j].pillar.branch;
        const b3 = pillars[k].pillar.branch;
        const loc1 = pillars[i].name;
        const loc2 = pillars[j].name;
        const loc3 = pillars[k].name;
        const tripleBranches = [b1, b2, b3];

        // —— 三合局 ——
        for (const entry of DIZHI_SANHE) {
          if (matchUnorderedTriple(tripleBranches, entry.branches)) {
            results.push({
              type: 'sanhe',
              branches: [b1, b2, b3] as DiZhi[],
              locations: [loc1, loc2, loc3],
              description: `${entry.branches[0]}${entry.branches[1]}${entry.branches[2]}` +
                `三合${entry.element}局（中神：${entry.zhongshen}）`,
              element: entry.element as WuXing,
            });
          }
        }

        // —— 三会局 ——
        for (const entry of DIZHI_SANHUI) {
          if (matchUnorderedTriple(tripleBranches, entry.branches)) {
            results.push({
              type: 'sanhui',
              branches: [b1, b2, b3] as DiZhi[],
              locations: [loc1, loc2, loc3],
              description: `${entry.branches[0]}${entry.branches[1]}${entry.branches[2]}` +
                `三会${entry.direction}${entry.element}局`,
              element: entry.element as WuXing,
            });
          }
        }
      }
    }
  }

  return results;
}

// ============================================================
// 2. 天干关系分析
// ============================================================

/**
 * 检测争合/妒合
 *
 * 争合：同一天干出现两次或以上，与同一合化对象产生竞争。
 * 妒合：合化对象出现两次或以上，导致合化不稳定。
 *
 * 当 s1 或 s2 在四柱天干中出现超过一次时，即存在争合/妒合。
 *
 * @param stems 四柱天干列表
 * @param s1 合化的一方
 * @param s2 合化的另一方
 * @returns 是否存在争合/妒合
 */
function hasCompetingCombination(stems: string[], s1: string, s2: string): boolean {
  const s1Count = stems.filter((s) => s === s1).length;
  const s2Count = stems.filter((s) => s === s2).length;
  return s1Count > 1 || s2Count > 1;
}

/**
 * 检测化神是否被克破
 *
 * 遍历四柱天干（排除合化的双方），若任一天干的五行克化神五行，
 * 则化神被克破，合化不成。
 *
 * 注意：合化双方本身不参与克破判定（合化后失去原五行属性）。
 *
 * @param stems 四柱天干列表
 * @param s1 合化的一方
 * @param s2 合化的另一方
 * @param transformElement 化神五行
 * @returns 化神是否被克破
 */
function isTransformElementBroken(
  stems: string[],
  s1: string,
  s2: string,
  transformElement: string
): boolean {
  for (const stem of stems) {
    // 排除合化双方（合化后失去原五行属性）
    if (stem === s1 || stem === s2) continue;
    const element = TIANGAN_WUXING[stem];
    if (WUXING_KE[element] === transformElement) {
      return true;
    }
  }
  return false;
}

/**
 * 检测化神是否透引
 *
 * 化神透引：化神五行对应的天干透出四柱（即四柱天干中存在
 * 五行与化神相同的天干）。
 *
 * 例如甲己化土，四柱中有戊或己（土）透出，则满足透引条件。
 * 合化双方中若有一方五行即为化神五行（如己为土），也计入透引。
 *
 * @param stems 四柱天干列表
 * @param transformElement 化神五行
 * @returns 化神是否透引
 */
function isTransformElementTransparent(stems: string[], transformElement: string): boolean {
  return stems.some((stem) => TIANGAN_WUXING[stem] === transformElement);
}

/**
 * 天干五合化气条件判断（规则 #22 三要素）
 *
 * 化气条件三要素（三者俱备方论真化）：
 * 1. **月令当化神**：月支本气五行 === 化神五行
 *    （如甲己化土须辰戌丑未月，即月支本气为土）
 * 2. **无争合妒合且化神不被克破**：
 *    - 无争合妒合：合化双方在四柱中不重复出现
 *    - 化神不被克破：四柱中无其他天干克化神五行
 * 3. **化神透引**：化神五行对应的天干透出四柱
 *
 * @param stems 四柱天干列表
 * @param s1 合化的一方
 * @param s2 合化的另一方
 * @param transformElement 化神五行
 * @param monthElement 月令五行（月支本气五行）
 * @returns { isTransformed, reasons } 是否真化及未满足条件的原因
 */
function checkTransformConditions(
  stems: string[],
  s1: string,
  s2: string,
  transformElement: string,
  monthElement: string
): { isTransformed: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // 条件1：月令当化神
  const monthMatches = monthElement === transformElement;
  if (!monthMatches) {
    // 辅助判断：月令是否生化神（如月令火，化神土，火生土）
    const monthGenerates = WUXING_SHENG[monthElement] === transformElement;
    if (monthGenerates) {
      reasons.push(`月令${monthElement}生化神${transformElement}（非当令）`);
    } else {
      reasons.push(`月令${monthElement}不当化神${transformElement}`);
    }
  }

  // 条件2：无争合妒合且化神不被克破
  const hasCompeting = hasCompetingCombination(stems, s1, s2);
  const isBroken = isTransformElementBroken(stems, s1, s2, transformElement);
  if (hasCompeting) {
    reasons.push('有争合妒合');
  }
  if (isBroken) {
    reasons.push(`化神${transformElement}被克破`);
  }

  // 条件3：化神透引（化神天干透出四柱）
  const hasTouYin = isTransformElementTransparent(stems, transformElement);
  if (!hasTouYin) {
    reasons.push(`化神${transformElement}未透引`);
  }

  const isTransformed = monthMatches && !hasCompeting && !isBroken && hasTouYin;
  return { isTransformed, reasons };
}

/**
 * 天干关系分析
 *
 * 检查四柱天干之间的关系：
 * - **天干五合**：检查任意两天干是否在 TIANGAN_WUHE 中
 *   化气条件（规则 #22 三要素）：
 *   1. 月令当化神（月支本气五行 === 化神五行）
 *   2. 无争合妒合且化神不被克破
 *   3. 化神透引（化神天干透出四柱）
 *   三者俱备方论真化
 * - **天干冲破**：检查任意两天干是否在 TIANGAN_CHONGPO 中
 *   （甲庚冲、乙辛冲、丙壬冲、丁癸冲；戊己居中不以冲论）
 * - **天干相克**：检查任意两天干是否在 TIANGAN_XIANGKE 中
 *   （庚辛克甲乙、甲乙克戊己、戊己克壬癸、壬癸克丙丁、丙丁克庚辛）
 *
 * @param pillars 柱位列表，每项包含名称和柱信息（通常为四柱：年/月/日/时）
 * @returns 天干关系结果列表
 */
export function analyzeStemRelations(
  pillars: { name: string; pillar: Pillar }[]
): StemRelationResult[] {
  const results: StemRelationResult[] = [];
  const n = pillars.length;
  const stems = pillars.map((p) => p.pillar.stem);

  // 获取月令五行（月支本气天干的五行），用于天干五合化气条件判断
  const monthPillar = pillars.find((p) => p.name === '月');
  const monthBenQi = monthPillar?.pillar.hiddenStems[0];
  const monthElement = monthBenQi ? TIANGAN_WUXING[monthBenQi] : '';

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const s1 = pillars[i].pillar.stem;
      const s2 = pillars[j].pillar.stem;
      const loc1 = pillars[i].name;
      const loc2 = pillars[j].name;

      // —— 天干五合 ——
      // 甲己合化土、乙庚合化金、丙辛合化水、丁壬合化木、戊癸合化火
      const wuheInfo = TIANGAN_WUHE[s1];
      if (wuheInfo && wuheInfo.partner === s2) {
        const transformElement = wuheInfo.transform;

        // 判断化气条件（三要素）
        const { isTransformed, reasons } = checkTransformConditions(
          stems, s1, s2, transformElement, monthElement
        );

        // 按 TIANGAN_INDEX 排序天干（低索引在前，如甲己而非己甲）
        const s1First = TIANGAN_INDEX[s1] <= TIANGAN_INDEX[s2];
        const orderedStems = s1First ? [s1, s2] : [s2, s1];
        const orderedLocs = s1First ? [loc1, loc2] : [loc2, loc1];

        const desc = `${orderedStems[0]}${orderedStems[1]}合化${transformElement}` +
          `（${isTransformed ? '真化' : '假化：' + reasons.join('、')}）`;

        results.push({
          type: 'wuhe',
          stems: orderedStems as TianGan[],
          locations: orderedLocs,
          description: desc,
          transformElement: transformElement as WuXing,
          isTransformed,
        });
      }

      // —— 天干冲破 ——
      // 甲庚冲、乙辛冲、丙壬冲、丁癸冲（戊己居中不以冲论）
      if (TIANGAN_CHONGPO[s1] === s2) {
        const e1 = TIANGAN_WUXING[s1];
        const e2 = TIANGAN_WUXING[s2];
        const y1 = TIANGAN_YINYANG[s1];
        const y2 = TIANGAN_YINYANG[s2];

        // 按 TIANGAN_INDEX 排序天干
        const s1First = TIANGAN_INDEX[s1] <= TIANGAN_INDEX[s2];
        const orderedStems = s1First ? [s1, s2] : [s2, s1];
        const orderedLocs = s1First ? [loc1, loc2] : [loc2, loc1];
        const firstYinYang = s1First ? y1 : y2;
        const firstElement = s1First ? e1 : e2;
        const secondYinYang = s1First ? y2 : y1;
        const secondElement = s1First ? e2 : e1;

        results.push({
          type: 'chongpo',
          stems: orderedStems as TianGan[],
          locations: orderedLocs,
          description: `${orderedStems[0]}(${firstYinYang}${firstElement})` +
            `${orderedStems[1]}(${secondYinYang}${secondElement})冲`,
        });
      }

      // —— 天干相克 ——
      // 庚辛克甲乙、甲乙克戊己、戊己克壬癸、壬癸克丙丁、丙丁克庚辛
      // 相克为单向关系：若 s1 克 s2，则 s2 不克 s1
      const keList1 = TIANGAN_XIANGKE[s1];
      if (keList1 && keList1.includes(s2)) {
        // s1 克 s2
        const e1 = TIANGAN_WUXING[s1];
        const e2 = TIANGAN_WUXING[s2];
        results.push({
          type: 'xiangke',
          stems: [s1, s2] as TianGan[],
          locations: [loc1, loc2],
          description: `${s1}(${e1})克${s2}(${e2})`,
        });
      } else {
        // 检查反向：s2 克 s1
        const keList2 = TIANGAN_XIANGKE[s2];
        if (keList2 && keList2.includes(s1)) {
          const e1 = TIANGAN_WUXING[s1];
          const e2 = TIANGAN_WUXING[s2];
          results.push({
            type: 'xiangke',
            stems: [s2, s1] as TianGan[],
            locations: [loc2, loc1],
            description: `${s2}(${e2})克${s1}(${e1})`,
          });
        }
      }
    }
  }

  return results;
}

// ============================================================
// 3. 主函数：整合分析
// ============================================================

/**
 * 关系分析主函数
 *
 * 整合地支关系分析和天干关系分析：
 * - 地支关系：检查四柱 + 胎元/命宫/身宫的所有地支组合
 * - 天干关系：检查四柱（年/月/日/时）的所有天干组合
 *
 * @param fourPillars 四柱 { yearPillar, monthPillar, dayPillar, timePillar }
 * @param auxiliary 辅助宫位 { taiYuan, mingGong, shenGong }
 * @returns { branchRelations, stemRelations }
 *
 * @example
 * analyzeAllRelations(
 *   { yearPillar, monthPillar, dayPillar, timePillar },
 *   { taiYuan, mingGong, shenGong }
 * )
 * // => { branchRelations: [...], stemRelations: [...] }
 */
export function analyzeAllRelations(
  fourPillars: {
    yearPillar: Pillar;
    monthPillar: Pillar;
    dayPillar: Pillar;
    timePillar: Pillar;
  },
  auxiliary: {
    taiYuan: Pillar;
    mingGong: Pillar;
    shenGong: Pillar;
  }
): { branchRelations: RelationResult[]; stemRelations: StemRelationResult[] } {
  // 四柱（天干关系仅检查四柱）
  const stemPillars: { name: string; pillar: Pillar }[] = [
    { name: '年', pillar: fourPillars.yearPillar },
    { name: '月', pillar: fourPillars.monthPillar },
    { name: '日', pillar: fourPillars.dayPillar },
    { name: '时', pillar: fourPillars.timePillar },
  ];

  // 四柱 + 辅助宫位（地支关系检查全部柱位）
  const branchPillars: { name: string; pillar: Pillar }[] = [
    ...stemPillars,
    { name: '胎', pillar: auxiliary.taiYuan },
    { name: '命', pillar: auxiliary.mingGong },
    { name: '身', pillar: auxiliary.shenGong },
  ];

  return {
    branchRelations: analyzeBranchRelations(branchPillars),
    stemRelations: analyzeStemRelations(stemPillars),
  };
}
