/**
 * 排盘引擎 层7：神煞
 *
 * 25+种神煞按各自查法依据起法：
 * - 日干查：天乙贵人、文昌、禄神、金舆
 * - 年干查：天乙贵人（辅）
 * - 年支查：华盖、驿马、桃花、将星、灾煞、劫煞、孤辰寡宿、天罗地网
 * - 日支查：华盖（辅）、驿马（辅）、桃花（辅）、将星（辅）
 * - 月支查：天德贵人、月德贵人
 * - 日柱查：魁罡、空亡（旬空）
 *
 * 来源：[项目大纲 规则#20-#21, 11.3, 11.8, 11.17]
 */

import type { Stem, Branch, Gender, FourPillars } from './types';
import {
  branchIndex,
  TIAN_YI_GUI_REN, WEN_CHANG,
  HUA_GAI, YI_MA, TAO_HUA, JIANG_XING, ZAI_SHA, JIE_SHA,
  GU_CHEN_GUA_SU, KUI_GANG, TIAN_LUO, DI_WANG,
  JIN_YU, TIAN_DE, YUE_DE,
  LU_POSITION, YANG_REN_LU_QIAN, YANG_REN_YANG, YANG_REN_DI_WANG,
  STEM_ELEMENT,
} from './constants';

// 年支→三合局组名
function getSanHeGroup(branch: Branch): string {
  const groups: Record<string, string> = {
    '申': '申子辰', '子': '申子辰', '辰': '申子辰',
    '寅': '寅午戌', '午': '寅午戌', '戌': '寅午戌',
    '巳': '巳酉丑', '酉': '巳酉丑', '丑': '巳酉丑',
    '亥': '亥卯未', '卯': '亥卯未', '未': '亥卯未',
  };
  return groups[branch] || '';
}

// 月支→月序号（寅=1, 卯=2, ..., 丑=12）
function getMonthNumber(monthBranch: Branch): number {
  const idx = branchIndex(monthBranch);
  return ((idx - 2 + 12) % 12) + 1;
}

/**
 * 计算所有神煞
 */
export function calculateShenSha(
  fourPillars: FourPillars,
  gender: Gender,
): Record<string, string[]> {
  // key = 柱名, value = 神煞列表
  const result: Record<string, string[]> = {
    year: [],
    month: [],
    day: [],
    hour: [],
  };

  const dayStem = fourPillars.day.stem;
  const yearBranch = fourPillars.year.branch;
  const dayBranch = fourPillars.day.branch;
  const monthBranch = fourPillars.month.branch;
  const yearStem = fourPillars.year.stem;

  const allBranches: { name: string; branch: Branch }[] = [
    { name: 'year', branch: yearBranch },
    { name: 'month', branch: monthBranch },
    { name: 'day', branch: dayBranch },
    { name: 'hour', branch: fourPillars.hour.branch },
  ];

  const allStems: { name: string; stem: Stem }[] = [
    { name: 'year', stem: fourPillars.year.stem },
    { name: 'month', stem: fourPillars.month.stem },
    { name: 'day', stem: fourPillars.day.stem },
    { name: 'hour', stem: fourPillars.hour.stem },
  ];

  // 1. 天乙贵人（日干查，年干辅）
  const tianYi = TIAN_YI_GUI_REN[dayStem] || [];
  for (const { name, branch } of allBranches) {
    if (tianYi.includes(branch)) {
      result[name].push('天乙贵人');
    }
  }

  // 2. 文昌贵人（日干查）
  const wenChang = WEN_CHANG[dayStem];
  for (const { name, branch } of allBranches) {
    if (branch === wenChang) {
      result[name].push('文昌贵人');
    }
  }

  // 3. 华盖（年支查，日支辅）
  const huaGai = HUA_GAI[getSanHeGroup(yearBranch)];
  for (const { name, branch } of allBranches) {
    if (branch === huaGai) {
      result[name].push('华盖');
    }
  }

  // 4. 驿马（年支查）
  const yiMa = YI_MA[getSanHeGroup(yearBranch)];
  for (const { name, branch } of allBranches) {
    if (branch === yiMa) {
      result[name].push('驿马');
    }
  }

  // 5. 桃花（年支查）
  const taoHua = TAO_HUA[getSanHeGroup(yearBranch)];
  for (const { name, branch } of allBranches) {
    if (branch === taoHua) {
      result[name].push('桃花');
    }
  }

  // 6. 将星（年支查）
  const jiangXing = JIANG_XING[getSanHeGroup(yearBranch)];
  for (const { name, branch } of allBranches) {
    if (branch === jiangXing) {
      result[name].push('将星');
    }
  }

  // 7. 灾煞（年支查，将星对冲）
  const zaiSha = ZAI_SHA[getSanHeGroup(yearBranch)];
  for (const { name, branch } of allBranches) {
    if (branch === zaiSha) {
      result[name].push('灾煞');
    }
  }

  // 8. 劫煞（年支查）
  const jieSha = JIE_SHA[getSanHeGroup(yearBranch)];
  for (const { name, branch } of allBranches) {
    if (branch === jieSha) {
      result[name].push('劫煞');
    }
  }

  // 9. 孤辰寡宿（年支查）
  const group3 = getSanHuiGroup(yearBranch);
  const guGua = GU_CHEN_GUA_SU[group3];
  if (guGua) {
    for (const { name, branch } of allBranches) {
      if (branch === guGua.gu) result[name].push('孤辰');
      if (branch === guGua.gua) result[name].push('寡宿');
    }
  }

  // 10. 魁罡（日柱查）
  if (KUI_GANG.includes(fourPillars.day.ganzhi)) {
    result.day.push('魁罡');
  }

  // 11. 天罗地网（年支查，男查天罗/女查地网）
  for (const { name, branch } of allBranches) {
    if (gender === '男' && TIAN_LUO.includes(branch)) {
      result[name].push('天罗');
    }
    if (gender === '女' && DI_WANG.includes(branch)) {
      result[name].push('地网');
    }
  }

  // 12. 金舆（日干查）
  const jinYu = JIN_YU[dayStem];
  for (const { name, branch } of allBranches) {
    if (branch === jinYu) {
      result[name].push('金舆');
    }
  }

  // 13. 禄神（日干查）
  const lu = LU_POSITION[dayStem];
  for (const { name, branch } of allBranches) {
    if (branch === lu) {
      result[name].push('禄神');
    }
  }

  // 14. 天德贵人（月支查，干支混查）
  const monthNum = getMonthNumber(monthBranch);
  const tianDe = TIAN_DE[monthNum];
  if (tianDe) {
    if (tianDe.type === '干') {
      const targetStem = tianDe.value as Stem;
      for (const { name, stem } of allStems) {
        if (stem === targetStem) {
          result[name].push('天德贵人');
        }
      }
    } else {
      const targetBranch = tianDe.value as Branch;
      for (const { name, branch } of allBranches) {
        if (branch === targetBranch) {
          result[name].push('天德贵人');
        }
      }
    }
  }

  // 15. 月德贵人（月支查，三合局）
  const yueDe = YUE_DE[getSanHeGroup(monthBranch)];
  if (yueDe) {
    for (const { name, stem } of allStems) {
      if (stem === yueDe) {
        result[name].push('月德贵人');
      }
    }
  }

  // 16. 羊刃（日干查，三体系）
  // 默认采用"禄前一位说"
  const yangRen = YANG_REN_LU_QIAN[dayStem];
  for (const { name, branch } of allBranches) {
    if (branch === yangRen) {
      result[name].push('羊刃');
    }
  }

  return result;
}

// 年支→三会局组名
function getSanHuiGroup(branch: Branch): string {
  const idx = branchIndex(branch);
  if (idx === 2 || idx === 3 || idx === 4) return '寅卯辰';
  if (idx === 5 || idx === 6 || idx === 7) return '巳午未';
  if (idx === 8 || idx === 9 || idx === 10) return '申酉戌';
  return '亥子丑';
}
