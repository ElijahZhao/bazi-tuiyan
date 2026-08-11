/**
 * 神煞计算模块
 *
 * 对应项目大纲：
 * - 规则 #20：神煞 25+ 种（天乙/文昌/华盖/驿马/桃花/禄/空亡/将星/灾煞/劫煞/
 *   孤辰寡宿/魁罡/天罗地网/金舆/天德/月德/羊刃等），各按日干/年干/年支日支/
 *   月支/日柱旬空起法
 * - 规则 #21：羊刃三体系切换（五阳干有刃/禄前一位/帝旺位，三说并存）；
 *   空亡以日柱查旬空为主，年柱为辅
 * - 数据表 11.3：神煞查法依据表
 * - 数据表 11.8：六甲空亡完整表
 * - 数据表 11.17：羊刃位置表
 *
 * 每种神煞在结果中标注查法依据（日干/年干/年支/日支/月支/日柱旬空）。
 *
 * 神煞查法分类：
 *
 * | 查法依据 | 神煞 |
 * |---------|------|
 * | 日干 | 天乙贵人(主)、文昌、禄神、金舆、羊刃 |
 * | 年干 | 天乙贵人(辅) |
 * | 年支 | 华盖、驿马、桃花、将星、灾煞、劫煞、孤辰寡宿、天罗地网 |
 * | 日支 | 华盖(辅)、驿马(辅)、桃花(辅)、将星(辅) |
 * | 月支 | 天德贵人、月德贵人 |
 * | 日柱 | 魁罡 |
 * | 日柱旬空 | 空亡(主) |
 * | 年柱旬空 | 空亡(辅) |
 *
 * 特殊处理：
 * - 天德贵人：干支混查（4 个月查地支、8 个月查天干）
 * - 羊刃：三体系切换（默认禄前一位说），阴干三说不一致需标注
 * - 空亡：日柱查旬空为主，年柱为辅
 * - 天罗地网：按性别区分（男查天罗/女查地网）
 *
 * @module bazi/calculators/shen-sha
 */

import {
  TIANYI_GUIREN, WENCHANG, HUAGAI, YIMA, TAOHUA, LUSHEN,
  JIANGXING, ZAISHA, JIESHA, GUCHEN_GUASU, KUIGANG,
  TIANLUO_DIWANG, JINYU, TIANDE, YUEDE, YANGREN_TABLE, getYangren
} from '../constants/shensha';
import { LIUJIA_KONGWANG, getKongwang } from '../constants/nayin';
import { TIANGAN_INDEX, TIANGAN_YINYANG } from '../constants/tiangan';
import { DIZHI_INDEX } from '../constants/dizhi';
import type { Pillar, ShenShaResult, BaziInput } from '../types';

// ============================================================
// 辅助函数
// ============================================================

/**
 * 检查某个地支是否在四柱+辅助宫位中
 *
 * 遍历所有柱位（年/月/日/时/胎/命/身），返回地支与目标地支匹配的柱位列表。
 *
 * @param targetBranch 目标地支
 * @param pillars 柱位列表，每项包含名称和柱信息
 * @returns 匹配的柱位列表
 *
 * @example
 * findBranchInPillars('丑', [
 *   { name: '年', pillar: { stem: '甲', branch: '丑', hiddenStems: [] } },
 *   { name: '月', pillar: { stem: '丙', branch: '寅', hiddenStems: [] } },
 * ])
 * // => [{ name: '年', pillar: { stem: '甲', branch: '丑', hiddenStems: [] } }]
 */
function findBranchInPillars(
  targetBranch: string,
  pillars: { name: string; pillar: Pillar }[]
): { name: string; pillar: Pillar }[] {
  return pillars.filter(p => p.pillar.branch === targetBranch);
}

/**
 * 检查某个天干是否在四柱+辅助宫位中
 *
 * 遍历所有柱位（年/月/日/时/胎/命/身），返回天干与目标天干匹配的柱位列表。
 *
 * @param targetStem 目标天干
 * @param pillars 柱位列表，每项包含名称和柱信息
 * @returns 匹配的柱位列表
 *
 * @example
 * findStemInPillars('丁', [
 *   { name: '月', pillar: { stem: '丁', branch: '卯', hiddenStems: [] } },
 *   { name: '日', pillar: { stem: '甲', branch: '子', hiddenStems: [] } },
 * ])
 * // => [{ name: '月', pillar: { stem: '丁', branch: '卯', hiddenStems: [] } }]
 */
function findStemInPillars(
  targetStem: string,
  pillars: { name: string; pillar: Pillar }[]
): { name: string; pillar: Pillar }[] {
  return pillars.filter(p => p.pillar.stem === targetStem);
}

/**
 * 检查查年支（主）+ 日支（辅）的神煞
 *
 * 对华盖、驿马、桃花、将星四种神煞，以年支查表为主、日支查表为辅。
 * 当年支和日支查得同一目标地支时，合并为"年支+日支同查"。
 *
 * @param name 神煞名称
 * @param lookupTable 查表数据（地支→目标地支）
 * @param yearBranch 年支
 * @param dayBranch 日支
 * @param allPillars 全部柱位列表
 * @param results 结果数组（就地追加）
 */
function checkYearDayBranchShensha(
  name: string,
  lookupTable: Record<string, string>,
  yearBranch: string,
  dayBranch: string,
  allPillars: { name: string; pillar: Pillar }[],
  results: ShenShaResult[]
): void {
  const yearTarget = lookupTable[yearBranch];
  const dayTarget = lookupTable[dayBranch];

  // 构建目标地支→查法来源的映射，合并同年支日支查得的同一目标
  const targetSources = new Map<string, string[]>();
  if (yearTarget) {
    targetSources.set(yearTarget, ['年支']);
  }
  if (dayTarget) {
    if (targetSources.has(dayTarget)) {
      targetSources.get(dayTarget)!.push('日支');
    } else {
      targetSources.set(dayTarget, ['日支']);
    }
  }

  for (const [target, sources] of targetSources) {
    const found = findBranchInPillars(target, allPillars);
    const sourceStr = sources.length > 1
      ? sources.join('+') + '同查'
      : sources[0];
    for (const f of found) {
      results.push({
        name,
        location: f.name,
        branch: f.pillar.branch,
        source: sourceStr,
        description: `${sources.join('、')}查${name}在${target}`,
      });
    }
  }
}

// ============================================================
// 神煞计算主函数
// ============================================================

/**
 * 神煞计算主函数
 *
 * 遍历四柱 + 辅助宫位（胎元/命宫/身宫），对每个柱位检查所有神煞。
 *
 * 神煞查法依据分六大类：
 * 1. **查日干**：天乙贵人(主)、文昌、禄神、金舆、羊刃
 * 2. **查年干**：天乙贵人(辅) —— 与日干查得重叠时标注"日干+年干同查"
 * 3. **查年支**（日支为辅）：华盖、驿马、桃花、将星、灾煞、劫煞、孤辰寡宿、天罗地网
 * 4. **查月支**：天德贵人（干支混查）、月德贵人
 * 5. **查日柱**：魁罡
 * 6. **查空亡**：日柱旬空(主) + 年柱旬空(辅)
 *
 * @param fourPillars 四柱 { yearPillar, monthPillar, dayPillar, timePillar, dayMaster }
 * @param auxiliary 辅助宫位 { taiYuan, mingGong, shenGong }
 * @param input 排盘输入（需要 yangrenSystem 和 gender）
 * @returns 所有命盘中存在的神煞列表
 *
 * @example
 * calculateShenSha(
 *   { yearPillar, monthPillar, dayPillar, timePillar, dayMaster: '甲' },
 *   { taiYuan, mingGong, shenGong },
 *   { birthDate: '1990-01-01', birthTime: '12:00', gender: 'male', longitude: 116.4 }
 * )
 * // => [
 * //   { name: '天乙贵人', location: '年', branch: '丑', source: '日干', ... },
 * //   { name: '禄神', location: '月', branch: '寅', source: '日干', ... },
 * //   ...
 * // ]
 */
export function calculateShenSha(
  fourPillars: {
    yearPillar: Pillar;
    monthPillar: Pillar;
    dayPillar: Pillar;
    timePillar: Pillar;
    dayMaster: string;
  },
  auxiliary: {
    taiYuan: Pillar;
    mingGong: Pillar;
    shenGong: Pillar;
  },
  input: BaziInput
): ShenShaResult[] {
  const results: ShenShaResult[] = [];

  const { yearPillar, monthPillar, dayPillar, timePillar, dayMaster } = fourPillars;
  const { taiYuan, mingGong, shenGong } = auxiliary;
  const { gender } = input;

  // 羊刃体系（默认禄前一位说，对应规则 #21）
  const yangrenSystem = input.yangrenSystem ?? 'luqian';

  // 输入校验：确保关键干支有效
  if (TIANGAN_INDEX[dayMaster] === undefined) return results;
  if (DIZHI_INDEX[yearPillar.branch] === undefined) return results;
  if (DIZHI_INDEX[monthPillar.branch] === undefined) return results;

  // 提取关键干支
  const yearStem = yearPillar.stem;
  const yearBranch = yearPillar.branch;
  const monthBranch = monthPillar.branch;
  const dayStem = dayPillar.stem;
  const dayBranch = dayPillar.branch;

  // 构建所有柱位列表（四柱 + 胎元/命宫/身宫）
  // location 取值：年 / 月 / 日 / 时 / 胎 / 命 / 身
  const allPillars: { name: string; pillar: Pillar }[] = [
    { name: '年', pillar: yearPillar },
    { name: '月', pillar: monthPillar },
    { name: '日', pillar: dayPillar },
    { name: '时', pillar: timePillar },
    { name: '胎', pillar: taiYuan },
    { name: '命', pillar: mingGong },
    { name: '身', pillar: shenGong },
  ];

  // ==========================================================
  // 一、查日干的神煞
  // ==========================================================

  // ----------------------------------------------------------
  // 1. 天乙贵人（日干为主 + 年干为辅）
  // 口诀："甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸蛇兔藏，六辛逢马虎"
  // ----------------------------------------------------------
  {
    const dayGuiRen = TIANYI_GUIREN[dayMaster] ?? [];
    const yearGuiRen = TIANYI_GUIREN[yearStem] ?? [];

    // 日干查天乙贵人
    for (const target of dayGuiRen) {
      const found = findBranchInPillars(target, allPillars);
      const overlap = yearGuiRen.includes(target);
      for (const f of found) {
        results.push({
          name: '天乙贵人',
          location: f.name,
          branch: f.pillar.branch,
          source: overlap ? '日干+年干同查' : '日干',
          description: `${dayMaster}日干天乙贵人在${target}` +
            (overlap ? `（年干${yearStem}亦查得此支，日干+年干同查）` : ''),
        });
      }
    }

    // 年干查天乙贵人（排除日干已查得的，避免重复）
    for (const target of yearGuiRen) {
      if (dayGuiRen.includes(target)) continue;
      const found = findBranchInPillars(target, allPillars);
      for (const f of found) {
        results.push({
          name: '天乙贵人',
          location: f.name,
          branch: f.pillar.branch,
          source: '年干',
          description: `${yearStem}年干天乙贵人在${target}（辅查）`,
        });
      }
    }
  }

  // ----------------------------------------------------------
  // 2. 文昌贵人（查日干）
  // 口诀："甲乙巳午报君知，丙戊申宫丁己鸡，庚猪辛鼠壬逢虎，癸人见兔入云梯"
  // ----------------------------------------------------------
  {
    const target = WENCHANG[dayMaster];
    if (target) {
      const found = findBranchInPillars(target, allPillars);
      for (const f of found) {
        results.push({
          name: '文昌贵人',
          location: f.name,
          branch: f.pillar.branch,
          source: '日干',
          description: `${dayMaster}日干文昌贵人在${target}`,
        });
      }
    }
  }

  // ----------------------------------------------------------
  // 3. 禄神（查日干）
  // 甲禄在寅、乙禄在卯、丙禄在巳、丁禄在午、戊禄在巳、
  // 己禄在午、庚禄在申、辛禄在酉、壬禄在亥、癸禄在子
  // ----------------------------------------------------------
  {
    const target = LUSHEN[dayMaster];
    if (target) {
      const found = findBranchInPillars(target, allPillars);
      for (const f of found) {
        results.push({
          name: '禄神',
          location: f.name,
          branch: f.pillar.branch,
          source: '日干',
          description: `${dayMaster}禄在${target}`,
        });
      }
    }
  }

  // ----------------------------------------------------------
  // 4. 金舆（查日干）
  // 口诀："甲龙乙蛇丙戊羊，丁己猴乡庚兔藏，辛虎壬马癸牛当"
  // ----------------------------------------------------------
  {
    const target = JINYU[dayMaster];
    if (target) {
      const found = findBranchInPillars(target, allPillars);
      for (const f of found) {
        results.push({
          name: '金舆',
          location: f.name,
          branch: f.pillar.branch,
          source: '日干',
          description: `${dayMaster}日干金舆在${target}`,
        });
      }
    }
  }

  // ----------------------------------------------------------
  // 5. 羊刃（查日干，三体系切换，对应规则 #21、数据表 11.17）
  // 三体系：五阳干说(yangGan) / 禄前一位说(luqian，默认) / 帝旺位说(diwang)
  // 阳干三说一致，阴干三说不一致 —— 需标注所用体系
  // ----------------------------------------------------------
  {
    const systemNames: Record<string, string> = {
      luqian: '禄前一位说',
      diwang: '帝旺位说',
      yangGan: '五阳干说',
    };
    const systemName = systemNames[yangrenSystem];
    const target = getYangren(dayMaster, yangrenSystem);

    if (target) {
      const found = findBranchInPillars(target, allPillars);
      // 阴干三说不一致时需标注所用体系
      const isYinStem = TIANGAN_YINYANG[dayMaster] === '阴';
      const entry = YANGREN_TABLE.find(e => e.stem === dayMaster);
      const inconsistentNote =
        isYinStem && entry && !entry.consistent
          ? `（阴干三说不一致，现用${systemName}）`
          : '';

      for (const f of found) {
        results.push({
          name: '羊刃',
          location: f.name,
          branch: f.pillar.branch,
          source: `日干（${systemName}）`,
          description: `${dayMaster}羊刃在${target}${inconsistentNote}`,
        });
      }
    }
    // 五阳干说下阴干无刃，不产生结果
  }

  // ==========================================================
  // 二、查年支的神煞（日支为辅）
  // ==========================================================

  // ----------------------------------------------------------
  // 6. 华盖（年支主 + 日支辅）
  // 口诀："寅午戌见戌，亥卯未见未，申子辰见辰，巳酉丑见丑"
  // ----------------------------------------------------------
  checkYearDayBranchShensha(
    '华盖', HUAGAI, yearBranch, dayBranch, allPillars, results
  );

  // ----------------------------------------------------------
  // 7. 驿马（年支主 + 日支辅）
  // 口诀："寅午戌马在申，申子辰马在寅，巳酉丑马在亥，亥卯未马在巳"
  // ----------------------------------------------------------
  checkYearDayBranchShensha(
    '驿马', YIMA, yearBranch, dayBranch, allPillars, results
  );

  // ----------------------------------------------------------
  // 8. 桃花（年支主 + 日支辅）
  // 口诀："申子辰在酉，寅午戌在卯，巳酉丑在午，亥卯未在子"
  // ----------------------------------------------------------
  checkYearDayBranchShensha(
    '桃花', TAOHUA, yearBranch, dayBranch, allPillars, results
  );

  // ----------------------------------------------------------
  // 9. 将星（年支主 + 日支辅）
  // 口诀："寅午戌见午，申子辰见子，巳酉丑见酉，亥卯未见卯"
  // ----------------------------------------------------------
  checkYearDayBranchShensha(
    '将星', JIANGXING, yearBranch, dayBranch, allPillars, results
  );

  // ----------------------------------------------------------
  // 10. 灾煞（查年支，将星对冲）
  // "申子辰见午，寅午戌见子，巳酉丑见卯，亥卯未见酉"
  // ----------------------------------------------------------
  {
    const target = ZAISHA[yearBranch];
    if (target) {
      const found = findBranchInPillars(target, allPillars);
      for (const f of found) {
        results.push({
          name: '灾煞',
          location: f.name,
          branch: f.pillar.branch,
          source: '年支',
          description: `${yearBranch}年支灾煞在${target}（将星对冲）`,
        });
      }
    }
  }

  // ----------------------------------------------------------
  // 11. 劫煞（查年支）
  // "申子辰见巳，寅午戌见亥，巳酉丑见寅，亥卯未见申"
  // ----------------------------------------------------------
  {
    const target = JIESHA[yearBranch];
    if (target) {
      const found = findBranchInPillars(target, allPillars);
      for (const f of found) {
        results.push({
          name: '劫煞',
          location: f.name,
          branch: f.pillar.branch,
          source: '年支',
          description: `${yearBranch}年支劫煞在${target}`,
        });
      }
    }
  }

  // ----------------------------------------------------------
  // 12. 孤辰寡宿（查年支，孤辰和寡宿分别检查）
  // "亥子丑人，见寅为孤，见戌为寡；寅卯辰人，见巳为孤，见丑为寡；
  //  巳午未人，见申为孤，见辰为寡；申酉戌人，见亥为孤，见未为寡"
  // ----------------------------------------------------------
  {
    const entry = GUCHEN_GUASU[yearBranch];
    if (entry) {
      // 孤辰
      const guFound = findBranchInPillars(entry.gu, allPillars);
      for (const f of guFound) {
        results.push({
          name: '孤辰',
          location: f.name,
          branch: f.pillar.branch,
          source: '年支',
          description: `${yearBranch}年支孤辰在${entry.gu}`,
        });
      }
      // 寡宿
      const guaFound = findBranchInPillars(entry.gua, allPillars);
      for (const f of guaFound) {
        results.push({
          name: '寡宿',
          location: f.name,
          branch: f.pillar.branch,
          source: '年支',
          description: `${yearBranch}年支寡宿在${entry.gua}`,
        });
      }
    }
  }

  // ----------------------------------------------------------
  // 13. 天罗地网（查年支，男查天罗/女查地网）
  // "戌亥为天罗，辰巳为地网"
  // 男忌天罗（戌亥），女忌地网（辰巳）
  // ----------------------------------------------------------
  {
    if (gender === 'male') {
      // 男查天罗（戌、亥）
      for (const target of TIANLUO_DIWANG.tianluo) {
        const found = findBranchInPillars(target, allPillars);
        for (const f of found) {
          results.push({
            name: '天罗地网',
            location: f.name,
            branch: f.pillar.branch,
            source: '年支',
            description: `男命天罗在${target}（戌亥为天罗）`,
          });
        }
      }
    } else {
      // 女查地网（辰、巳）
      for (const target of TIANLUO_DIWANG.diwang) {
        const found = findBranchInPillars(target, allPillars);
        for (const f of found) {
          results.push({
            name: '天罗地网',
            location: f.name,
            branch: f.pillar.branch,
            source: '年支',
            description: `女命地网在${target}（辰巳为地网）`,
          });
        }
      }
    }
  }

  // ==========================================================
  // 三、查月支的神煞
  // ==========================================================

  // ----------------------------------------------------------
  // 14. 天德贵人（查月支，干支混查 —— 关键难点）
  // 口诀："正丁二申三月壬，四辛五亥六甲逢，七癸八寅九丙位，十乙巳子庚居中"
  //
  // 4 个月查地支：卯月(申)、午月(亥)、酉月(寅)、子月(巳)
  // 8 个月查天干：寅月(丁)、辰月(壬)、巳月(辛)、未月(甲)、
  //               申月(癸)、戌月(丙)、亥月(乙)、丑月(庚)
  //
  // 查天干 → 检查四柱天干是否命中
  // 查地支 → 检查四柱地支是否命中
  // ----------------------------------------------------------
  {
    const tiandeEntry = TIANDE.find(e => e.month === monthBranch);
    if (tiandeEntry) {
      if (tiandeEntry.isStem) {
        // 查天干：检查四柱+辅助宫位的天干是否命中
        const found = findStemInPillars(tiandeEntry.target, allPillars);
        for (const f of found) {
          results.push({
            name: '天德贵人',
            location: f.name,
            branch: f.pillar.branch,
            source: '月支',
            description: `${monthBranch}月天德贵人在天干${tiandeEntry.target}（查天干）`,
          });
        }
      } else {
        // 查地支：检查四柱+辅助宫位的地支是否命中
        const found = findBranchInPillars(tiandeEntry.target, allPillars);
        for (const f of found) {
          results.push({
            name: '天德贵人',
            location: f.name,
            branch: f.pillar.branch,
            source: '月支',
            description: `${monthBranch}月天德贵人在地支${tiandeEntry.target}（查地支）`,
          });
        }
      }
    }
  }

  // ----------------------------------------------------------
  // 15. 月德贵人（查月支，三合局，查天干）
  // "寅午戌丙，申子辰壬，巳酉丑庚，亥卯未甲"
  // ----------------------------------------------------------
  {
    const target = YUEDE[monthBranch];
    if (target) {
      const found = findStemInPillars(target, allPillars);
      for (const f of found) {
        results.push({
          name: '月德贵人',
          location: f.name,
          branch: f.pillar.branch,
          source: '月支',
          description: `${monthBranch}月月德贵人在天干${target}`,
        });
      }
    }
  }

  // ==========================================================
  // 四、查日柱的神煞
  // ==========================================================

  // ----------------------------------------------------------
  // 16. 魁罡（查日柱）
  // "壬辰庚戌与庚辰，戊戌魁罡四座神"
  // 检查日柱干支组合是否在魁罡四日中
  // ----------------------------------------------------------
  {
    const dayGanzhi = dayStem + dayBranch;
    if (KUIGANG.includes(dayGanzhi)) {
      results.push({
        name: '魁罡',
        location: '日',
        branch: dayPillar.branch,
        source: '日柱',
        description: `日柱${dayGanzhi}为魁罡（壬辰/庚戌/庚辰/戊戌四日）`,
      });
    }
  }

  // ==========================================================
  // 五、查空亡的神煞（对应规则 #21、数据表 11.8）
  // 空亡以日柱查旬空为主，年柱查旬空为辅
  // ----------------------------------------------------------

  // 17a. 日柱查旬空（主）
  {
    const kongwang = getKongwang(dayStem, dayBranch);
    if (kongwang) {
      // 查找旬首名称（用于描述）
      const xunshouEntry = LIUJIA_KONGWANG.find(
        e => e.kongwang[0] === kongwang[0] && e.kongwang[1] === kongwang[1]
      );
      const xunshouName = xunshouEntry?.xunshou ?? '';
      const xunshouLabel = xunshouName ? `${xunshouName}旬` : '';

      // 检查四柱+辅助宫位的地支是否在空亡地支中
      for (const kw of kongwang) {
        const found = findBranchInPillars(kw, allPillars);
        for (const f of found) {
          results.push({
            name: '空亡',
            location: f.name,
            branch: f.pillar.branch,
            source: '日柱旬空',
            description: `日柱${xunshouLabel}空亡${kongwang[0]}${kongwang[1]}，` +
              `${f.name}支${kw}落空亡（主）`,
          });
        }
      }
    }
  }

  // 17b. 年柱查旬空（辅）
  {
    const kongwang = getKongwang(yearStem, yearBranch);
    if (kongwang) {
      const xunshouEntry = LIUJIA_KONGWANG.find(
        e => e.kongwang[0] === kongwang[0] && e.kongwang[1] === kongwang[1]
      );
      const xunshouName = xunshouEntry?.xunshou ?? '';
      const xunshouLabel = xunshouName ? `${xunshouName}旬` : '';

      for (const kw of kongwang) {
        const found = findBranchInPillars(kw, allPillars);
        for (const f of found) {
          results.push({
            name: '空亡',
            location: f.name,
            branch: f.pillar.branch,
            source: '年柱旬空',
            description: `年柱${xunshouLabel}空亡${kongwang[0]}${kongwang[1]}，` +
              `${f.name}支${kw}落空亡（辅）`,
          });
        }
      }
    }
  }

  return results;
}
