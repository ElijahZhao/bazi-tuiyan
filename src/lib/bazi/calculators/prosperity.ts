/**
 * 旺衰格局判断模块
 *
 * 对应项目大纲规则：
 * - #26 五行旺相休囚死 + 人元司令分野（详细数据表 11.4、11.5）
 * - #27 日主旺衰：得令 + 得地 + 得势综合判断（详细数据表 11.6 藏干力量比例）
 * - #28 格局取用：月令为主（《子平真诠》"八字用神，专求月令"）+ 五法（扶抑/病药/调候/专旺/通关）
 * - #29 天干相克/相冲（《千里命稿》《五行大义》）
 *
 * 本模块负责：
 * 1. 五行分布统计（四柱 + 胎元 + 命宫 + 身宫）
 * 2. 五行旺相休囚死（按月支定季，查五季×五行表）
 * 3. 人元司令分野（按出生日在当月节气周期中的位置确定司令之气）
 * 4. 日主旺衰判断（得令 + 得地 + 得势综合评分）
 * 5. 格局取用（月支藏干透干者取格 + 用神五法 + 顺用逆用）
 * 6. 天干相克/相冲分析
 * 7. 整合以上所有分析的主函数
 *
 * @module bazi/calculators/prosperity
 */

import { TIANGAN, TIANGAN_WUXING, TIANGAN_YINYANG } from '../constants/tiangan';
import { DIZHI, DIZHI_WUXING } from '../constants/dizhi';
import { WUXING, WUXING_SHENG, WUXING_KE, WUXING_SEASON_STATES, SEASON_MONTHS } from '../constants/wuxing';
import { CANGGAN, CANGGAN_MAP, RENYUAN_SILING } from '../constants/canggan';
import { getChangsheng } from '../constants/changsheng';
import type { Pillar } from '../types';

// ============================================================
// 内部常量
// ============================================================

/** 一天的毫秒数（用于人元司令分野的日序计算） */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** 得令/得地/得势综合评分阈值 */
const STRONG_THRESHOLD = 3.5;
const WEAK_THRESHOLD = 0.5;

/**
 * 顺用格局（财官印食 → 顺用：生扶保护）
 * 正官格、正财格、偏财格、正印格、偏印格、食神格
 */
const SHUNYONG_PATTERNS = ['正官格', '正财格', '偏财格', '正印格', '偏印格', '食神格'];

/**
 * 逆用格局（煞伤劫刃 → 逆用：克制化解）
 * 七杀格、伤官格、月劫格、建禄格（建禄亦以逆用为主，因禄多则身强须抑）
 */
const NIYONG_PATTERNS = ['七杀格', '伤官格', '月劫格', '羊刃格'];

// ============================================================
// 辅助函数
// ============================================================

/**
 * 十神判定（内联实现，避免跨模块依赖）
 *
 * 以日主为中心，按五行生克和阴阳同异关系确定十神。
 * 与 ten-gods.ts 中的 getTenGod 逻辑一致。
 *
 * @param dayMaster 日主天干
 * @param target 目标天干
 * @returns 十神名称
 */
function getTenGodInline(dayMaster: string, target: string): string {
  // 输入校验：确保 dayMaster 和 target 是有效的天干
  if (!TIANGAN.includes(dayMaster as (typeof TIANGAN)[number]) ||
      !TIANGAN.includes(target as (typeof TIANGAN)[number])) {
    return '';
  }

  const dmElement = TIANGAN_WUXING[dayMaster];
  const targetElement = TIANGAN_WUXING[target];
  const dmYinYang = TIANGAN_YINYANG[dayMaster];
  const targetYinYang = TIANGAN_YINYANG[target];
  const sameYinYang = dmYinYang === targetYinYang;

  if (dmElement === targetElement) return sameYinYang ? '比肩' : '劫财';
  if (WUXING_SHENG[dmElement] === targetElement) return sameYinYang ? '食神' : '伤官';
  if (WUXING_KE[dmElement] === targetElement) return sameYinYang ? '偏财' : '正财';
  if (WUXING_KE[targetElement] === dmElement) return sameYinYang ? '七杀' : '正官';
  if (WUXING_SHENG[targetElement] === dmElement) return sameYinYang ? '偏印' : '正印';
  return '';
}

/**
 * 根据月支确定季节
 *
 * 对应数据表 11.4：
 * - 寅卯月 → 春
 * - 巳午月 → 夏
 * - 申酉月 → 秋
 * - 亥子月 → 冬
 * - 辰戌丑未月 → 四季
 *
 * @param monthBranch 月支
 * @returns 季节名称（春/夏/秋/冬/四季），未找到返回空字符串
 */
function getSeason(monthBranch: string): string {
  // 输入校验：确保 monthBranch 是有效的地支
  if (!DIZHI.includes(monthBranch as (typeof DIZHI)[number])) return '';
  for (const [season, branches] of Object.entries(SEASON_MONTHS)) {
    if ((branches as readonly string[]).includes(monthBranch)) return season;
  }
  return '';
}

/**
 * 获取某五行在指定季节的旺相休囚死状态
 *
 * WUXING_SEASON_STATES 的结构为 { 季节: { 状态: 五行 } }，
 * 此函数反查：给定季节和五行，返回该五行的状态。
 *
 * @param season 季节（春/夏/秋/冬/四季）
 * @param element 五行（金/木/水/火/土）
 * @returns 状态（旺/相/休/囚/死），未找到返回空字符串
 */
function getElementSeasonState(season: string, element: string): string {
  const seasonKey = season as keyof typeof WUXING_SEASON_STATES;
  const seasonData = WUXING_SEASON_STATES[seasonKey];
  if (!seasonData) return '';
  for (const [state, elem] of Object.entries(seasonData)) {
    if (elem === element) return state;
  }
  return '';
}

/**
 * 获取地支藏干及其力量比例
 *
 * 从 CANGGAN 表中查找指定地支的藏干力量比例。
 *
 * @param branch 地支
 * @returns 藏干与力量比例的列表（本气 > 中气 > 余气顺序）
 */
function getCangganRatios(branch: string): { stem: string; ratio: number; role: string }[] {
  const entry = CANGGAN.find((c) => c.branch === branch);
  if (!entry) return [];
  return entry.ratios.map((r) => ({ stem: r.stem, ratio: r.ratio, role: r.role }));
}

/**
 * 判断两天干是否构成天干相冲（冲破）
 *
 * 天干相冲（《五行大义》）：甲庚冲、乙辛冲、丙壬冲、丁癸冲。
 * 特征：同阴阳、五行相克、且不含土（戊己居中不以冲论）。
 *
 * @param s1 天干1
 * @param s2 天干2
 * @returns 是否相冲
 */
function isStemChongpo(s1: string, s2: string): boolean {
  const e1 = TIANGAN_WUXING[s1];
  const e2 = TIANGAN_WUXING[s2];
  const y1 = TIANGAN_YINYANG[s1];
  const y2 = TIANGAN_YINYANG[s2];

  // 必须同阴阳
  if (y1 !== y2) return false;
  // 必须五行相克（一方克另一方）
  if (WUXING_KE[e1] !== e2 && WUXING_KE[e2] !== e1) return false;
  // 戊己居中不以冲论
  if (e1 === '土' || e2 === '土') return false;
  return true;
}

// ============================================================
// 1. 五行分布统计
// ============================================================

/**
 * 五行分布统计
 *
 * 统计四柱 + 胎元 + 命宫 + 身宫中各五行的数量和百分比。
 *
 * 统计规则：
 * - **天干**：按 TIANGAN_WUXING 统计，每个天干计 1
 * - **地支本气**：按 DIZHI_WUXING 统计，每个地支本气计 1
 * - **藏干**：按各自五行统计，考虑力量比例（本气 0.6 / 中气 0.25 / 余气 0.15 等）
 *
 * 返回金木水火土各五行的加权数量和百分比。
 *
 * @param pillars 柱位列表（四柱 + 胎元 + 命宫 + 身宫，共 7 柱）
 * @returns 五行分布列表，按金木水火土顺序排列
 *
 * @example
 * // 四柱甲子、丙寅、戊辰、庚申 + 辅助宫位
 * calculateWuxingDistribution([yearPillar, monthPillar, dayPillar, timePillar, taiYuan, mingGong, shenGong])
 * // => [
 * //   { element: '金', count: 2.6, percentage: 12.38 },
 * //   { element: '木', count: 3.85, percentage: 18.33 },
 * //   ...
 * // ]
 */
export function calculateWuxingDistribution(
  pillars: Pillar[]
): { element: string; count: number; percentage: number }[] {
  // 初始化五行计数器
  const counts: Record<string, number> = {};
  for (const elem of WUXING) {
    counts[elem] = 0;
  }

  for (const pillar of pillars) {
    // 天干：按 TIANGAN_WUXING 统计，计 1
    const stemElement = TIANGAN_WUXING[pillar.stem];
    if (stemElement && counts[stemElement] !== undefined) {
      counts[stemElement] += 1;
    }

    // 地支本气：按 DIZHI_WUXING 统计，计 1
    const branchElement = DIZHI_WUXING[pillar.branch];
    if (branchElement && counts[branchElement] !== undefined) {
      counts[branchElement] += 1;
    }

    // 藏干：按各自五行统计，考虑力量比例
    const cangganRatios = getCangganRatios(pillar.branch);
    for (const cg of cangganRatios) {
      const cgElement = TIANGAN_WUXING[cg.stem];
      if (cgElement && counts[cgElement] !== undefined) {
        counts[cgElement] += cg.ratio;
      }
    }
  }

  // 计算总数
  const total = Object.values(counts).reduce((sum, c) => sum + c, 0);

  // 构建结果（按金木水火土顺序）
  return WUXING.map((element) => ({
    element,
    count: Math.round(counts[element] * 100) / 100,
    percentage: total > 0 ? Math.round((counts[element] / total) * 10000) / 100 : 0,
  }));
}

// ============================================================
// 2. 五行旺相休囚死
// ============================================================

/**
 * 五行旺相休囚死
 *
 * 对应规则 #26 和数据表 11.4。
 *
 * 根据月支确定季节，然后查 WUXING_SEASON_STATES 表：
 * - 寅卯月 → 春 → 木旺/火相/水休/金囚/土死
 * - 巳午月 → 夏 → 火旺/土相/木休/水囚/金死
 * - 申酉月 → 秋 → 金旺/水相/土休/火囚/木死
 * - 亥子月 → 冬 → 水旺/木相/金休/土囚/火死
 * - 辰戌丑未月 → 四季 → 土旺/金相/火休/木囚/水死
 *
 * 记忆规则：当令者旺，令生者相，生令者休，克令者囚，令克者死。
 *
 * @param monthBranch 月支
 * @returns 季节名称和各五行的当季状态
 *
 * @example
 * getWuxingSeasonState('寅') // => { season: '春', states: [{ element: '金', state: '囚' }, { element: '木', state: '旺' }, ...] }
 * getWuxingSeasonState('午') // => { season: '夏', states: [{ element: '金', state: '死' }, ...] }
 * getWuxingSeasonState('辰') // => { season: '四季', states: [{ element: '土', state: '旺' }, ...] }
 */
export function getWuxingSeasonState(monthBranch: string): {
  season: string;
  states: { element: string; state: string }[];
} {
  const season = getSeason(monthBranch);
  if (!season) {
    return { season: '', states: [] };
  }

  // WUXING_SEASON_STATES 结构为 { 状态: 五行 }，需反查为 { 五行: 状态 }
  // 按 WUXING 顺序（金木水火土）构建结果
  const states = WUXING.map((element) => ({
    element,
    state: getElementSeasonState(season, element),
  }));

  return { season, states };
}

// ============================================================
// 3. 人元司令分野
// ============================================================

/**
 * 人元司令分野
 *
 * 对应规则 #26 和数据表 11.5。
 *
 * 根据出生时间在当月节气周期中的位置，确定当日的司令之气。
 *
 * 实现步骤：
 * 1. 从 RENYUAN_SILING 中找到月支对应的数据（每月分若干段，每段一个藏干用事）
 * 2. 计算出生时间在当月节气周期中的天数（从交节时刻起算）
 * 3. 按古籍 30 日均分（实际节气月天数有差异 29-31 日，引擎实现时按比例分配）
 * 4. 返回出生日所在的用事区间对应的藏干
 *
 * 注意：古籍按每月 30 日均分，实际节气月天数有差异（29-31 日），
 * 引擎实现时应按实际节气月天数等比例分配。此处采用 30 日均分简化实现，
 * 因为无法从单一交节时刻推算下一个月的交节时刻。
 *
 * @param monthBranch 月支
 * @param birthTime 出生时间（真太阳时）
 * @param jieTime 当月节的交节时刻
 * @returns 司令之气藏干及备注
 *
 * @example
 * // 寅月，出生日在交节后第 10 天
 * // 寅月分段：戊土5日 → 丙火5日 → 甲木20日
 * // 第 10 天落在甲木用事区间（第 11~30 日）
 * getRenyuanSiling('寅', birthTime, jieTime) // => { stem: '甲', note: undefined }
 */
export function getRenyuanSiling(
  monthBranch: string,
  birthTime: Date,
  jieTime: Date
): { stem: string; note?: string } {
  const entry = RENYUAN_SILING.find((e) => e.month === monthBranch);
  if (!entry) return { stem: '' };

  // 计算出生日在当月的日序（从节气开始算）
  const dayInMonth = Math.floor(
    (birthTime.getTime() - jieTime.getTime()) / ONE_DAY_MS
  );

  // 按古籍 30 日均分分配各藏干用事日数
  // （实际节气月天数有差异，此处简化使用 30 日）
  let cumulativeDays = 0;
  for (const segment of entry.segments) {
    cumulativeDays += segment.days;
    if (dayInMonth < cumulativeDays) {
      return { stem: segment.stem, note: segment.note };
    }
  }

  // 兜底：返回最后一段（出生日超出 30 日范围时）
  const lastSegment = entry.segments[entry.segments.length - 1];
  return { stem: lastSegment.stem, note: lastSegment.note };
}

// ============================================================
// 4. 日主旺衰判断
// ============================================================

/**
 * 日主旺衰判断
 *
 * 对应规则 #27：综合判断"得令"+"得地"+"得势"。
 *
 * **得令**：日主五行在月令是否当旺
 * - 查 WUXING_SEASON_STATES，日主五行是否为"旺"或"相"
 * - 还要考虑人元司令分野：出生日的司令之气是否生日主或与日主同五行
 *
 * **得地**：日主在地支藏干中是否有根
 * - 检查四柱地支的藏干中是否有与日主同五行的天干
 * - 考虑藏干力量比例（本气 > 中气 > 余气）
 * - 通根透干：如果地支藏干有同五行天干，且该天干透出在四柱天干中，则力量更强
 *
 * **得势**：日主在天干中有无比劫帮助
 * - 检查四柱天干中是否有与日主同五行的天干（比肩/劫财）
 * - 数量越多，得势越强
 *
 * 综合评分：
 * - 得令：旺=+2，相=+1，休=0，囚=-1，死=-2；司令同五行 +0.5，司令生身 +0.3
 * - 得地：同五行藏干力量比例之和（透干 ×1.5）；十二长生长生/临官/帝旺位 +0.5，冠带 +0.25
 * - 得势：同五行天干数（不含日主），每个 +1
 *
 * - 得令+得地+得势 → 身强（总分 ≥ 3.5）
 * - 不得令+不得地+不得势 → 身弱（总分 ≤ 0.5）
 * - 部分得 → 平衡
 *
 * @param dayMaster 日主天干
 * @param pillars 四柱（年/月/日/时）
 * @param monthBranch 月支
 * @param renyuanSiling 人元司令分野藏干
 * @returns 旺衰判断和详细分析
 */
export function analyzeDayMasterStrength(
  dayMaster: string,
  pillars: Pillar[],
  monthBranch: string,
  renyuanSiling: string
): { strength: 'strong' | 'weak' | 'balanced'; details: string[] } {
  const details: string[] = [];
  const dmElement = TIANGAN_WUXING[dayMaster];

  // —— 得令判断 ——
  const season = getSeason(monthBranch);
  const dmSeasonState = getElementSeasonState(season, dmElement);

  let deLingScore = 0;
  const deLingScoreMap: Record<string, number> = {
    '旺': 2, '相': 1, '休': 0, '囚': -1, '死': -2,
  };
  deLingScore = deLingScoreMap[dmSeasonState] ?? 0;

  details.push(`【得令】日主${dayMaster}（${dmElement}）生于${monthBranch}月（${season}），五行状态为"${dmSeasonState}"（+${deLingScore}）`);

  // 人元司令分野加成
  if (renyuanSiling) {
    const silingElement = TIANGAN_WUXING[renyuanSiling];
    if (silingElement === dmElement) {
      deLingScore += 0.5;
      details.push(`  人元司令分野为${renyuanSiling}（${silingElement}），与日主同五行，得令加成（+0.5）`);
    } else if (WUXING_SHENG[silingElement] === dmElement) {
      deLingScore += 0.3;
      details.push(`  人元司令分野为${renyuanSiling}（${silingElement}），生日主${dmElement}，得令加成（+0.3）`);
    } else if (WUXING_KE[silingElement] === dmElement) {
      deLingScore -= 0.3;
      details.push(`  人元司令分野为${renyuanSiling}（${silingElement}），克日主${dmElement}，得令减分（-0.3）`);
    } else {
      details.push(`  人元司令分野为${renyuanSiling}（${silingElement}），与日主${dmElement}无明显生克`);
    }
  }

  const deLing = dmSeasonState === '旺' || dmSeasonState === '相';
  details.push(`  得令结论：${deLing ? '得令' : '不得令'}（得分 ${deLingScore}）`);

  // —— 得地判断 ——
  const fourStems = pillars.map((p) => p.stem);
  let deDiScore = 0;
  const rootDetails: string[] = [];

  for (const pillar of pillars) {
    const cangganRatios = getCangganRatios(pillar.branch);
    for (const cg of cangganRatios) {
      const cgElement = TIANGAN_WUXING[cg.stem];
      if (cgElement === dmElement) {
        // 同五行藏干 → 有根
        let rootStrength = cg.ratio;
        let transparent = false;

        // 通根透干：该藏干是否透出在四柱天干中
        if ((fourStems as string[]).includes(cg.stem)) {
          transparent = true;
          rootStrength *= 1.5;
        }

        deDiScore += rootStrength;
        rootDetails.push(
          `${pillar.branch}支${cg.role}${cg.stem}（比例${cg.ratio}）${transparent ? '透干×1.5' : ''}（+${Math.round(rootStrength * 100) / 100}）`
        );
      }
    }
  }

  // 十二长生根气加成
  for (const pillar of pillars) {
    const cs = getChangsheng(dayMaster, pillar.branch, false);
    if (cs) {
      if (cs === '长生' || cs === '临官' || cs === '帝旺') {
        deDiScore += 0.5;
        details.push(`  日主在${pillar.branch}支十二长生为"${cs}"，根气强（+0.5）`);
      } else if (cs === '冠带') {
        deDiScore += 0.25;
        details.push(`  日主在${pillar.branch}支十二长生为"${cs}"，有根气（+0.25）`);
      }
    }
  }

  // 得地评分上限
  deDiScore = Math.min(deDiScore, 3);

  if (rootDetails.length > 0) {
    details.push(`【得地】日主同五行藏干根基：`);
    for (const rd of rootDetails) {
      details.push(`  ${rd}`);
    }
  } else {
    details.push(`【得地】四柱地支藏干中无与日主同五行者，无根`);
  }

  const deDi = deDiScore >= 0.5;
  details.push(`  得地结论：${deDi ? '得地' : '不得地'}（得分 ${Math.round(deDiScore * 100) / 100}）`);

  // —— 得势判断 ——
  let deShiScore = 0;
  const supportStems: string[] = [];

  for (const pillar of pillars) {
    // 跳过日柱天干（日主本身）
    if (pillar.stem === dayMaster) continue;
    const stemElement = TIANGAN_WUXING[pillar.stem];
    if (stemElement === dmElement) {
      deShiScore += 1;
      const tenGod = getTenGodInline(dayMaster, pillar.stem);
      supportStems.push(`${pillar.stem}（${tenGod}）`);
    }
  }

  details.push(`【得势】四柱天干中与日主同五行者：${supportStems.length > 0 ? supportStems.join('、') : '无'}（+${deShiScore}）`);

  const deShi = deShiScore >= 1;
  details.push(`  得势结论：${deShi ? '得势' : '不得势'}（得分 ${deShiScore}）`);

  // —— 综合判断 ——
  const totalScore = deLingScore + deDiScore + deShiScore;
  let strength: 'strong' | 'weak' | 'balanced';

  if (totalScore >= STRONG_THRESHOLD) {
    strength = 'strong';
  } else if (totalScore <= WEAK_THRESHOLD) {
    strength = 'weak';
  } else {
    strength = 'balanced';
  }

  details.push(`【综合】得令(${Math.round(deLingScore * 100) / 100}) + 得地(${Math.round(deDiScore * 100) / 100}) + 得势(${deShiScore}) = 总分 ${Math.round(totalScore * 100) / 100}`);
  details.push(`  判定：${strength === 'strong' ? '身强' : strength === 'weak' ? '身弱' : '中和'}`);

  return { strength, details };
}

// ============================================================
// 5. 格局取用
// ============================================================

/**
 * 格局取用
 *
 * 对应规则 #28。
 *
 * **格局判断**（月令为本）：
 * - 《子平真诠》："八字用神，专求月令"
 * - 月支藏干透出天干者为格局
 * - 如果月支本气透干 → 本气格局（如寅月甲木透 → 建禄格）
 * - 如果月支中气透干 → 中气格局
 * - 如果月支余气透干 → 余气格局
 * - 如果月支藏干都不透 → 暗藏格局或另取
 *
 * **用神取法**（五法）：
 * - 扶抑：身强则抑（克泄耗），身弱则扶（生扶）
 * - 病药：以伤用神者为病，以去病者为药
 * - 调候：金水生于冬令、木火生于夏令，以调和气候为急
 * - 专旺：四柱气势偏于一方，顺其气势为用
 * - 通关：两神对峙，须调和之为美
 *
 * **顺用逆用**：
 * - 财官印食 → 顺用（生扶保护）
 * - 煞伤劫刃 → 逆用（克制化解）
 *
 * @param dayMaster 日主天干
 * @param monthPillar 月柱
 * @param hiddenStems 四柱天干列表（用于透干检测：年/月/日/时天干）
 * @param dayMasterStrength 日主旺衰（'strong' | 'weak' | 'balanced'）
 * @returns 格局名称、用神和详细分析
 */
export function analyzePattern(
  dayMaster: string,
  monthPillar: Pillar,
  hiddenStems: string[],
  dayMasterStrength: string
): { pattern: string; yongShen: string; details: string[] } {
  const details: string[] = [];
  const dmElement = TIANGAN_WUXING[dayMaster];

  // —— 格局判断 ——
  // 月支藏干（本气/中气/余气顺序）
  const monthHiddenStems = monthPillar.hiddenStems.length > 0
    ? monthPillar.hiddenStems
    : (CANGGAN_MAP[monthPillar.branch] ?? []);

  details.push(`【格局判断】月令${monthPillar.branch}，藏干：${monthHiddenStems.join('、')}`);

  // 检查透干：月支藏干中哪些透出在四柱天干中
  let transparentStem = '';
  let transparentRole = '';

  for (let i = 0; i < monthHiddenStems.length; i++) {
    const hs = monthHiddenStems[i];
    if (hiddenStems.includes(hs)) {
      transparentStem = hs;
      // 根据位置确定本气/中气/余气
      const ratios = getCangganRatios(monthPillar.branch);
      transparentRole = ratios[i]?.role ?? (i === 0 ? '本气' : i === 1 ? '中气' : '余气');
      break; // 优先取本气（第一个透干的）
    }
  }

  // 确定格局名称
  let pattern = '';
  let patternStem = '';

  if (transparentStem) {
    // 月支藏干透干 → 取格
    patternStem = transparentStem;
    const tenGod = getTenGodInline(dayMaster, transparentStem);
    details.push(`  月支${transparentRole}${transparentStem}透干，十神为${tenGod}`);

    pattern = tenGodToPattern(tenGod, dayMaster, monthPillar.branch, transparentStem);
  } else {
    // 月支藏干都不透 → 以本气暗取
    patternStem = monthHiddenStems[0] ?? '';
    const tenGod = getTenGodInline(dayMaster, patternStem);
    details.push(`  月支藏干均不透干，以本气${patternStem}暗取（十神${tenGod}）`);

    pattern = tenGodToPattern(tenGod, dayMaster, monthPillar.branch, patternStem) + '（暗藏）';
  }

  details.push(`  格局：${pattern}`);

  // —— 顺用逆用 ——
  const isShunyong = SHUNYONG_PATTERNS.some((p) => pattern.includes(p));
  const isNiyong = NIYONG_PATTERNS.some((p) => pattern.includes(p));

  if (isShunyong) {
    details.push(`  顺用：${pattern}为财官印食类，宜生扶保护`);
  } else if (isNiyong) {
    details.push(`  逆用：${pattern}为煞伤劫刃类，宜克制化解`);
  }

  // —— 用神取法 ——
  const yongShenResult = determineYongShen(
    dayMaster,
    dmElement,
    dayMasterStrength,
    monthPillar.branch,
    hiddenStems,
    details
  );

  return { pattern, yongShen: yongShenResult, details };
}

/**
 * 十神转格局名称
 *
 * 根据透干藏干的十神确定格局名称：
 * - 比肩 → 建禄格（月支为日主禄位）/ 月劫格
 * - 劫财 → 月劫格 / 羊刃格（月支为日主刃位）
 * - 食神 → 食神格
 * - 伤官 → 伤官格
 * - 偏财 → 偏财格
 * - 正财 → 正财格
 * - 七杀 → 七杀格（偏官格）
 * - 正官 → 正官格
 * - 偏印 → 偏印格
 * - 正印 → 正印格
 */
function tenGodToPattern(
  tenGod: string,
  dayMaster: string,
  monthBranch: string,
  transparentStem: string
): string {
  switch (tenGod) {
    case '比肩':
      return '建禄格';
    case '劫财':
      return '月劫格';
    case '食神':
      return '食神格';
    case '伤官':
      return '伤官格';
    case '偏财':
      return '偏财格';
    case '正财':
      return '正财格';
    case '七杀':
      return '七杀格';
    case '正官':
      return '正官格';
    case '偏印':
      return '偏印格';
    case '正印':
      return '正印格';
    default:
      return `${transparentStem}格`;
  }
}

/**
 * 用神取法（五法）
 *
 * 优先级：
 * 1. 调候：极端气候（金水生于冬令、木火生于夏令）以调和气候为急
 * 2. 专旺：四柱气势偏于一方，顺其气势为用
 * 3. 通关：两神对峙，须调和之为美
 * 4. 扶抑：身强则抑（克泄耗），身弱则扶（生扶）
 * 5. 病药：以伤用神者为病，以去病者为药
 *
 * 此处实现以扶抑法为主，辅以调候法判断。
 */
function determineYongShen(
  dayMaster: string,
  dmElement: string,
  strength: string,
  monthBranch: string,
  fourStems: string[],
  details: string[]
): string {
  const season = getSeason(monthBranch);

  // 找到克日主的五行（官杀）
  let keMeElement = '';
  for (const [ke, bei] of Object.entries(WUXING_KE)) {
    if (bei === dmElement) {
      keMeElement = ke;
      break;
    }
  }

  // 找到生日主的五行（印）
  let shengMeElement = '';
  for (const [sheng, bei] of Object.entries(WUXING_SHENG)) {
    if (bei === dmElement) {
      shengMeElement = sheng;
      break;
    }
  }

  // 日主所生五行（食伤，泄）
  const shengByMe = WUXING_SHENG[dmElement];
  // 日主所克五行（财，耗）
  const keByMe = WUXING_KE[dmElement];

  // —— 调候法判断 ——
  // 金水生于冬令（亥子月）、木火生于夏令（巳午月），以调和气候为急
  const isColdSeason = season === '冬';
  const isHotSeason = season === '夏';
  const dmIsColdNature = dmElement === '金' || dmElement === '水';
  const dmIsHotNature = dmElement === '木' || dmElement === '火';

  if (isColdSeason && dmIsColdNature) {
    // 冬令金水，以火调候为急
    details.push(`【用神·调候】日主${dmElement}生于冬令（${monthBranch}月），气候寒冷，以火调候为急`);
    return `调候法：以火为用（暖局调候）`;
  }
  if (isHotSeason && dmIsHotNature) {
    // 夏令木火，以水调候为急
    details.push(`【用神·调候】日主${dmElement}生于夏令（${monthBranch}月），气候炎热，以水调候为急`);
    return `调候法：以水为用（润局调候）`;
  }

  // —— 扶抑法 ——
  if (strength === 'strong') {
    // 身强则抑：克（官杀）、泄（食伤）、耗（财）
    details.push(`【用神·扶抑】日主身强，宜抑之（克泄耗）`);
    details.push(`  克（官杀·${keMeElement}）、泄（食伤·${shengByMe}）、耗（财·${keByMe}）均可为用`);

    // 优先级：有官杀则首选官杀，次选食伤，末选财
    const hasKeMe = fourStems.some((s) => TIANGAN_WUXING[s] === keMeElement);
    const hasShengByMe = fourStems.some((s) => TIANGAN_WUXING[s] === shengByMe);
    const hasKeByMe = fourStems.some((s) => TIANGAN_WUXING[s] === keByMe);

    if (hasKeMe) {
      return `扶抑法：身强宜抑，以${keMeElement}（官杀）为用神，${shengByMe}（食伤）/ ${keByMe}（财）为喜神`;
    } else if (hasShengByMe) {
      return `扶抑法：身强宜抑，以${shengByMe}（食伤）为用神，${keByMe}（财）为喜神`;
    } else if (hasKeByMe) {
      return `扶抑法：身强宜抑，以${keByMe}（财）为用神`;
    }
    return `扶抑法：身强宜抑（克泄耗），四柱中官杀/食伤/财均可酌用`;
  }

  if (strength === 'weak') {
    // 身弱则扶：生（印）、扶（比劫）
    details.push(`【用神·扶抑】日主身弱，宜扶之（生扶）`);
    details.push(`  生（印·${shengMeElement}）、扶（比劫·${dmElement}）均可为用`);

    const hasShengMe = fourStems.some((s) => TIANGAN_WUXING[s] === shengMeElement);
    const hasBiJie = fourStems.some((s) => TIANGAN_WUXING[s] === dmElement && s !== dayMaster);

    if (hasShengMe) {
      return `扶抑法：身弱宜扶，以${shengMeElement}（印）为用神，${dmElement}（比劫）为喜神`;
    } else if (hasBiJie) {
      return `扶抑法：身弱宜扶，以${dmElement}（比劫）为用神`;
    }
    return `扶抑法：身弱宜扶（生扶），四柱中印/比劫均可酌用`;
  }

  // balanced
  details.push(`【用神·扶抑】日主中和，扶抑兼宜，视大运流年而定`);
  return `扶抑法：中和局，以通关调和为上，扶抑随大运而定`;
}

// ============================================================
// 6. 天干相克/相冲分析
// ============================================================

/**
 * 天干相克/相冲分析
 *
 * 对应规则 #29：
 * - **天干相克**：庚辛克甲乙等（五行相克在天干层面）
 * - **天干相冲（冲破）**：甲庚、乙辛、丙壬、丁癸（《五行大义》）
 *
 * 相冲是相克的特殊形式：同阴阳的相克对（不含土），力量更强。
 * 相冲 ⊂ 相克。此函数对每对天干只报告最高级别的关系：
 * 若为相冲则报告相冲，否则若为相克则报告相克。
 *
 * @param pillars 四柱（年/月/日/时）
 * @returns 天干冲突列表
 *
 * @example
 * // 甲年 庚月 → 甲庚相冲
 * analyzeStemConflicts([{ stem: '甲', ... }, { stem: '庚', ... }, ...])
 * // => [{ type: '相冲', stems: ['甲', '庚'], description: '甲庚相冲（阳木与阳金冲破）' }]
 */
export function analyzeStemConflicts(
  pillars: Pillar[]
): { type: string; stems: string[]; description: string }[] {
  const results: { type: string; stems: string[]; description: string }[] = [];
  const n = pillars.length;

  // 柱位名称
  const locationNames = ['年', '月', '日', '时'];

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const s1 = pillars[i].stem;
      const s2 = pillars[j].stem;
      const loc1 = locationNames[i] ?? `柱${i + 1}`;
      const loc2 = locationNames[j] ?? `柱${j + 1}`;

      const e1 = TIANGAN_WUXING[s1];
      const e2 = TIANGAN_WUXING[s2];
      const y1 = TIANGAN_YINYANG[s1];
      const y2 = TIANGAN_YINYANG[s2];

      // 优先检查相冲（冲破）
      if (isStemChongpo(s1, s2)) {
        results.push({
          type: '相冲',
          stems: [s1, s2],
          description: `${s1}${s2}相冲（${y1}${e1}与${y2}${e2}冲破，${loc1}${loc2}柱）`,
        });
        continue; // 相冲已报告，不再报告相克
      }

      // 检查相克（s1 克 s2 或 s2 克 s1）
      if (WUXING_KE[e1] === e2) {
        results.push({
          type: '相克',
          stems: [s1, s2],
          description: `${s1}(${e1})克${s2}(${e2})（${loc1}${loc2}柱）`,
        });
      } else if (WUXING_KE[e2] === e1) {
        results.push({
          type: '相克',
          stems: [s2, s1],
          description: `${s2}(${e2})克${s1}(${e1})（${loc2}${loc1}柱）`,
        });
      }
    }
  }

  return results;
}

// ============================================================
// 7. 主函数：旺衰格局整合分析
// ============================================================

/**
 * 旺衰格局分析结果
 *
 * 整合五行分布、旺相休囚死、人元司令分野、日主旺衰、格局用神等全部结果。
 * 对应 BaziChart 中的 wuxingDistribution、wuxingSeasonState、
 * dayMasterStrength、pattern、yongShen 等字段。
 */
export interface ProsperityAnalysisResult {
  /** 五行分布（金木水火土各五行的数量和百分比） */
  wuxingDistribution: { element: string; count: number; percentage: number }[];
  /** 五行旺相休囚死（按月支定季） */
  wuxingSeasonState: { season: string; states: { element: string; state: string }[] };
  /** 人元司令分野（司令之气藏干） */
  renyuanSiling: { stem: string; note?: string };
  /** 日主旺衰（strong / weak / balanced） */
  dayMasterStrength: 'strong' | 'weak' | 'balanced';
  /** 格局名称（如建禄格/正官格等） */
  pattern: string;
  /** 用神（扶抑/病药/调候/专旺/通关五法） */
  yongShen: string;
  /** 天干相克/相冲分析结果 */
  stemConflicts: { type: string; stems: string[]; description: string }[];
  /** 分析备注（详细分析步骤、方法来源、特殊说明等） */
  notes: string[];
}

/**
 * 旺衰格局分析主函数
 *
 * 整合五行分布统计、五行旺相休囚死、人元司令分野、日主旺衰判断、
 * 格局取用、天干相克/相冲分析，输出完整的旺衰格局分析结果。
 *
 * 对应 BaziChart 中的旺衰格局相关字段（dayMasterStrength、pattern、yongShen 等）。
 *
 * @param fourPillars 四柱信息
 * @param auxiliary 辅助宫位
 * @param birthTime 出生时间（真太阳时）
 * @param jieTime 当月节的交节时刻
 * @returns 完整的旺衰格局分析结果
 *
 * @example
 * analyzeProsperity(
 *   { yearPillar, monthPillar, dayPillar, timePillar, dayMaster: '戊', trueSolarTime },
 *   { taiYuan, mingGong, shenGong },
 *   trueSolarTime,
 *   jieTime
 * )
 * // => {
 * //   wuxingDistribution: [...],
 * //   wuxingSeasonState: { season: '春', states: [...] },
 * //   renyuanSiling: { stem: '甲' },
 * //   dayMasterStrength: 'strong',
 * //   pattern: '建禄格',
 * //   yongShen: '扶抑法：身强宜抑...',
 * //   stemConflicts: [...],
 * //   notes: [...]
 * // }
 */
export function analyzeProsperity(
  fourPillars: {
    yearPillar: Pillar;
    monthPillar: Pillar;
    dayPillar: Pillar;
    timePillar: Pillar;
    dayMaster: string;
    trueSolarTime: Date;
  },
  auxiliary: {
    taiYuan: Pillar;
    mingGong: Pillar;
    shenGong: Pillar;
  },
  birthTime: Date,
  jieTime: Date
): ProsperityAnalysisResult {
  const { yearPillar, monthPillar, dayPillar, timePillar, dayMaster } = fourPillars;
  const { taiYuan, mingGong, shenGong } = auxiliary;
  const notes: string[] = [];

  // —— 1. 五行分布统计 ——
  const allPillars: Pillar[] = [
    yearPillar, monthPillar, dayPillar, timePillar,
    taiYuan, mingGong, shenGong,
  ];
  const wuxingDistribution = calculateWuxingDistribution(allPillars);
  notes.push(`五行分布：${wuxingDistribution.map((d) => `${d.element}${d.count}(${d.percentage}%)`).join('、')}`);

  // —— 2. 五行旺相休囚死 ——
  const monthBranch = monthPillar.branch;
  const wuxingSeasonState = getWuxingSeasonState(monthBranch);
  notes.push(`五行旺相休囚死：${wuxingSeasonState.season}月（${wuxingSeasonState.states.map((s) => `${s.element}${s.state}`).join('/')}）`);

  // —— 3. 人元司令分野 ——
  const renyuanSiling = getRenyuanSiling(monthBranch, birthTime, jieTime);
  notes.push(`人元司令分野：${renyuanSiling.stem}${renyuanSiling.note ? `（${renyuanSiling.note}）` : ''}`);

  // —— 4. 日主旺衰判断 ——
  const fourPillarArray: Pillar[] = [yearPillar, monthPillar, dayPillar, timePillar];
  const strengthResult = analyzeDayMasterStrength(
    dayMaster,
    fourPillarArray,
    monthBranch,
    renyuanSiling.stem
  );
  notes.push(...strengthResult.details);

  // —— 5. 格局取用 ——
  const fourStems = fourPillarArray.map((p) => p.stem);
  const patternResult = analyzePattern(
    dayMaster,
    monthPillar,
    fourStems,
    strengthResult.strength
  );
  notes.push(...patternResult.details);

  // —— 6. 天干相克/相冲分析 ——
  const stemConflicts = analyzeStemConflicts(fourPillarArray);
  if (stemConflicts.length > 0) {
    notes.push(`【天干冲突】${stemConflicts.map((c) => c.description).join('；')}`);
  } else {
    notes.push(`【天干冲突】四柱天干无相克相冲`);
  }

  return {
    wuxingDistribution,
    wuxingSeasonState,
    renyuanSiling,
    dayMasterStrength: strengthResult.strength,
    pattern: patternResult.pattern,
    yongShen: patternResult.yongShen,
    stemConflicts,
    notes,
  };
}
