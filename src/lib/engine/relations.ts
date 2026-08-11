/**
 * 排盘引擎 层8：关系分析
 *
 * 天干五合 + 化气条件
 * 地支六合/六冲/三合/三会/三刑/六害/相破/半三合
 * 暗合（核心四组+争议组）
 * 拱夹虚邀（三合/三会拱出中神为虚神）
 * 羊刃三体系
 *
 * 来源：[项目大纲 规则#22-#25, 11.14, 11.17, 11.19, 11.21]
 */

import type { Stem, Branch, FourPillars, RelationAnalysis, BranchRelation, StemRelation, Element } from './types';
import {
  SIX_HE, SIX_CLASH, SAN_HE, BAN_SAN_HE, SAN_HUI, SAN_XING, LIU_HAI, XIANG_PO,
  AN_HE, GONG, JIA,
  STEM_COMBINATIONS, STEM_CLASHES, getStemCombination,
  HIDDEN_STEMS,
  YANG_REN_LU_QIAN, YANG_REN_YANG, YANG_REN_DI_WANG,
  STEM_ELEMENT, BRANCH_ELEMENT,
  branchIndex,
} from './constants';

// ============================================================
// 地支关系检测
// ============================================================

function findBranchRelations(branches: Branch[]): BranchRelation[] {
  const result: BranchRelation[] = [];
  const pairs: [Branch, Branch, string, string][] = []; // [b1, b2, pillar1, pillar2]

  const pillarNames = ['年', '月', '日', '时'];
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      pairs.push([branches[i], branches[j], pillarNames[i], pillarNames[j]]);
    }
  }

  // 六合
  for (const { pair, transform } of SIX_HE) {
    for (const [b1, b2, p1, p2] of pairs) {
      if ((pair[0] === b1 && pair[1] === b2) || (pair[0] === b2 && pair[1] === b1)) {
        result.push({ type: '六合', branches: `${p1}${b1}-${p2}${b2}`, description: `${b1}${b2}合`, transform });
      }
    }
  }

  // 六冲
  for (const [s1, s2] of SIX_CLASH) {
    for (const [b1, b2, p1, p2] of pairs) {
      if ((s1 === b1 && s2 === b2) || (s1 === b2 && s2 === b1)) {
        result.push({ type: '六冲', branches: `${p1}${b1}-${p2}${b2}`, description: `${b1}${b2}冲` });
      }
    }
  }

  // 半三合
  for (const { pair, transform, type } of BAN_SAN_HE) {
    for (const [b1, b2, p1, p2] of pairs) {
      if ((pair[0] === b1 && pair[1] === b2) || (pair[0] === b2 && pair[1] === b1)) {
        result.push({ type: '半三合', branches: `${p1}${b1}-${p2}${b2}`, description: `${b1}${b2}${type}`, transform });
      }
    }
  }

  // 三刑
  for (const { type: xingType, pairs: xingPairs } of SAN_XING) {
    for (const [s1, s2] of xingPairs) {
      for (const [b1, b2, p1, p2] of pairs) {
        if (s1 === b1 && s2 === b2) {
          result.push({ type: '三刑', branches: `${p1}${b1}-${p2}${b2}`, description: `${b1}刑${b2}（${xingType}）` });
        }
      }
    }
  }

  // 六害
  for (const [s1, s2] of LIU_HAI) {
    for (const [b1, b2, p1, p2] of pairs) {
      if ((s1 === b1 && s2 === b2) || (s1 === b2 && s2 === b1)) {
        result.push({ type: '六害', branches: `${p1}${b1}-${p2}${b2}`, description: `${b1}${b2}害` });
      }
    }
  }

  // 相破
  for (const [s1, s2] of XIANG_PO) {
    for (const [b1, b2, p1, p2] of pairs) {
      if ((s1 === b1 && s2 === b2) || (s1 === b2 && s2 === b1)) {
        result.push({ type: '相破', branches: `${p1}${b1}-${p2}${b2}`, description: `${b1}${b2}破` });
      }
    }
  }

  // 三合局（需要三支同时存在）
  for (const { branches: triBranch, transform } of SAN_HE) {
    const hasAll = triBranch.every(b => branches.includes(b));
    if (hasAll) {
      result.push({
        type: '三合',
        branches: triBranch.join(''),
        description: `${triBranch.join('')}三合${transform}局`,
        transform,
      });
    }
  }

  // 三会局（需要三支同时存在）
  for (const { branches: triBranch, transform } of SAN_HUI) {
    const hasAll = triBranch.every(b => branches.includes(b));
    if (hasAll) {
      result.push({
        type: '三会',
        branches: triBranch.join(''),
        description: `${triBranch.join('')}三会${transform}局`,
        transform,
      });
    }
  }

  return result;
}

// ============================================================
// 天干关系检测
// ============================================================

function findStemRelations(stems: Stem[], monthBranch: Branch): StemRelation[] {
  const result: StemRelation[] = [];
  const pillarNames = ['年', '月', '日', '时'];

  for (let i = 0; i < stems.length; i++) {
    for (let j = i + 1; j < stems.length; j++) {
      const s1 = stems[i], s2 = stems[j];

      // 天干五合
      const transform = getStemCombination(s1, s2);
      if (transform) {
        // 检查化气条件
        const huaQiMet = checkHuaQi(stems, monthBranch, transform, s1, s2);
        result.push({
          type: '天干五合',
          stems: `${pillarNames[i]}${s1}-${pillarNames[j]}${s2}`,
          transform,
          huaQiMet,
        });
      }

      // 天干相冲
      for (const [c1, c2] of STEM_CLASHES) {
        if ((c1 === s1 && c2 === s2) || (c1 === s2 && c2 === s1)) {
          result.push({
            type: '天干相冲',
            stems: `${pillarNames[i]}${s1}-${pillarNames[j]}${s2}`,
          });
        }
      }
    }
  }

  return result;
}

/**
 * 化气条件判断 [规则#22]
 * ①月令当化神（如甲己化土须辰戌丑未月）
 * ②无争合妒合且化神不被克破
 * ③化神透引（化神天干透出四柱）
 */
function checkHuaQi(stems: Stem[], monthBranch: Branch, transform: Element, s1: Stem, s2: Stem): boolean {
  // ①月令当化神
  const monthElement = BRANCH_ELEMENT[monthBranch];
  if (monthElement !== transform) return false;

  // ②无争合妒合（简化：检查是否有其他天干与s1或s2合）
  for (const s of stems) {
    if (s !== s1 && s !== s2) {
      if (getStemCombination(s, s1) || getStemCombination(s, s2)) {
        return false; // 有争合
      }
    }
  }

  // ③化神透引（化神五行天干透出四柱）
  const hasTransformStem = stems.some(s => STEM_ELEMENT[s] === transform);
  if (!hasTransformStem) return false;

  return true;
}

// ============================================================
// 暗合检测
// ============================================================

function findAnHe(branches: Branch[]): import('./types').AnHeRelation[] {
  const result: import('./types').AnHeRelation[] = [];
  const pillarNames = ['年', '月', '日', '时'];

  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const b1 = branches[i], b2 = branches[j];
      for (const { branches: pair, hiddenStems, controversial } of AN_HE) {
        if ((pair[0] === b1 && pair[1] === b2) || (pair[0] === b2 && pair[1] === b1)) {
          result.push({
            branches: `${pillarNames[i]}${b1}-${pillarNames[j]}${b2}`,
            hiddenStems,
            description: `${b1}${b2}暗合（${hiddenStems}）`,
            controversial,
          });
        }
      }
    }
  }

  return result;
}

// ============================================================
// 拱夹虚邀检测
// ============================================================

function findGongJia(branches: Branch[]): import('./types').GongJiaRelation[] {
  const result: import('./types').GongJiaRelation[] = [];
  const pillarNames = ['年', '月', '日', '时'];

  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const b1 = branches[i], b2 = branches[j];

      // 拱（三合局首尾缺中神）
      for (const { pair, virtual, transform } of GONG) {
        if ((pair[0] === b1 && pair[1] === b2) || (pair[0] === b2 && pair[1] === b1)) {
          // 确认中神不在四柱中
          if (!branches.includes(virtual)) {
            result.push({
              type: '拱',
              branches: `${pillarNames[i]}${b1}-${pillarNames[j]}${b2}`,
              virtualBranch: virtual,
              transform,
            });
          }
        }
      }

      // 夹（三会局首尾缺中神）
      for (const { pair, virtual, transform } of JIA) {
        if ((pair[0] === b1 && pair[1] === b2) || (pair[0] === b2 && pair[1] === b1)) {
          if (!branches.includes(virtual)) {
            result.push({
              type: '夹',
              branches: `${pillarNames[i]}${b1}-${pillarNames[j]}${b2}`,
              virtualBranch: virtual,
              transform,
            });
          }
        }
      }
    }
  }

  return result;
}

// ============================================================
// 羊刃三体系
// ============================================================

function findYangRen(dayStem: Stem): { stem: Stem; positions: { system: string; branch: import('./types').Branch }[] } | null {
  const positions: { system: string; branch: import('./types').Branch }[] = [];

  const luQian = YANG_REN_LU_QIAN[dayStem];
  if (luQian) positions.push({ system: '禄前一位说', branch: luQian });

  const yang = YANG_REN_YANG[dayStem];
  if (yang) positions.push({ system: '五阳干说', branch: yang });

  const diWang = YANG_REN_DI_WANG[dayStem];
  if (diWang) positions.push({ system: '帝旺位说', branch: diWang });

  if (positions.length === 0) return null;
  return { stem: dayStem, positions };
}

// ============================================================
// 关系分析组装
// ============================================================

export function calculateRelations(fourPillars: FourPillars): RelationAnalysis {
  const stems: Stem[] = [
    fourPillars.year.stem,
    fourPillars.month.stem,
    fourPillars.day.stem,
    fourPillars.hour.stem,
  ];
  const branches: Branch[] = [
    fourPillars.year.branch,
    fourPillars.month.branch,
    fourPillars.day.branch,
    fourPillars.hour.branch,
  ];

  const branchRelations = findBranchRelations(branches);
  const stemRelations = findStemRelations(stems, fourPillars.month.branch);
  const anHeRelations = findAnHe(branches);
  const gongJiaRelations = findGongJia(branches);
  const yangRen = findYangRen(fourPillars.day.stem);

  return {
    branchRelations,
    stemRelations,
    anHeRelations,
    gongJiaRelations,
    yangRen,
  };
}
