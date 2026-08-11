/**
 * 层7：神煞 — 规则 #20-#21 测试
 *
 * 天乙贵人起法（日干查）
 * 文昌起法（日干查）
 * 华盖起法（年支查）
 * 驿马起法（年支查）
 * 桃花起法（年支查）
 * 空亡（日柱查旬空）
 * 羊刃三体系（禄前一位说/五阳干说/帝旺位说）
 *
 * 来源：[项目大纲 规则#20-#21, 11.3, 11.8, 11.17]
 */

import { describe, it, expect } from 'vitest';
import { calculateShenSha } from '../shen-sha';
import {
  TIAN_YI_GUI_REN,
  WEN_CHANG,
  HUA_GAI,
  YI_MA,
  TAO_HUA,
  KONG_WANG,
  getKongWang,
  jiaZiIndex,
  YANG_REN_LU_QIAN,
  YANG_REN_YANG,
  YANG_REN_DI_WANG,
  LU_POSITION,
  HEAVENLY_STEMS,
} from '../constants';
import { paipan } from '../index';
import type { FourPillars, PillarDetail, Stem, Branch } from '../types';

// 构造最小化四柱用于神煞单元测试
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

describe('规则#20-#21：神煞', () => {
  // ============================================================
  // 规则#20：天乙贵人起法（日干查）
  // ============================================================
  describe('天乙贵人起法（日干查）', () => {
    it('甲日干天乙贵人在丑、未', () => {
      expect(TIAN_YI_GUI_REN['甲']).toEqual(['丑', '未']);
    });

    it('乙日干天乙贵人在子、申', () => {
      expect(TIAN_YI_GUI_REN['乙']).toEqual(['子', '申']);
    });

    it('丙丁日干天乙贵人在酉、亥', () => {
      expect(TIAN_YI_GUI_REN['丙']).toEqual(['酉', '亥']);
      expect(TIAN_YI_GUI_REN['丁']).toEqual(['酉', '亥']);
    });

    it('戊己日干天乙贵人在丑、未', () => {
      expect(TIAN_YI_GUI_REN['戊']).toEqual(['丑', '未']);
      expect(TIAN_YI_GUI_REN['己']).toEqual(['子', '申']);
    });

    it('庚日干天乙贵人在丑、未', () => {
      expect(TIAN_YI_GUI_REN['庚']).toEqual(['丑', '未']);
    });

    it('辛日干天乙贵人在午、寅', () => {
      expect(TIAN_YI_GUI_REN['辛']).toEqual(['午', '寅']);
    });

    it('壬癸日干天乙贵人在卯、巳', () => {
      expect(TIAN_YI_GUI_REN['壬']).toEqual(['卯', '巳']);
      expect(TIAN_YI_GUI_REN['癸']).toEqual(['卯', '巳']);
    });

    it('每个天干应有2个天乙贵人文', () => {
      for (const stem of HEAVENLY_STEMS) {
        expect(TIAN_YI_GUI_REN[stem]).toHaveLength(2);
      }
    });

    it('calculateShenSha：日干甲，地支丑/未应标天乙贵人', () => {
      const fp = mockFourPillars('甲', '寅', '丙', '午', '甲', '丑', '庚', '未');
      const ss = calculateShenSha(fp, '男');
      expect(ss.day).toContain('天乙贵人');
      expect(ss.hour).toContain('天乙贵人');
    });
  });

  // ============================================================
  // 规则#20：文昌起法（日干查）
  // ============================================================
  describe('文昌起法（日干查）', () => {
    it('甲日干文昌在巳', () => {
      expect(WEN_CHANG['甲']).toBe('巳');
    });

    it('乙日干文昌在午', () => {
      expect(WEN_CHANG['乙']).toBe('午');
    });

    it('丙戊日干文昌在申', () => {
      expect(WEN_CHANG['丙']).toBe('申');
      expect(WEN_CHANG['戊']).toBe('申');
    });

    it('丁己日干文昌在酉', () => {
      expect(WEN_CHANG['丁']).toBe('酉');
      expect(WEN_CHANG['己']).toBe('酉');
    });

    it('庚日干文昌在亥', () => {
      expect(WEN_CHANG['庚']).toBe('亥');
    });

    it('辛日干文昌在子', () => {
      expect(WEN_CHANG['辛']).toBe('子');
    });

    it('壬日干文昌在寅', () => {
      expect(WEN_CHANG['壬']).toBe('寅');
    });

    it('癸日干文昌在卯', () => {
      expect(WEN_CHANG['癸']).toBe('卯');
    });

    it('calculateShenSha：日干甲，地支巳应标文昌贵人', () => {
      const fp = mockFourPillars('甲', '子', '丙', '寅', '甲', '辰', '庚', '巳');
      const ss = calculateShenSha(fp, '男');
      expect(ss.hour).toContain('文昌贵人');
    });
  });

  // ============================================================
  // 规则#20：华盖起法（年支查，三合局）
  // ============================================================
  describe('华盖起法（年支查）', () => {
    it('寅午戌年支华盖在戌', () => {
      expect(HUA_GAI['寅午戌']).toBe('戌');
    });

    it('申子辰年支华盖在辰', () => {
      expect(HUA_GAI['申子辰']).toBe('辰');
    });

    it('巳酉丑年支华盖在丑', () => {
      expect(HUA_GAI['巳酉丑']).toBe('丑');
    });

    it('亥卯未年支华盖在未', () => {
      expect(HUA_GAI['亥卯未']).toBe('未');
    });

    it('calculateShenSha：年支子（申子辰组），地支辰应标华盖', () => {
      // 甲子年 戊辰日
      const fp = mockFourPillars('甲', '子', '丙', '寅', '戊', '辰', '庚', '申');
      const ss = calculateShenSha(fp, '男');
      expect(ss.day).toContain('华盖');
    });

    it('paipan 集成：1984（甲子年）日柱辰应有华盖', () => {
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      expect(chart.fourPillars.day.branch).toBe('辰');
      expect(chart.shenSha.day).toContain('华盖');
    });
  });

  // ============================================================
  // 规则#20：驿马起法（年支查）
  // ============================================================
  describe('驿马起法（年支查）', () => {
    it('寅午戌年支驿马在申', () => {
      expect(YI_MA['寅午戌']).toBe('申');
    });

    it('申子辰年支驿马在寅', () => {
      expect(YI_MA['申子辰']).toBe('寅');
    });

    it('巳酉丑年支驿马在亥', () => {
      expect(YI_MA['巳酉丑']).toBe('亥');
    });

    it('亥卯未年支驿马在巳', () => {
      expect(YI_MA['亥卯未']).toBe('巳');
    });

    it('calculateShenSha：年支子（申子辰组），地支寅应标驿马', () => {
      const fp = mockFourPillars('甲', '子', '丙', '寅', '戊', '辰', '庚', '申');
      const ss = calculateShenSha(fp, '男');
      expect(ss.month).toContain('驿马');
    });

    it('paipan 集成：1984（甲子年）月柱寅应有驿马', () => {
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      expect(chart.fourPillars.month.branch).toBe('寅');
      expect(chart.shenSha.month).toContain('驿马');
    });
  });

  // ============================================================
  // 规则#20：桃花起法（年支查）
  // ============================================================
  describe('桃花起法（年支查）', () => {
    it('寅午戌年支桃花在卯', () => {
      expect(TAO_HUA['寅午戌']).toBe('卯');
    });

    it('申子辰年支桃花在酉', () => {
      expect(TAO_HUA['申子辰']).toBe('酉');
    });

    it('巳酉丑年支桃花在午', () => {
      expect(TAO_HUA['巳酉丑']).toBe('午');
    });

    it('亥卯未年支桃花在子', () => {
      expect(TAO_HUA['亥卯未']).toBe('子');
    });

    it('calculateShenSha：年支子（申子辰组），地支酉应标桃花', () => {
      const fp = mockFourPillars('甲', '子', '丙', '寅', '戊', '辰', '庚', '酉');
      const ss = calculateShenSha(fp, '男');
      expect(ss.hour).toContain('桃花');
    });
  });

  // ============================================================
  // 规则#21：空亡（日柱查旬空）
  // ============================================================
  describe('空亡（日柱查旬空）', () => {
    it('KONG_WANG 表应包含六甲旬首', () => {
      expect(Object.keys(KONG_WANG)).toEqual(
        expect.arrayContaining(['甲子', '甲戌', '甲申', '甲午', '甲辰', '甲寅']),
      );
    });

    it('甲子旬空亡为戌、亥', () => {
      expect(KONG_WANG['甲子']).toEqual(['戌', '亥']);
    });

    it('甲戌旬空亡为申、酉', () => {
      expect(KONG_WANG['甲戌']).toEqual(['申', '酉']);
    });

    it('甲申旬空亡为午、未', () => {
      expect(KONG_WANG['甲申']).toEqual(['午', '未']);
    });

    it('甲午旬空亡为辰、巳', () => {
      expect(KONG_WANG['甲午']).toEqual(['辰', '巳']);
    });

    it('甲辰旬空亡为寅、卯', () => {
      expect(KONG_WANG['甲辰']).toEqual(['寅', '卯']);
    });

    it('甲寅旬空亡为子、丑', () => {
      expect(KONG_WANG['甲寅']).toEqual(['子', '丑']);
    });

    it('getKongWang(0) 甲子旬应为戌亥', () => {
      expect(getKongWang(0)).toEqual(['戌', '亥']);
    });

    it('getKongWang(10) 甲戌旬应为申酉', () => {
      expect(getKongWang(10)).toEqual(['申', '酉']);
    });

    it('每旬10柱共享同两个空亡地支', () => {
      // 甲子旬 idx 0-9, 甲戌旬 idx 10-19, ...
      for (let xun = 0; xun < 6; xun++) {
        const first = getKongWang(xun * 10);
        for (let i = 1; i < 10; i++) {
          expect(getKongWang(xun * 10 + i)).toEqual(first);
        }
      }
    });

    it('jiaZiIndex 戊辰(idx4)空亡应为戌亥', () => {
      const idx = jiaZiIndex('戊', '辰');
      expect(idx).toBe(4);
      expect(getKongWang(idx)).toEqual(['戌', '亥']);
    });

    it('jiaZiIndex 壬戌(idx58)空亡应为子丑', () => {
      const idx = jiaZiIndex('壬', '戌');
      expect(getKongWang(idx)).toEqual(['子', '丑']);
    });

    it('paipan 集成：1984-02-04 命例日柱戊辰空亡戌亥', () => {
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      expect(chart.fourPillars.day.ganzhi).toBe('戊辰');
      expect(chart.kongWang.day).toEqual(['戌', '亥']);
    });
  });

  // ============================================================
  // 规则#21：羊刃三体系
  // ============================================================
  describe('羊刃三体系', () => {
    it('禄前一位说：甲干羊刃在卯', () => {
      expect(YANG_REN_LU_QIAN['甲']).toBe('卯');
    });

    it('禄前一位说：丙戊干羊刃在午', () => {
      expect(YANG_REN_LU_QIAN['丙']).toBe('午');
      expect(YANG_REN_LU_QIAN['戊']).toBe('午');
    });

    it('禄前一位说：庚干羊刃在酉', () => {
      expect(YANG_REN_LU_QIAN['庚']).toBe('酉');
    });

    it('禄前一位说：壬干羊刃在子', () => {
      expect(YANG_REN_LU_QIAN['壬']).toBe('子');
    });

    it('禄前一位说：乙干羊刃在辰', () => {
      expect(YANG_REN_LU_QIAN['乙']).toBe('辰');
    });

    it('五阳干说：仅阳干有羊刃', () => {
      expect(YANG_REN_YANG['甲']).toBe('卯');
      expect(YANG_REN_YANG['丙']).toBe('午');
      expect(YANG_REN_YANG['戊']).toBe('午');
      expect(YANG_REN_YANG['庚']).toBe('酉');
      expect(YANG_REN_YANG['壬']).toBe('子');
      // 阴干无定义
      expect(YANG_REN_YANG['乙']).toBeUndefined();
    });

    it('帝旺位说：甲干羊刃在卯（=帝旺位）', () => {
      expect(YANG_REN_DI_WANG['甲']).toBe('卯');
      expect(YANG_REN_DI_WANG['丙']).toBe('午');
      expect(YANG_REN_DI_WANG['庚']).toBe('酉');
      expect(YANG_REN_DI_WANG['壬']).toBe('子');
    });

    it('帝旺位说与五阳干说对阳干一致', () => {
      for (const stem of ['甲', '丙', '戊', '庚', '壬'] as Stem[]) {
        expect(YANG_REN_DI_WANG[stem]).toBe(YANG_REN_YANG[stem]);
      }
    });

    it('禄神位（LU_POSITION）：甲禄在寅', () => {
      expect(LU_POSITION['甲']).toBe('寅');
      expect(LU_POSITION['乙']).toBe('卯');
      expect(LU_POSITION['丙']).toBe('巳');
      expect(LU_POSITION['庚']).toBe('申');
      expect(LU_POSITION['壬']).toBe('亥');
    });

    it('羊刃=禄前一位（阳干）', () => {
      // 甲禄寅，禄前一位=卯
      for (const stem of ['甲', '丙', '戊', '庚', '壬'] as Stem[]) {
        const lu = LU_POSITION[stem];
        const yangRen = YANG_REN_LU_QIAN[stem];
        const luIdx = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'].indexOf(lu);
        const yrIdx = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'].indexOf(yangRen);
        expect((yrIdx - luIdx + 12) % 12).toBe(1);
      }
    });

    it('calculateShenSha：日干甲，地支卯应标羊刃（默认禄前一位说）', () => {
      const fp = mockFourPillars('甲', '寅', '丙', '卯', '甲', '辰', '庚', '午');
      const ss = calculateShenSha(fp, '男');
      expect(ss.month).toContain('羊刃');
    });

    it('paipan 集成：神煞结果应包含4柱', () => {
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      expect(chart.shenSha).toHaveProperty('year');
      expect(chart.shenSha).toHaveProperty('month');
      expect(chart.shenSha).toHaveProperty('day');
      expect(chart.shenSha).toHaveProperty('hour');
    });
  });
});
