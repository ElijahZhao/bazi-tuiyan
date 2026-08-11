/**
 * 排盘引擎 — 常量数据表
 *
 * 全部数据来源：[项目大纲 第十一章 排盘引擎详细数据表]
 * 古籍原文来源：[参考来源文件 第六节]
 */

import type { Stem, Branch, Element, YinYang, HiddenStem, Pillar } from './types';

// Re-export types for modules that import from constants
export type { Stem, Branch, Element, YinYang, HiddenStem, Pillar };

// ============================================================
// 天干地支
// ============================================================

export const HEAVENLY_STEMS: Stem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const EARTHLY_BRANCHES: Branch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// [11.9] 天干阴阳
export const STEM_YIN_YANG: Record<Stem, YinYang> = {
  甲: '阳', 丙: '阳', 戊: '阳', 庚: '阳', 壬: '阳',
  乙: '阴', 丁: '阴', 己: '阴', 辛: '阴', 癸: '阴',
};

// 天干五行
export const STEM_ELEMENT: Record<Stem, Element> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};

// 地支五行
export const BRANCH_ELEMENT: Record<Branch, Element> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
};

// 五行相生：木生火，火生土，土生金，金生水，水生木
export const GENERATING: Record<Element, Element> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
};

// 五行相克：木克土，土克水，水克火，火克金，金克木
export const OVERCOMING: Record<Element, Element> = {
  木: '土', 土: '水', 水: '火', 火: '金', 金: '木',
};

// ============================================================
// 索引辅助
// ============================================================

export function stemIndex(stem: Stem): number {
  return HEAVENLY_STEMS.indexOf(stem);
}

export function branchIndex(branch: Branch): number {
  return EARTHLY_BRANCHES.indexOf(branch);
}

export function stemFromIndex(idx: number): Stem {
  return HEAVENLY_STEMS[((idx % 10) + 10) % 10];
}

export function branchFromIndex(idx: number): Branch {
  return EARTHLY_BRANCHES[((idx % 12) + 12) % 12];
}

// ============================================================
// 六十甲子 + 纳音 [11.7]
// ============================================================

export interface JiaZiItem {
  stem: Stem;
  branch: Branch;
  ganzhi: string;
  nayin: string;
  nayinElement: Element;
}

// 六十甲子纳音30对照表 [项目大纲 11.7]
const NAYIN_TABLE: { pairs: [string, string, string, Element][] } = {
  pairs: [
    ['甲子', '乙丑', '海中金', '金'],
    ['丙寅', '丁卯', '炉中火', '火'],
    ['戊辰', '己巳', '大林木', '木'],
    ['庚午', '辛未', '路旁土', '土'],
    ['壬申', '癸酉', '剑锋金', '金'],
    ['甲戌', '乙亥', '山头火', '火'],
    ['丙子', '丁丑', '涧下水', '水'],
    ['戊寅', '己卯', '城头土', '土'],
    ['庚辰', '辛巳', '白蜡金', '金'],
    ['壬午', '癸未', '杨柳木', '木'],
    ['甲申', '乙酉', '泉中水', '水'],
    ['丙戌', '丁亥', '屋上土', '土'],
    ['戊子', '己丑', '霹雳火', '火'],
    ['庚寅', '辛卯', '松柏木', '木'],
    ['壬辰', '癸巳', '长流水', '水'],
    ['甲午', '乙未', '沙中金', '金'],
    ['丙申', '丁酉', '山下火', '火'],
    ['戊戌', '己亥', '平地木', '木'],
    ['庚子', '辛丑', '壁上土', '土'],
    ['壬寅', '癸卯', '金箔金', '金'],
    ['甲辰', '乙巳', '覆灯火', '火'],
    ['丙午', '丁未', '天河水', '水'],
    ['戊申', '己酉', '大驿土', '土'],
    ['庚戌', '辛亥', '钗钏金', '金'],
    ['壬子', '癸丑', '桑柘木', '木'],
    ['甲寅', '乙卯', '大溪水', '水'],
    ['丙辰', '丁巳', '沙中土', '土'],
    ['戊午', '己未', '天上火', '火'],
    ['庚申', '辛酉', '石榴木', '木'],
    ['壬戌', '癸亥', '大海水', '水'],
  ],
};

export const SIXTY_JIAZI: JiaZiItem[] = (() => {
  const result: JiaZiItem[] = [];
  for (const [gz1, gz2, nayin, elem] of NAYIN_TABLE.pairs) {
    const stem1 = gz1[0] as Stem;
    const branch1 = gz1[1] as Branch;
    const stem2 = gz2[0] as Stem;
    const branch2 = gz2[1] as Branch;
    result.push({ stem: stem1, branch: branch1, ganzhi: gz1, nayin, nayinElement: elem });
    result.push({ stem: stem2, branch: branch2, ganzhi: gz2, nayin, nayinElement: elem });
  }
  return result;
})();

// 通过天干地支查六十甲子索引
export function jiaZiIndex(stem: Stem, branch: Branch): number {
  // 六十甲子中干支同进：天干 index 和地支 index 的差恒定
  // idx = (stemIdx - branchIdx) mod 12 的大组 + branchIdx
  // 更简单：遍历查找
  return SIXTY_JIAZI.findIndex(item => item.stem === stem && item.branch === branch);
}

// 通过索引构造 Pillar
export function pillarFromIndex(idx: number): Pillar {
  const item = SIXTY_JIAZI[((idx % 60) + 60) % 60];
  return {
    stem: item.stem,
    branch: item.branch,
    ganzhi: item.ganzhi,
    nayin: item.nayin,
    nayinElement: item.nayinElement,
  };
}

export function pillarFromStemBranch(stem: Stem, branch: Branch): Pillar {
  const idx = jiaZiIndex(stem, branch);
  if (idx >= 0) return pillarFromIndex(idx);
  return { stem, branch, ganzhi: `${stem}${branch}`, nayin: '', nayinElement: '土' };
}

// ============================================================
// 地支藏干 [11.6] — 《渊海子平》体系
// ============================================================

export const HIDDEN_STEMS: Record<Branch, HiddenStem[]> = {
  子: [{ stem: '癸', type: '本气', ratio: 1.0 }],
  丑: [
    { stem: '己', type: '本气', ratio: 0.6 },
    { stem: '癸', type: '中气', ratio: 0.25 },
    { stem: '辛', type: '余气', ratio: 0.15 },
  ],
  寅: [
    { stem: '甲', type: '本气', ratio: 0.6 },
    { stem: '丙', type: '中气', ratio: 0.25 },
    { stem: '戊', type: '余气', ratio: 0.15 },
  ],
  卯: [{ stem: '乙', type: '本气', ratio: 1.0 }],
  辰: [
    { stem: '戊', type: '本气', ratio: 0.6 },
    { stem: '乙', type: '中气', ratio: 0.25 },
    { stem: '癸', type: '余气', ratio: 0.15 },
  ],
  巳: [
    { stem: '丙', type: '本气', ratio: 0.6 },
    { stem: '戊', type: '中气', ratio: 0.25 },
    { stem: '庚', type: '余气', ratio: 0.15 },
  ],
  午: [
    { stem: '丁', type: '本气', ratio: 0.7 },
    { stem: '己', type: '中气', ratio: 0.3 },
  ],
  未: [
    { stem: '己', type: '本气', ratio: 0.6 },
    { stem: '丁', type: '中气', ratio: 0.25 },
    { stem: '乙', type: '余气', ratio: 0.15 },
  ],
  申: [
    { stem: '庚', type: '本气', ratio: 0.6 },
    { stem: '壬', type: '中气', ratio: 0.25 },
    { stem: '戊', type: '余气', ratio: 0.15 },
  ],
  酉: [{ stem: '辛', type: '本气', ratio: 1.0 }],
  戌: [
    { stem: '戊', type: '本气', ratio: 0.6 },
    { stem: '辛', type: '中气', ratio: 0.25 },
    { stem: '丁', type: '余气', ratio: 0.15 },
  ],
  亥: [
    { stem: '壬', type: '本气', ratio: 0.7 },
    { stem: '甲', type: '中气', ratio: 0.3 },
  ],
};

// ============================================================
// 五虎遁 / 五鼠遁 [11.12]
// ============================================================

// 五虎遁：年干 → 寅月天干，逐月顺排
// [甲己→丙, 乙庚→戊, 丙辛→庚, 丁壬→壬, 戊癸→甲]
const WU_HU_DUN_START: number[] = [2, 4, 6, 8, 0]; // 寅月起始天干索引

export function wuHuDun(yearStem: Stem, monthBranchIndex: number): Stem {
  // monthBranchIndex: 子=0,丑=1,...,亥=11
  // 寅=2, 卯=3, ..., 丑=1
  // 从寅月开始计算偏移
  const yearStemIdx = stemIndex(yearStem);
  // 五组：甲(0)己(5)→0, 乙(1)庚(6)→1, 丙(2)辛(7)→2, 丁(3)壬(8)→3, 戊(4)癸(9)→4
  const group = yearStemIdx % 5;
  const startStemIdx = WU_HU_DUN_START[group];
  // 寅月偏移=0, 卯月偏移=1, ..., 丑月偏移=11
  // monthBranchIndex: 寅=2 → offset=0, 卯=3 → offset=1
  const offset = ((monthBranchIndex - 2) % 12 + 12) % 12;
  return stemFromIndex(startStemIdx + offset);
}

// 五鼠遁：日干 → 子时天干，逐时顺排
// [甲己→甲, 乙庚→丙, 丙辛→戊, 丁壬→庚, 戊癸→壬]
const WU_SHU_DUN_START: number[] = [0, 2, 4, 6, 8]; // 子时起始天干索引

export function wuShuDun(dayStem: Stem, hourBranchIndex: number): Stem {
  const dayStemIdx = stemIndex(dayStem);
  // 五组：甲(0)己(5)→0, 乙(1)庚(6)→1, 丙(2)辛(7)→2, 丁(3)壬(8)→3, 戊(4)癸(9)→4
  const group = dayStemIdx % 5;
  const startStemIdx = WU_SHU_DUN_START[group];
  return stemFromIndex(startStemIdx + hourBranchIndex);
}

// ============================================================
// 十神 [11.18]
// ============================================================

export function getTenGod(dayMaster: Stem, target: Stem): import('./types').TenGod {
  const dmElem = STEM_ELEMENT[dayMaster];
  const tgtElem = STEM_ELEMENT[target];
  const dmYinYang = STEM_YIN_YANG[dayMaster];
  const tgtYinYang = STEM_YIN_YANG[target];
  const sameYinYang = dmYinYang === tgtYinYang;

  if (dmElem === tgtElem) {
    return sameYinYang ? '比肩' : '劫财';
  }
  if (GENERATING[dmElem] === tgtElem) {
    // 我生
    return sameYinYang ? '食神' : '伤官';
  }
  if (OVERCOMING[dmElem] === tgtElem) {
    // 我克
    return sameYinYang ? '偏财' : '正财';
  }
  if (OVERCOMING[tgtElem] === dmElem) {
    // 克我
    return sameYinYang ? '七杀' : '正官';
  }
  // 生我
  return sameYinYang ? '偏印' : '正印';
}

// ============================================================
// 六甲空亡 [11.8]
// ============================================================

export const KONG_WANG: Record<string, Branch[]> = {
  '甲子': ['戌', '亥'],
  '甲戌': ['申', '酉'],
  '甲申': ['午', '未'],
  '甲午': ['辰', '巳'],
  '甲辰': ['寅', '卯'],
  '甲寅': ['子', '丑'],
};

export function getKongWang(pillarIdx: number): Branch[] {
  // 找到所在旬首
  const xunIdx = Math.floor(pillarIdx / 10) * 10;
  const xunName = SIXTY_JIAZI[xunIdx].ganzhi;
  return KONG_WANG[xunName] || [];
}

// ============================================================
// 天干五合 [11.19]
// ============================================================

export const STEM_COMBINATIONS: { pair: [Stem, Stem]; transform: Element }[] = [
  { pair: ['甲', '己'], transform: '土' },
  { pair: ['乙', '庚'], transform: '金' },
  { pair: ['丙', '辛'], transform: '水' },
  { pair: ['丁', '壬'], transform: '木' },
  { pair: ['戊', '癸'], transform: '火' },
];

export function getStemCombination(stem1: Stem, stem2: Stem): Element | null {
  for (const { pair, transform } of STEM_COMBINATIONS) {
    if ((pair[0] === stem1 && pair[1] === stem2) || (pair[0] === stem2 && pair[1] === stem1)) {
      return transform;
    }
  }
  return null;
}

// 天干相冲（冲破）[11.19]
export const STEM_CLASHES: [Stem, Stem][] = [
  ['甲', '庚'], ['乙', '辛'], ['丙', '壬'], ['丁', '癸'],
];

// ============================================================
// 地支关系 [11.14]
// ============================================================

// 六合
export const SIX_HE: { pair: [Branch, Branch]; transform: Element }[] = [
  { pair: ['子', '丑'], transform: '土' },
  { pair: ['寅', '亥'], transform: '木' },
  { pair: ['卯', '戌'], transform: '火' },
  { pair: ['辰', '酉'], transform: '金' },
  { pair: ['巳', '申'], transform: '水' },
  { pair: ['午', '未'], transform: '土' }, // 争议：火/土，默认取土
];

// 六冲
export const SIX_CLASH: [Branch, Branch][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'],
  ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
];

// 三合局
export const SAN_HE: { branches: [Branch, Branch, Branch]; transform: Element; zhongShen: Branch }[] = [
  { branches: ['申', '子', '辰'], transform: '水', zhongShen: '子' },
  { branches: ['寅', '午', '戌'], transform: '火', zhongShen: '午' },
  { branches: ['巳', '酉', '丑'], transform: '金', zhongShen: '酉' },
  { branches: ['亥', '卯', '未'], transform: '木', zhongShen: '卯' },
];

// 半三合
export const BAN_SAN_HE: { pair: [Branch, Branch]; transform: Element; type: string }[] = [
  { pair: ['申', '子'], transform: '水', type: '生旺半合' },
  { pair: ['子', '辰'], transform: '水', type: '旺墓半合' },
  { pair: ['寅', '午'], transform: '火', type: '生旺半合' },
  { pair: ['午', '戌'], transform: '火', type: '旺墓半合' },
  { pair: ['巳', '酉'], transform: '金', type: '生旺半合' },
  { pair: ['酉', '丑'], transform: '金', type: '旺墓半合' },
  { pair: ['亥', '卯'], transform: '木', type: '生旺半合' },
  { pair: ['卯', '未'], transform: '木', type: '旺墓半合' },
];

// 三会局
export const SAN_HUI: { branches: [Branch, Branch, Branch]; transform: Element }[] = [
  { branches: ['寅', '卯', '辰'], transform: '木' },
  { branches: ['巳', '午', '未'], transform: '火' },
  { branches: ['申', '酉', '戌'], transform: '金' },
  { branches: ['亥', '子', '丑'], transform: '水' },
];

// 三刑
export const SAN_XING: { type: string; pairs: [Branch, Branch][] }[] = [
  { type: '无恩之刑', pairs: [['寅', '巳'], ['巳', '申'], ['申', '寅']] },
  { type: '恃势之刑', pairs: [['丑', '戌'], ['戌', '未'], ['未', '丑']] },
  { type: '无礼之刑', pairs: [['子', '卯'], ['卯', '子']] },
  { type: '自刑', pairs: [['辰', '辰'], ['午', '午'], ['酉', '酉'], ['亥', '亥']] },
];

// 六害
export const LIU_HAI: [Branch, Branch][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'],
  ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
];

// 相破
export const XIANG_PO: [Branch, Branch][] = [
  ['子', '酉'], ['丑', '辰'], ['寅', '亥'],
  ['卯', '午'], ['巳', '申'], ['未', '戌'],
];

// ============================================================
// 暗合 [规则 #24]
// ============================================================

export const AN_HE: { branches: [Branch, Branch]; hiddenStems: string; controversial?: boolean }[] = [
  { branches: ['寅', '丑'], hiddenStems: '甲己合' },
  { branches: ['午', '亥'], hiddenStems: '丁壬合' },
  { branches: ['卯', '申'], hiddenStems: '乙庚合' },
  { branches: ['子', '巳'], hiddenStems: '癸戊合' },
  { branches: ['巳', '戌'], hiddenStems: '丙辛合', controversial: true },
];

// ============================================================
// 拱夹虚邀 [11.21]
// ============================================================

// 拱（三合局首尾缺中神）
export const GONG: { pair: [Branch, Branch]; virtual: Branch; transform: Element }[] = [
  { pair: ['申', '辰'], virtual: '子', transform: '水' },
  { pair: ['寅', '戌'], virtual: '午', transform: '火' },
  { pair: ['巳', '丑'], virtual: '酉', transform: '金' },
  { pair: ['亥', '未'], virtual: '卯', transform: '木' },
];

// 夹（三会局首尾缺中神）
export const JIA: { pair: [Branch, Branch]; virtual: Branch; transform: Element }[] = [
  { pair: ['寅', '辰'], virtual: '卯', transform: '木' },
  { pair: ['巳', '未'], virtual: '午', transform: '火' },
  { pair: ['申', '戌'], virtual: '酉', transform: '金' },
  { pair: ['亥', '丑'], virtual: '子', transform: '水' },
];

// ============================================================
// 五行旺相休囚死 [11.4]
// ============================================================

export const WANG_SHUAI: Record<string, Record<Element, '旺' | '相' | '休' | '囚' | '死'>> = {
  '春': { 木: '旺', 火: '相', 水: '休', 金: '囚', 土: '死' },
  '夏': { 火: '旺', 土: '相', 木: '休', 水: '囚', 金: '死' },
  '秋': { 金: '旺', 水: '相', 土: '休', 火: '囚', 木: '死' },
  '冬': { 水: '旺', 木: '相', 金: '休', 土: '囚', 火: '死' },
  '四季': { 土: '旺', 金: '相', 火: '休', 木: '囚', 水: '死' },
};

// 月支→季节
export function getSeason(monthBranch: Branch): string {
  const branchIdx = branchIndex(monthBranch);
  // 寅卯=春(2,3), 巳午=夏(5,6), 申酉=秋(8,9), 亥子=冬(11,0), 辰戌丑未=四季(4,10,1,7)
  if (branchIdx === 2 || branchIdx === 3) return '春';
  if (branchIdx === 5 || branchIdx === 6) return '夏';
  if (branchIdx === 8 || branchIdx === 9) return '秋';
  if (branchIdx === 11 || branchIdx === 0) return '冬';
  return '四季';
}

// ============================================================
// 人元司令分野 [11.5] — 《三命通会》卷一
// ============================================================

export const REN_YUAN_SI_LING: Record<Branch, { stem: Stem; days: number; description: string }[]> = {
  寅: [
    { stem: '戊', days: 5, description: '艮土用事五日' },
    { stem: '丙', days: 5, description: '丙火长生五日' },
    { stem: '甲', days: 20, description: '甲木二十日' },
  ],
  卯: [
    { stem: '甲', days: 7, description: '甲木用事七日' },
    { stem: '乙', days: 23, description: '乙木二十三日' },
  ],
  辰: [
    { stem: '乙', days: 7, description: '乙木用事七日' },
    { stem: '壬', days: 5, description: '壬水墓库五日' },
    { stem: '戊', days: 18, description: '戊土十八日' },
  ],
  巳: [
    { stem: '戊', days: 7, description: '戊土七日' },
    { stem: '庚', days: 5, description: '庚金长生五日' },
    { stem: '丙', days: 18, description: '丙火十八日' },
  ],
  午: [
    { stem: '丙', days: 7, description: '丙火用事七日' },
    { stem: '丁', days: 23, description: '丁火二十三日' },
  ],
  未: [
    { stem: '丁', days: 7, description: '丁火用事七日' },
    { stem: '甲', days: 5, description: '甲木墓库五日' },
    { stem: '己', days: 18, description: '己土十八日' },
  ],
  申: [
    { stem: '戊', days: 5, description: '坤土用事五日' },
    { stem: '壬', days: 5, description: '壬水长生五日' },
    { stem: '庚', days: 20, description: '庚金二十日' },
  ],
  酉: [
    { stem: '庚', days: 7, description: '庚金用事七日' },
    { stem: '辛', days: 23, description: '辛金二十三日' },
  ],
  戌: [
    { stem: '辛', days: 7, description: '辛金用事七日' },
    { stem: '丙', days: 5, description: '丙火墓库五日' },
    { stem: '戊', days: 18, description: '戊土十八日' },
  ],
  亥: [
    { stem: '戊', days: 5, description: '戊土五日' },
    { stem: '甲', days: 5, description: '甲木长生五日' },
    { stem: '壬', days: 20, description: '壬水用事二十日' },
  ],
  子: [
    { stem: '壬', days: 7, description: '壬水用事七日' },
    { stem: '癸', days: 23, description: '癸水二十三日' },
  ],
  丑: [
    { stem: '癸', days: 7, description: '癸水用事七日' },
    { stem: '庚', days: 5, description: '庚金墓库五日' },
    { stem: '己', days: 18, description: '己土十八日' },
  ],
};

// ============================================================
// 十二长生 [11.13]
// ============================================================

export const CHANG_SHENG_12: import('./types').ChangShengState[] = [
  '长生', '沐浴', '冠带', '临官', '帝旺',
  '衰', '病', '死', '墓', '绝', '胎', '养',
];

// 阳干顺行起点（长生位）
export const YANG_CHANG_SHENG: Partial<Record<Stem, Branch>> = {
  甲: '亥', 丙: '寅', 戊: '寅', 庚: '巳', 壬: '申',
};

// 阴干逆行起点（参考性）
export const YIN_CHANG_SHENG: Partial<Record<Stem, Branch>> = {
  乙: '午', 丁: '酉', 己: '酉', 辛: '子', 癸: '卯',
};

// ============================================================
// 羊刃三体系 [11.17]
// ============================================================

export const LU_POSITION: Record<Stem, Branch> = {
  甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳',
  己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子',
};

// 羊刃（禄前一位说，默认）
export const YANG_REN_LU_QIAN: Record<Stem, Branch> = {
  甲: '卯', 乙: '辰', 丙: '午', 丁: '未', 戊: '午',
  己: '未', 庚: '酉', 辛: '戌', 壬: '子', 癸: '丑',
};

// 羊刃（五阳干说）
export const YANG_REN_YANG: Partial<Record<Stem, Branch>> = {
  甲: '卯', 丙: '午', 戊: '午', 庚: '酉', 壬: '子',
};

// 羊刃（帝旺位说）
export const YANG_REN_DI_WANG: Record<Stem, Branch> = {
  甲: '卯', 乙: '寅', 丙: '午', 丁: '巳', 戊: '午',
  己: '巳', 庚: '酉', 辛: '申', 壬: '子', 癸: '亥',
};

// ============================================================
// 神煞口诀 [11.3]
// ============================================================

// 天乙贵人（日干查）
export const TIAN_YI_GUI_REN: Record<Stem, Branch[]> = {
  甲: ['丑', '未'], 乙: ['子', '申'], 丙: ['酉', '亥'],
  丁: ['酉', '亥'], 戊: ['丑', '未'], 己: ['子', '申'],
  庚: ['丑', '未'], 辛: ['午', '寅'], 壬: ['卯', '巳'],
  癸: ['卯', '巳'],
};

// 文昌贵人（日干查）
export const WEN_CHANG: Record<Stem, Branch> = {
  甲: '巳', 乙: '午', 丙: '申', 丁: '酉', 戊: '申',
  己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯',
};

// 华盖（年支查）
export const HUA_GAI: Record<string, Branch> = {
  '寅午戌': '戌', '申子辰': '辰', '巳酉丑': '丑', '亥卯未': '未',
};

// 驿马（年支查）
export const YI_MA: Record<string, Branch> = {
  '寅午戌': '申', '申子辰': '寅', '巳酉丑': '亥', '亥卯未': '巳',
};

// 桃花（年支查）
export const TAO_HUA: Record<string, Branch> = {
  '寅午戌': '卯', '申子辰': '酉', '巳酉丑': '午', '亥卯未': '子',
};

// 将星（年支查）
export const JIANG_XING: Record<string, Branch> = {
  '寅午戌': '午', '申子辰': '子', '巳酉丑': '酉', '亥卯未': '卯',
};

// 灾煞（年支查，将星对冲）
export const ZAI_SHA: Record<string, Branch> = {
  '寅午戌': '子', '申子辰': '午', '巳酉丑': '卯', '亥卯未': '酉',
};

// 劫煞（年支查）
export const JIE_SHA: Record<string, Branch> = {
  '寅午戌': '亥', '申子辰': '巳', '巳酉丑': '寅', '亥卯未': '申',
};

// 孤辰寡宿（年支查）
export const GU_CHEN_GUA_SU: Record<string, { gu: Branch; gua: Branch }> = {
  '亥子丑': { gu: '寅', gua: '戌' },
  '寅卯辰': { gu: '巳', gua: '丑' },
  '巳午未': { gu: '申', gua: '辰' },
  '申酉戌': { gu: '亥', gua: '未' },
};

// 魁罡（日柱查）
export const KUI_GANG: string[] = ['壬辰', '庚戌', '庚辰', '戊戌'];

// 天罗地网（年支查，男查天罗/女查地网）
export const TIAN_LUO: Branch[] = ['戌', '亥'];
export const DI_WANG: Branch[] = ['辰', '巳'];

// 金舆（日干查）
export const JIN_YU: Record<Stem, Branch> = {
  甲: '辰', 乙: '巳', 丙: '未', 丁: '申', 戊: '未',
  己: '申', 庚: '戌', 辛: '亥', 壬: '丑', 癸: '寅',
};

// 天德贵人（月支查，干支混查）
export const TIAN_DE: Record<number, { type: '干' | '支'; value: string }> = {
  1: { type: '干', value: '丁' },   // 正月
  2: { type: '支', value: '申' },   // 二月
  3: { type: '干', value: '壬' },   // 三月
  4: { type: '干', value: '辛' },   // 四月
  5: { type: '支', value: '亥' },   // 五月
  6: { type: '干', value: '甲' },   // 六月
  7: { type: '干', value: '癸' },   // 七月
  8: { type: '支', value: '寅' },   // 八月
  9: { type: '干', value: '丙' },   // 九月
  10: { type: '干', value: '乙' },  // 十月
  11: { type: '支', value: '巳' },  // 十一月
  12: { type: '干', value: '庚' },  // 十二月
};

// 月德贵人（月支查，三合局）
export const YUE_DE: Record<string, Stem> = {
  '寅午戌': '丙', '申子辰': '壬', '巳酉丑': '庚', '亥卯未': '甲',
};

// ============================================================
// 夏令时 [11.10]
// ============================================================

export const DST_PERIODS: { year: number; start: [number, number]; end: [number, number] }[] = [
  { year: 1986, start: [5, 4], end: [9, 14] },
  { year: 1987, start: [4, 12], end: [9, 13] },
  { year: 1988, start: [4, 10], end: [9, 11] },
  { year: 1989, start: [4, 16], end: [9, 17] },
  { year: 1990, start: [4, 15], end: [9, 16] },
  { year: 1991, start: [4, 14], end: [9, 15] },
];

// ============================================================
// 城市经度表
// ============================================================

export const CITY_LONGITUDES: Record<string, number> = {
  '北京': 116.41, '上海': 121.47, '广州': 113.23, '深圳': 114.06,
  '杭州': 120.16, '南京': 118.78, '成都': 104.07, '重庆': 106.55,
  '武汉': 114.31, '西安': 108.94, '天津': 117.20, '苏州': 120.62,
  '长沙': 112.94, '郑州': 113.62, '沈阳': 123.43, '青岛': 120.38,
  '大连': 121.62, '哈尔滨': 126.64, '济南': 117.00, '昆明': 102.83,
  '贵阳': 106.71, '南宁': 108.37, '兰州': 103.83, '太原': 112.55,
  '合肥': 117.27, '南昌': 115.89, '福州': 119.30, '厦门': 118.09,
  '石家庄': 114.51, '长春': 125.32, '呼和浩特': 111.75, '乌鲁木齐': 87.62,
  '拉萨': 91.13, '银川': 106.23, '西宁': 101.78, '海口': 110.32,
  '唐山': 118.18, '无锡': 120.30, '宁波': 121.55,
  '温州': 120.70, '佛山': 113.12, '东莞': 113.75, '珠海': 113.58,
  '中山': 113.39, '惠州': 114.42, '汕头': 116.68, '湛江': 110.36,
  '桂林': 110.18, '三亚': 109.51, '丽江': 100.23, '承德': 117.94,
  '大同': 113.30, '洛阳': 112.45, '开封': 114.30, '扬州': 119.42,
  '徐州': 117.18, '潍坊': 119.16, '临沂': 118.35, '嘉兴': 120.76,
  '金华': 119.65, '台州': 121.43, '泉州': 118.67, '漳州': 117.66,
  '赣州': 114.93, '九江': 116.00, '烟台': 121.39, '威海': 122.12,
  '宜昌': 111.29, '襄阳': 112.12, '衡阳': 112.57, '株洲': 113.13,
  '湘潭': 112.93, '常德': 111.69, '绵阳': 104.74, '南充': 106.11,
  '遵义': 106.93, '曲靖': 103.80, '玉溪': 102.55, '宝鸡': 107.24,
  '咸阳': 108.71, '天水': 105.72, '酒泉': 98.49, '克拉玛依': 84.87,
  '喀什': 75.99, '香港': 114.17, '澳门': 113.55, '台北': 121.55,
};

// ============================================================
// 月份名（寅月=正月）
// ============================================================

export const MONTH_NAMES: Record<number, string> = {
  2: '正月', 3: '二月', 4: '三月', 5: '四月',
  6: '五月', 7: '六月', 8: '七月', 9: '八月',
  10: '九月', 11: '十月', 0: '十一月', 1: '十二月',
};

// 月份序号（寅=1, 卯=2, ..., 丑=12）— 用于命宫计算
export function getMonthOrdinal(monthBranch: Branch): number {
  const idx = branchIndex(monthBranch);
  // 寅=2→1, 卯=3→2, ..., 丑=1→12
  return ((idx - 2 + 12) % 12) + 1;
}

// ============================================================
// 别名导出（兼容各模块不同命名）
// ============================================================

// 天干五行（别名：部分模块使用复数形式）
export const STEM_ELEMENTS = STEM_ELEMENT;
// 地支五行（别名）
export const BRANCH_ELEMENTS = BRANCH_ELEMENT;
// 地支藏干（别名）
export const BRANCH_HIDDEN_STEMS = HIDDEN_STEMS;

// ============================================================
// 太玄数 [项目大纲 11.7]
// ============================================================

// 天干太玄数：甲己=9, 乙庚=8, 丙辛=7, 丁壬=6, 戊癸=5
export const STEM_TAIXUAN: Record<Stem, number> = {
  甲: 9, 己: 9,
  乙: 8, 庚: 8,
  丙: 7, 辛: 7,
  丁: 6, 壬: 6,
  戊: 5, 癸: 5,
};

// 地支太玄数：子午=9, 丑未=8, 寅申=7, 卯酉=6, 辰戌=5, 巳亥=4
export const BRANCH_TAIXUAN: Record<Branch, number> = {
  子: 9, 午: 9,
  丑: 8, 未: 8,
  寅: 7, 申: 7,
  卯: 6, 酉: 6,
  辰: 5, 戌: 5,
  巳: 4, 亥: 4,
};

// ============================================================
// 纳音查表函数
// ============================================================

/**
 * 通过天干地支查询纳音名称
 */
export function getNayin(stem: Stem, branch: Branch): string {
  const idx = jiaZiIndex(stem, branch);
  if (idx >= 0) return SIXTY_JIAZI[idx].nayin;
  return '';
}

/**
 * 通过天干地支查询纳音五行
 */
export function getNayinElement(stem: Stem, branch: Branch): Element {
  const idx = jiaZiIndex(stem, branch);
  if (idx >= 0) return SIXTY_JIAZI[idx].nayinElement;
  return '土';
}
