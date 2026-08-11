/**
 * 层8：关系分析 — 规则 #22-#25 测试
 *
 * 天干五合（甲己化土等5组）
 * 地支六合/六冲/三合/三刑
 * 暗合（核心四组）
 * 拱夹虚邀
 *
 * 来源：[项目大纲 规则#22-#25, 11.14, 11.19, 11.21]
 */

import { describe, it, expect } from 'vitest';
import { calculateRelations } from '../relations';
import {
  STEM_COMBINATIONS,
  getStemCombination,
  SIX_HE,
  SIX_CLASH,
  SAN_HE,
  SAN_XING,
  AN_HE,
  GONG,
  JIA,
} from '../constants';
import { paipan } from '../index';
import type { FourPillars, PillarDetail, Stem, Branch } from '../types';

// 构造最小化四柱用于关系分析单元测试
function mockPillar(stem: Stem, branch: Branch): PillarDetail {
  return {
    stem, branch, ganzhi: `${stem}${branch}`,
    nayin: '', nayinElement: '土',
    hiddenStems: [], tenGod: '比肩', shenSha: [],
  };
}
function mockFourPillars(
  yStem: Stem, yBr: Branch,
  mStem: Stem, mBr: Branch,
  dStem: Stem, dBr: Branch,
  hStem: Stem, hBr: Branch,
): FourPillars {
  return {
    year: mockPillar(yStem, yBr),
    month: mockPillar(mStem, mBr),
    day: mockPillar(dStem, dBr),
    hour: mockPillar(hStem, hBr),
  };
}

describe('规则#22-#25：关系分析', () => {
  // ============================================================
  // 规则#22：天干五合（甲己化土等5组）
  // ============================================================
  describe('天干五合（甲己化土等5组）', () => {
    it('STEM_COMBINATIONS 应包含5组合化', () => {
      expect(STEM_COMBINATIONS).toHaveLength(5);
    });

    it('甲己合化土', () => {
      expect(getStemCombination('甲', '己')).toBe('土');
      expect(getStemCombination('己', '甲')).toBe('土');
    });

    it('乙庚合化金', () => {
      expect(getStemCombination('乙', '庚')).toBe('金');
    });

    it('丙辛合化水', () => {
      expect(getStemCombination('丙', '辛')).toBe('水');
    });

    it('丁壬合化木', () => {
      expect(getStemCombination('丁', '壬')).toBe('木');
    });

    it('戊癸合化火', () => {
      expect(getStemCombination('戊', '癸')).toBe('火');
    });

    it('非合化天干应返回null', () => {
      expect(getStemCombination('甲', '乙')).toBeNull();
      expect(getStemCombination('甲', '丙')).toBeNull();
    });

    it('calculateRelations：年甲月己应检测到天干五合化土', () => {
      const fp = mockFourPillars('甲', '子', '己', '丑', '丙', '寅', '戊', '辰');
      const rel = calculateRelations(fp);
      const he = rel.stemRelations.find(r => r.type === '天干五合');
      expect(he).toBeDefined();
      expect(he?.transform).toBe('土');
      expect(he?.stems).toContain('甲');
      expect(he?.stems).toContain('己');
    });

    it('calculateRelations：化气条件满足时 huaQiMet=true', () => {
      // 甲己化土，月支丑（土），化神透引（戊土透时柱）
      const fp = mockFourPillars('甲', '子', '己', '丑', '丙', '寅', '戊', '辰');
      const rel = calculateRelations(fp);
      const he = rel.stemRelations.find(r => r.type === '天干五合');
      expect(he?.huaQiMet).toBe(true);
    });

    it('无天干五合时 stemRelations 不应包含天干五合', () => {
      const fp = mockFourPillars('甲', '子', '丙', '寅', '戊', '辰', '庚', '午');
      const rel = calculateRelations(fp);
      const he = rel.stemRelations.filter(r => r.type === '天干五合');
      expect(he).toHaveLength(0);
    });
  });

  // ============================================================
  // 规则#23：地支六合/六冲/三合/三刑
  // ============================================================
  describe('地支六合', () => {
    it('SIX_HE 应包含6组六合', () => {
      expect(SIX_HE).toHaveLength(6);
    });

    it('子丑合化土', () => {
      expect(getStemCombination).toBeDefined();
      // 六合化气验证
      const ziChou = SIX_HE.find(h => h.pair[0] === '子' && h.pair[1] === '丑');
      expect(ziChou?.transform).toBe('土');
    });

    it('辰酉合化金', () => {
      const chenYou = SIX_HE.find(h => h.pair[0] === '辰' && h.pair[1] === '酉');
      expect(chenYou?.transform).toBe('金');
    });

    it('calculateRelations：年子月丑应检测子丑六合', () => {
      const fp = mockFourPillars('甲', '子', '己', '丑', '丙', '寅', '戊', '辰');
      const rel = calculateRelations(fp);
      const liuHe = rel.branchRelations.filter(r => r.type === '六合');
      expect(liuHe.length).toBeGreaterThan(0);
      expect(liuHe.some(r => r.description.includes('子丑'))).toBe(true);
    });
  });

  describe('地支六冲', () => {
    it('SIX_CLASH 应包含6组六冲', () => {
      expect(SIX_CLASH).toHaveLength(6);
    });

    it('子午冲', () => {
      expect(SIX_CLASH.some(([a, b]) => (a === '子' && b === '午'))).toBe(true);
    });

    it('寅申冲', () => {
      expect(SIX_CLASH.some(([a, b]) => (a === '寅' && b === '申'))).toBe(true);
    });

    it('辰戌冲', () => {
      expect(SIX_CLASH.some(([a, b]) => (a === '辰' && b === '戌'))).toBe(true);
    });

    it('calculateRelations：年子月午应检测子午冲', () => {
      const fp = mockFourPillars('甲', '子', '丙', '午', '戊', '卯', '庚', '申');
      const rel = calculateRelations(fp);
      const chong = rel.branchRelations.filter(r => r.type === '六冲');
      expect(chong.some(r => r.description.includes('子午'))).toBe(true);
    });
  });

  describe('地支三合局', () => {
    it('SAN_HE 应包含4组三合局', () => {
      expect(SAN_HE).toHaveLength(4);
    });

    it('申子辰三合水局（中神子）', () => {
      const sanhe = SAN_HE.find(s => s.zhongShen === '子');
      expect(sanhe?.branches).toEqual(['申', '子', '辰']);
      expect(sanhe?.transform).toBe('水');
    });

    it('寅午戌三合火局（中神午）', () => {
      const sanhe = SAN_HE.find(s => s.zhongShen === '午');
      expect(sanhe?.branches).toEqual(['寅', '午', '戌']);
      expect(sanhe?.transform).toBe('火');
    });

    it('巳酉丑三合金局（中神酉）', () => {
      const sanhe = SAN_HE.find(s => s.zhongShen === '酉');
      expect(sanhe?.transform).toBe('金');
    });

    it('亥卯未三合木局（中神卯）', () => {
      const sanhe = SAN_HE.find(s => s.zhongShen === '卯');
      expect(sanhe?.transform).toBe('木');
    });

    it('calculateRelations：寅午戌三支齐应检测三合火局', () => {
      const fp = mockFourPillars('甲', '寅', '丙', '午', '戊', '戌', '庚', '申');
      const rel = calculateRelations(fp);
      const sanhe = rel.branchRelations.filter(r => r.type === '三合');
      expect(sanhe.some(r => r.description.includes('寅午戌'))).toBe(true);
      expect(sanhe.some(r => r.transform === '火')).toBe(true);
    });

    it('三支不全不应检测三合', () => {
      // 仅寅午，无戌
      const fp = mockFourPillars('甲', '寅', '丙', '午', '戊', '子', '庚', '申');
      const rel = calculateRelations(fp);
      const sanhe = rel.branchRelations.filter(r => r.type === '三合');
      expect(sanhe).toHaveLength(0);
    });

    it('半三合：寅午应检测生旺半合', () => {
      const fp = mockFourPillars('甲', '寅', '丙', '午', '戊', '子', '庚', '申');
      const rel = calculateRelations(fp);
      const ban = rel.branchRelations.filter(r => r.type === '半三合');
      expect(ban.some(r => r.description.includes('寅午'))).toBe(true);
    });
  });

  describe('地支三刑', () => {
    it('SAN_XING 应包含4类三刑', () => {
      expect(SAN_XING).toHaveLength(4);
    });

    it('无礼之刑：子卯相刑', () => {
      const wuli = SAN_XING.find(s => s.type === '无礼之刑');
      expect(wuli?.pairs.some(([a, b]) => a === '子' && b === '卯')).toBe(true);
    });

    it('无恩之刑：寅巳申', () => {
      const wuen = SAN_XING.find(s => s.type === '无恩之刑');
      expect(wuen?.pairs).toEqual([['寅', '巳'], ['巳', '申'], ['申', '寅']]);
    });

    it('恃势之刑：丑戌未', () => {
      const shishi = SAN_XING.find(s => s.type === '恃势之刑');
      expect(shishi?.pairs).toEqual([['丑', '戌'], ['戌', '未'], ['未', '丑']]);
    });

    it('自刑：辰午酉亥', () => {
      const zi = SAN_XING.find(s => s.type === '自刑');
      expect(zi?.pairs).toEqual([['辰', '辰'], ['午', '午'], ['酉', '酉'], ['亥', '亥']]);
    });

    it('calculateRelations：年子日卯应检测子卯无礼之刑', () => {
      const fp = mockFourPillars('甲', '子', '丙', '午', '戊', '卯', '庚', '申');
      const rel = calculateRelations(fp);
      const xing = rel.branchRelations.filter(r => r.type === '三刑');
      expect(xing.some(r => r.description.includes('子') && r.description.includes('卯'))).toBe(true);
    });
  });

  // ============================================================
  // 规则#24：暗合（核心四组）
  // ============================================================
  describe('暗合（核心四组）', () => {
    it('AN_HE 应包含核心四组+争议组', () => {
      // 寅丑、午亥、卯申、子巳 + 争议 巳戌
      expect(AN_HE.length).toBeGreaterThanOrEqual(4);
    });

    it('寅丑暗合甲己', () => {
      const item = AN_HE.find(a => a.branches[0] === '寅' && a.branches[1] === '丑');
      expect(item?.hiddenStems).toBe('甲己合');
    });

    it('午亥暗合丁壬', () => {
      const item = AN_HE.find(a => a.branches[0] === '午' && a.branches[1] === '亥');
      expect(item?.hiddenStems).toBe('丁壬合');
    });

    it('卯申暗合乙庚', () => {
      const item = AN_HE.find(a => a.branches[0] === '卯' && a.branches[1] === '申');
      expect(item?.hiddenStems).toBe('乙庚合');
    });

    it('子巳暗合癸戊', () => {
      const item = AN_HE.find(a => a.branches[0] === '子' && a.branches[1] === '巳');
      expect(item?.hiddenStems).toBe('癸戊合');
    });

    it('巳戌暗合丙辛（争议组）', () => {
      const item = AN_HE.find(a => a.branches[0] === '巳' && a.branches[1] === '戌');
      expect(item?.hiddenStems).toBe('丙辛合');
      expect(item?.controversial).toBe(true);
    });

    it('calculateRelations：年寅月丑应检测寅丑暗合', () => {
      const fp = mockFourPillars('甲', '寅', '丙', '丑', '戊', '午', '庚', '亥');
      const rel = calculateRelations(fp);
      const anHe = rel.anHeRelations.find(a => a.branches.includes('寅') && a.branches.includes('丑'));
      expect(anHe).toBeDefined();
      expect(anHe?.hiddenStems).toContain('甲己');
    });

    it('calculateRelations：日午时亥应检测午亥暗合', () => {
      const fp = mockFourPillars('甲', '寅', '丙', '丑', '戊', '午', '庚', '亥');
      const rel = calculateRelations(fp);
      const anHe = rel.anHeRelations.find(a => a.branches.includes('午') && a.branches.includes('亥'));
      expect(anHe).toBeDefined();
      expect(anHe?.hiddenStems).toContain('丁壬');
    });
  });

  // ============================================================
  // 规则#25：拱夹虚邀
  // ============================================================
  describe('拱夹虚邀', () => {
    it('GONG 拱应包含4组（三合局首尾缺中神）', () => {
      expect(GONG).toHaveLength(4);
    });

    it('申辰拱子（水）', () => {
      const item = GONG.find(g => g.pair[0] === '申' && g.pair[1] === '辰');
      expect(item?.virtual).toBe('子');
      expect(item?.transform).toBe('水');
    });

    it('寅戌拱午（火）', () => {
      const item = GONG.find(g => g.pair[0] === '寅' && g.pair[1] === '戌');
      expect(item?.virtual).toBe('午');
      expect(item?.transform).toBe('火');
    });

    it('巳丑拱酉（金）', () => {
      const item = GONG.find(g => g.pair[0] === '巳' && g.pair[1] === '丑');
      expect(item?.virtual).toBe('酉');
    });

    it('亥未拱卯（木）', () => {
      const item = GONG.find(g => g.pair[0] === '亥' && g.pair[1] === '未');
      expect(item?.virtual).toBe('卯');
    });

    it('JIA 夹应包含4组（三会局首尾缺中神）', () => {
      expect(JIA).toHaveLength(4);
    });

    it('寅辰夹卯（木）', () => {
      const item = JIA.find(j => j.pair[0] === '寅' && j.pair[1] === '辰');
      expect(item?.virtual).toBe('卯');
      expect(item?.transform).toBe('木');
    });

    it('申戌夹酉（金）', () => {
      const item = JIA.find(j => j.pair[0] === '申' && j.pair[1] === '戌');
      expect(item?.virtual).toBe('酉');
    });

    it('calculateRelations：年申月辰应拱出虚神子', () => {
      const fp = mockFourPillars('甲', '申', '丙', '辰', '戊', '午', '庚', '寅');
      const rel = calculateRelations(fp);
      const gong = rel.gongJiaRelations.find(g => g.type === '拱');
      expect(gong).toBeDefined();
      expect(gong?.virtualBranch).toBe('子');
      expect(gong?.transform).toBe('水');
    });

    it('中神在场时不应检测拱（拱=三合局首尾缺中神）', () => {
      // 申子辰全在 → 无拱（子=中神在场）
      const fp = mockFourPillars('甲', '申', '丙', '子', '戊', '辰', '庚', '寅');
      const rel = calculateRelations(fp);
      const gong = rel.gongJiaRelations.filter(g => g.type === '拱' && g.virtualBranch === '子');
      expect(gong).toHaveLength(0);
    });

    it('calculateRelations：寅辰应夹出虚神卯', () => {
      const fp = mockFourPillars('甲', '寅', '丙', '辰', '戊', '子', '庚', '午');
      const rel = calculateRelations(fp);
      const jia = rel.gongJiaRelations.find(g => g.type === '夹' && g.virtualBranch === '卯');
      expect(jia).toBeDefined();
      expect(jia?.transform).toBe('木');
    });
  });

  // ============================================================
  // 羊刃三体系（关系分析层输出）
  // ============================================================
  describe('羊刃三体系（关系分析输出）', () => {
    it('calculateRelations 应返回日干羊刃三体系位置', () => {
      const fp = mockFourPillars('甲', '子', '丙', '寅', '甲', '卯', '戊', '辰');
      const rel = calculateRelations(fp);
      expect(rel.yangRen).toBeDefined();
      expect(rel.yangRen?.stem).toBe('甲');
    });

    it('甲干羊刃三体系应包含三种说法', () => {
      const fp = mockFourPillars('甲', '子', '丙', '寅', '甲', '卯', '戊', '辰');
      const rel = calculateRelations(fp);
      const systems = rel.yangRen?.positions.map(p => p.system);
      expect(systems).toEqual(
        expect.arrayContaining(['禄前一位说', '五阳干说', '帝旺位说']),
      );
    });

    it('甲干三种说法羊刃均为卯', () => {
      const fp = mockFourPillars('甲', '子', '丙', '寅', '甲', '卯', '戊', '辰');
      const rel = calculateRelations(fp);
      for (const pos of rel.yangRen!.positions) {
        expect(pos.branch).toBe('卯');
      }
    });
  });

  // ============================================================
  // paipan 集成
  // ============================================================
  describe('paipan 集成', () => {
    it('命盘应包含关系分析四类结果', () => {
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      expect(Array.isArray(chart.branchRelations)).toBe(true);
      expect(Array.isArray(chart.stemRelations)).toBe(true);
      expect(Array.isArray(chart.anHeRelations)).toBe(true);
      expect(Array.isArray(chart.gongJiaRelations)).toBe(true);
    });

    it('命例1（甲子丙寅戊辰甲子）应检测子辰半三合水', () => {
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      const ban = chart.branchRelations.filter(r => r.type === '半三合');
      expect(ban.some(r => r.description.includes('子') && r.description.includes('辰'))).toBe(true);
    });
  });
});
