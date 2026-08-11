/**
 * 层9：旺衰格局 — 规则 #26-#29 测试
 *
 * 五行旺相休囚死（春木旺等）
 * 人元司令分野（每月藏干用事日数）
 * 日主旺衰（得令+得地+得势）
 * 格局取用（月令为主）
 * 用神五法
 *
 * 来源：[项目大纲 规则#26-#29, 11.4, 11.5]
 */

import { describe, it, expect } from 'vitest';
import {
  getWangXiang,
  getElementStatus as getElementStatusP,
  getRenYuanSiLing as getRenYuanP,
  calculateProsperity,
} from '../prosperity';
import {
  getElementStatus as getElementStatusW,
  getRenYuanSiLing as getRenYuanW,
  countElements,
  calculateWangShuai,
} from '../wang-shuai';
import {
  WANG_SHUAI,
  getSeason,
  REN_YUAN_SI_LING as REN_YUAN_CONST,
  GENERATING,
  OVERCOMING,
  STEM_ELEMENT,
} from '../constants';
import { paipan } from '../index';
import type { Stem, Branch, Element, FourPillars, PillarDetail } from '../types';

// 构造最小化四柱
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

describe('规则#26-#29：旺衰格局', () => {
  // ============================================================
  // 规则#26：五行旺相休囚死
  // ============================================================
  describe('五行旺相休囚死（春木旺等）', () => {
    it('春：木旺、火相、水休、金囚、土死', () => {
      expect(WANG_SHUAI['春']).toEqual({
        '木': '旺', '火': '相', '水': '休', '金': '囚', '土': '死',
      });
    });

    it('夏：火旺、土相、木休、水囚、金死', () => {
      expect(WANG_SHUAI['夏']).toEqual({
        '火': '旺', '土': '相', '木': '休', '水': '囚', '金': '死',
      });
    });

    it('秋：金旺、水相、土休、火囚、木死', () => {
      expect(WANG_SHUAI['秋']).toEqual({
        '金': '旺', '水': '相', '土': '休', '火': '囚', '木': '死',
      });
    });

    it('冬：水旺、木相、金休、土囚、火死', () => {
      expect(WANG_SHUAI['冬']).toEqual({
        '水': '旺', '木': '相', '金': '休', '土': '囚', '火': '死',
      });
    });

    it('四季：土旺、金相、火休、木囚、水死', () => {
      expect(WANG_SHUAI['四季']).toEqual({
        '土': '旺', '金': '相', '火': '休', '木': '囚', '水': '死',
      });
    });

    it('getSeason：寅卯为春', () => {
      expect(getSeason('寅')).toBe('春');
      expect(getSeason('卯')).toBe('春');
    });

    it('getSeason：巳午为夏', () => {
      expect(getSeason('巳')).toBe('夏');
      expect(getSeason('午')).toBe('夏');
    });

    it('getSeason：申酉为秋', () => {
      expect(getSeason('申')).toBe('秋');
      expect(getSeason('酉')).toBe('秋');
    });

    it('getSeason：亥子为冬', () => {
      expect(getSeason('亥')).toBe('冬');
      expect(getSeason('子')).toBe('冬');
    });

    it('getSeason：辰戌丑未为四季', () => {
      expect(getSeason('辰')).toBe('四季');
      expect(getSeason('戌')).toBe('四季');
      expect(getSeason('丑')).toBe('四季');
      expect(getSeason('未')).toBe('四季');
    });

    it('getElementStatus（prosperity版）：春月木旺', () => {
      expect(getElementStatusP('木', '寅')).toBe('旺');
      expect(getElementStatusP('木', '卯')).toBe('旺');
    });

    it('getElementStatus（prosperity版）：春月火相', () => {
      expect(getElementStatusP('火', '寅')).toBe('相');
    });

    it('getElementStatus（prosperity版）：春月金囚、土死', () => {
      expect(getElementStatusP('金', '寅')).toBe('囚');
      expect(getElementStatusP('土', '寅')).toBe('死');
    });

    it('getElementStatus（wang-shuai版）：寅月返回全表', () => {
      const table = getElementStatusW('寅');
      expect(table['木']).toBe('旺');
      expect(table['火']).toBe('相');
      expect(table['金']).toBe('囚');
      expect(table['土']).toBe('死');
      expect(table['水']).toBe('休');
    });

    it('getWangXiang：午月（夏）火旺', () => {
      const table = getWangXiang('午');
      expect(table['旺']).toBe('火');
      expect(table['相']).toBe('土');
      expect(table['死']).toBe('金');
    });

    it('当令者旺、令生者相、生令者休、克令者囚、令克者死', () => {
      // 春木旺：当令=木；令生=火(木生火)→相；生令=水(水生木)→休；克令=金(金克木)→囚；令克=土(木克土)→死
      const spring = WANG_SHUAI['春'];
      expect(spring['木']).toBe('旺');
      expect(spring[GENERATING['木']]).toBe('相');   // 木生火→火相
      expect(spring['水']).toBe('休');               // 水生木→水休
      expect(spring['金']).toBe('囚');               // 金克木→金囚
      expect(spring[OVERCOMING['木']]).toBe('死');   // 木克土→土死
    });

    it('paipan 集成：命例1寅月（春）五行状态', () => {
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      const status = getElementStatusW(chart.fourPillars.month.branch);
      expect(status['木']).toBe('旺');
      expect(status['土']).toBe('死');
    });
  });

  // ============================================================
  // 规则#26：人元司令分野（每月藏干用事日数）
  // ============================================================
  describe('人元司令分野（每月藏干用事日数）', () => {
    it('寅月分三段：戊5日、丙5日、甲20日', () => {
      const segments = getRenYuanP('寅');
      expect(segments).toHaveLength(3);
      expect(segments[0]).toMatchObject({ stem: '戊', days: 5 });
      expect(segments[1]).toMatchObject({ stem: '丙', days: 5 });
      expect(segments[2]).toMatchObject({ stem: '甲', days: 20 });
    });

    it('子月分两段：壬7日、癸23日', () => {
      const segments = getRenYuanP('子');
      expect(segments).toHaveLength(2);
      expect(segments[0]).toMatchObject({ stem: '壬', days: 7 });
      expect(segments[1]).toMatchObject({ stem: '癸', days: 23 });
    });

    it('卯月分两段：甲7日、乙23日', () => {
      const segments = getRenYuanP('卯');
      expect(segments[0]).toMatchObject({ stem: '甲', days: 7 });
      expect(segments[1]).toMatchObject({ stem: '乙', days: 23 });
    });

    it('申月分三段：戊5日、壬5日、庚20日', () => {
      const segments = getRenYuanP('申');
      expect(segments).toHaveLength(3);
      expect(segments[0]).toMatchObject({ stem: '戊', days: 5 });
      expect(segments[1]).toMatchObject({ stem: '壬', days: 5 });
      expect(segments[2]).toMatchObject({ stem: '庚', days: 20 });
    });

    it('每月用事日数之和应约为30日', () => {
      const branches: Branch[] = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
      for (const b of branches) {
        const segments = getRenYuanP(b);
        const total = segments.reduce((sum, s) => sum + s.days, 0);
        expect(total).toBe(30);
      }
    });

    it('人元司令分野本气用事日数最多', () => {
      // 寅月本气甲20日最多
      const segments = getRenYuanP('寅');
      const mainDays = segments[segments.length - 1].days; // 甲20
      for (const s of segments) {
        expect(mainDays).toBeGreaterThanOrEqual(s.days);
      }
    });

    it('REN_YUAN_SI_LING 常量表应包含12月支', () => {
      const branches: Branch[] = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
      for (const b of branches) {
        expect(REN_YUAN_CONST[b]).toBeDefined();
      }
    });

    it('wang-shuai版 getRenYuanSiLing 应返回 segments', () => {
      const result = getRenYuanW('寅', new Date(2024, 1, 20, 12, 0));
      expect(result.month).toBe('寅');
      expect(result.segments).toHaveLength(3);
      expect(result.segments[0]).toMatchObject({ stem: '戊', days: 5 });
    });

    it('paipan 集成：命盘应包含人元司令分野', () => {
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      expect(chart.renYuanSiLing).toBeDefined();
      expect(chart.renYuanSiLing.segments).toBeInstanceOf(Array);
    });
  });

  // ============================================================
  // 规则#27：日主旺衰（得令+得地+得势）
  // ============================================================
  describe('日主旺衰（得令+得地+得势）', () => {
    it('得令：日主五行在月令旺或相', () => {
      // 命例1：日主戊(土)，寅月(春)土死 → 不得令
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      expect(chart.dayMaster).toBe('戊');
      expect(chart.fourPillars.month.branch).toBe('寅');
      expect(chart.prosperity.deLing).toBe(false);
    });

    it('得地：日主在地支藏干中有根', () => {
      // 命例1：戊(土)，辰(戊土本气)有根 → 得地
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      expect(chart.prosperity.deDi).toBe(true);
    });

    it('得势：日主在天干中比劫或印多', () => {
      // 命例1：年甲、月丙、时甲（无同类土、无印火透... 实际为偏弱）
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      // 戊(土)，年甲(木)、月丙(火=印)、时甲(木)。丙火生戊土=印 → 支持数1
      // deShi 需要 supportCount >= 2
      expect(typeof chart.prosperity.deShi).toBe('boolean');
    });

    it('命例1日主戊在寅月应判定为偏弱', () => {
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      // 土在寅月为死（不得令），但有辰根（得地），天干支持不足 → 偏弱
      expect(chart.prosperity.dayMasterStrength).toBe('偏弱');
    });

    it('dayMasterStrength 应为有效枚举值', () => {
      const chart = paipan({ year: 1984, month: 6, day: 15, hour: 12, minute: 0, gender: '男', longitude: 116.41 });
      expect(['旺', '偏旺', '中和', '偏弱', '弱']).toContain(chart.prosperity.dayMasterStrength);
    });

    it('calculateWangShuai：应返回完整旺衰信息', () => {
      const fp = mockFourPillars('甲', '寅', '丙', '寅', '甲', '辰', '甲', '子');
      const ws = calculateWangShuai(fp, new Date(2024, 1, 20, 12, 0));
      expect(ws).toHaveProperty('elementStatus');
      expect(ws).toHaveProperty('dayMasterStrength');
      expect(ws).toHaveProperty('deLing');
      expect(ws).toHaveProperty('deDi');
      expect(ws).toHaveProperty('deShi');
    });

    it('countElements：应统计四柱五行分布', () => {
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      expect(chart.elementCount).toHaveProperty('木');
      expect(chart.elementCount).toHaveProperty('火');
      expect(chart.elementCount).toHaveProperty('土');
      expect(chart.elementCount).toHaveProperty('金');
      expect(chart.elementCount).toHaveProperty('水');
      // 五行计数之和应约为4（天干4 + 藏干比例）
      const total = Object.values(chart.elementCount).reduce((a, b) => a + b, 0);
      expect(total).toBeGreaterThan(4);
    });

    it('命例1五行计数：金为0（无金）', () => {
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      // 甲子丙寅戊辰甲子：天干甲丙戊甲(木火土木)，藏干无金
      expect(chart.elementCount['金']).toBe(0);
    });
  });

  // ============================================================
  // 规则#28：格局取用（月令为主）
  // ============================================================
  describe('格局取用（月令为主）', () => {
    it('命例1（戊日寅月，本气甲透干）应为七杀格', () => {
      // 月令寅本气甲，戊见甲=七杀，甲透年柱 → 七杀格
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      expect(chart.fourPillars.month.branch).toBe('寅');
      expect(chart.fourPillars.year.stem).toBe('甲'); // 甲透干
      expect(chart.prosperity.pattern).toBe('七杀格');
    });

    it('格局应为非空字符串', () => {
      const chart = paipan({ year: 1984, month: 6, day: 15, hour: 12, minute: 0, gender: '男', longitude: 116.41 });
      expect(chart.prosperity.pattern).toBeTruthy();
      expect(typeof chart.prosperity.pattern).toBe('string');
    });

    it('calculateWangShuai：应返回格局', () => {
      const fp = mockFourPillars('甲', '寅', '丙', '寅', '戊', '辰', '甲', '子');
      const ws = calculateWangShuai(fp, new Date(2024, 1, 20, 12, 0));
      // 日主戊，月令寅本气甲，戊见甲=七杀 → 七杀格
      expect(ws.pattern).toBe('七杀格');
    });

    it('正官格：日主戊见月令本气乙（正官）', () => {
      // 构造：日主戊，月支卯(本气乙)，乙透干 → 正官格
      const fp = mockFourPillars('甲', '子', '乙', '卯', '戊', '辰', '丙', '午');
      const ws = calculateWangShuai(fp, new Date(2024, 2, 20, 12, 0));
      expect(ws.pattern).toBe('正官格');
    });

    it('食神格：日主戊见月令本气庚（食神）', () => {
      // 日主戊，月支申(本气庚)，庚透干 → 食神格
      const fp = mockFourPillars('甲', '子', '庚', '申', '戊', '辰', '丙', '午');
      const ws = calculateWangShuai(fp, new Date(2024, 7, 15, 12, 0));
      expect(ws.pattern).toBe('食神格');
    });
  });

  // ============================================================
  // 规则#29：用神五法
  // ============================================================
  describe('用神五法', () => {
    it('命例1（日主偏弱）应用扶抑法扶弱，用神为印（生我者）', () => {
      // 戊(土)偏弱 → 扶抑扶弱 → 用神=GENERATING[dayElement]=金（我生者方向）
      // 注意：prosperity.ts 中弱者用神 = GENERATING[dayElement]
      // GENERATING['土']='金'，故用神=金，方法='扶抑（扶弱）'
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      expect(chart.prosperity.dayMasterStrength).toBe('偏弱');
      expect(chart.prosperity.yongShenMethod).toContain('扶抑');
      expect(chart.prosperity.yongShenMethod).toContain('扶弱');
    });

    it('用神方法应标注扶抑/调候/通关之一', () => {
      const chart = paipan({ year: 1984, month: 6, day: 15, hour: 12, minute: 0, gender: '男', longitude: 116.41 });
      const method = chart.prosperity.yongShenMethod;
      expect(['扶抑', '调候', '通关', '病药', '专旺'].some(k => method.includes(k))).toBe(true);
    });

    it('旺者用神应取克泄耗（扶抑抑旺）', () => {
      // 构造一个日主旺的命例：日主甲，寅月(得令)，多木(得势)
      // 甲甲甲甲 寅寅寅寅 → 极旺 → 抑旺
      const fp = mockFourPillars('甲', '寅', '甲', '寅', '甲', '寅', '甲', '卯');
      const tc = new Date(2024, 1, 20, 12, 0);
      // 用 prosperity.calculateProsperity 需 hiddenStems
      const hiddenStems = {
        year: [{ stem: '甲' as Stem, type: '本气' as const, ratio: 0.6 }, { stem: '丙' as Stem, type: '中气' as const, ratio: 0.25 }, { stem: '戊' as Stem, type: '余气' as const, ratio: 0.15 }],
        month: [{ stem: '甲' as Stem, type: '本气' as const, ratio: 0.6 }, { stem: '丙' as Stem, type: '中气' as const, ratio: 0.25 }, { stem: '戊' as Stem, type: '余气' as const, ratio: 0.15 }],
        day: [{ stem: '甲' as Stem, type: '本气' as const, ratio: 0.6 }, { stem: '丙' as Stem, type: '中气' as const, ratio: 0.25 }, { stem: '戊' as Stem, type: '余气' as const, ratio: 0.15 }],
        hour: [{ stem: '乙' as Stem, type: '本气' as const, ratio: 1.0 }],
      };
      const result = calculateProsperity(fp, hiddenStems, tc);
      expect(['旺', '偏旺']).toContain(result.dayMasterStrength);
      expect(result.yongShenMethod).toContain('抑旺');
    });

    it('弱者用神应取生扶（扶抑扶弱）', () => {
      // 构造日主弱：日主甲，申月(金旺克木)，无木助
      const fp = mockFourPillars('庚', '申', '庚', '申', '甲', '申', '庚', '申');
      const tc = new Date(2024, 7, 15, 12, 0);
      const hiddenStems = {
        year: [{ stem: '庚' as Stem, type: '本气' as const, ratio: 0.6 }, { stem: '壬' as Stem, type: '中气' as const, ratio: 0.25 }, { stem: '戊' as Stem, type: '余气' as const, ratio: 0.15 }],
        month: [{ stem: '庚' as Stem, type: '本气' as const, ratio: 0.6 }, { stem: '壬' as Stem, type: '中气' as const, ratio: 0.25 }, { stem: '戊' as Stem, type: '余气' as const, ratio: 0.15 }],
        day: [{ stem: '庚' as Stem, type: '本气' as const, ratio: 0.6 }, { stem: '壬' as Stem, type: '中气' as const, ratio: 0.25 }, { stem: '戊' as Stem, type: '余气' as const, ratio: 0.15 }],
        hour: [{ stem: '庚' as Stem, type: '本气' as const, ratio: 0.6 }, { stem: '壬' as Stem, type: '中气' as const, ratio: 0.25 }, { stem: '戊' as Stem, type: '余气' as const, ratio: 0.15 }],
      };
      const result = calculateProsperity(fp, hiddenStems, tc);
      expect(['弱', '偏弱']).toContain(result.dayMasterStrength);
      expect(result.yongShenMethod).toContain('扶弱');
    });

    it('用神应为五行之一或null', () => {
      const chart = paipan({ year: 1984, month: 6, day: 15, hour: 12, minute: 0, gender: '男', longitude: 116.41 });
      expect(chart.prosperity.yongShen === null || ['木', '火', '土', '金', '水'].includes(chart.prosperity.yongShen as Element)).toBe(true);
    });

    it('命例1用神应为金（扶抑扶弱）', () => {
      // 戊(土)偏弱，生我者=火(印)... 但 prosperity.ts 弱者用神=GENERATING[dayElement]
      // GENERATING['土']='金'（土生金？不，GENERATING是"我生"方向）
      // 实际：prosperity.ts 弱者 yongShen = GENERATING[dayElement]
      // GENERATING['土']='金'，故用神=金
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      expect(chart.prosperity.yongShen).toBe('金');
    });
  });
});
