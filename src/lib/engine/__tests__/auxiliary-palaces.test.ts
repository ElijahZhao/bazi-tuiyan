/**
 * 层5：辅助宫位（胎元 / 命宫 / 身宫） — 规则 #13-#15 测试
 *
 * 胎元：默认前三百日法（《三命通会》卷二）
 * 命宫：子上起正月逆数至生月，安时顺数至卯（逢卯安命宫）
 * 身宫：生月支加生日支，命顺身逆/命逆身顺（古今图书集成法）
 *
 * 来源：[项目大纲 规则#13-#15, 11.1, 11.15, 11.16]
 */

import { describe, it, expect } from 'vitest';
import {
  calcTaiYuan,
  calcTaiYuanSimple,
  calcMingGong,
  calcShenGong,
  calculateAuxiliaryPalaces,
} from '../auxiliary-palaces';
import { paipan, correctTime } from '../index';
import type { BirthInput } from '../types';

describe('规则#13-#15：辅助宫位（胎元/命宫/身宫）', () => {
  // ============================================================
  // 规则#13：胎元（前三百日法）
  // ============================================================
  describe('胎元（前三百日法）', () => {
    it('胎元应返回有效的干支柱', () => {
      const tc = correctTime(1984, 2, 4, 23, 30, 116.41);
      const taiYuan = calcTaiYuan(tc.trueSolarTime);
      expect(taiYuan.ganzhi).toBeDefined();
      expect(taiYuan.stem).toBeDefined();
      expect(taiYuan.branch).toBeDefined();
      expect(taiYuan.nayin).toBeDefined();
    });

    it('胎元应为出生日前推三百日的同干支日', () => {
      // 1984-02-04 前推300日 ≈ 1983-04-10，其日柱为戊辰
      const tc = correctTime(1984, 2, 4, 23, 30, 116.41);
      const taiYuan = calcTaiYuan(tc.trueSolarTime);
      expect(taiYuan.ganzhi).toBe('戊辰');
    });

    it('胎元简化法（月干进一位、月支进三位）应正确', () => {
      // 月柱丙寅 → 月干进一(丙→丁)、月支进三(寅→巳) → 丁巳
      const result = calcTaiYuanSimple('丙', '寅');
      expect(result.ganzhi).toBe('丁巳');
    });

    it('胎元简化法：月柱甲子 → 乙卯', () => {
      // 甲→乙（干进1），子→卯（支进3: 子0+3=3=卯）
      const result = calcTaiYuanSimple('甲', '子');
      expect(result.ganzhi).toBe('乙卯');
    });

    it('paipan 集成：1984-02-04 23:30 男 胎元=戊辰', () => {
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      expect(chart.taiYuan.ganzhi).toBe('戊辰');
    });
  });

  // ============================================================
  // 规则#14：命宫（子上起正月逆数至生月，安时顺数至卯）
  // ============================================================
  describe('命宫（逢卯安命宫）', () => {
    it('命宫应返回有效干支柱', () => {
      const result = calcMingGong('寅', '子', '甲');
      expect(result.ganzhi).toBeDefined();
      expect(result.branch).toBeDefined();
      expect(result.stem).toBeDefined();
    });

    it('命例1（月寅、时子、年甲）命宫应为丁卯', () => {
      // 月支寅(月序1)，时支子(索引0)
      // A = (1-1) % 12 = 0
      // offset = (3-0) % 12 = 3
      // 命宫支索引 = (0+3) % 12 = 3 → 卯
      // 甲年五虎遁卯月 → 丁
      const result = calcMingGong('寅', '子', '甲');
      expect(result.branch).toBe('卯');
      expect(result.ganzhi).toBe('丁卯');
    });

    it('命宫天干应使用年干五虎遁', () => {
      // 甲年命宫支卯 → 丁卯；庚年命宫支卯 → 己卯（乙庚五虎遁寅起戊，卯=己）
      const jia = calcMingGong('寅', '子', '甲');
      const geng = calcMingGong('寅', '子', '庚');
      expect(jia.ganzhi).toBe('丁卯');
      expect(geng.ganzhi).toBe('己卯');
    });

    it('不同时支命宫支应不同', () => {
      // 月寅，年甲，时支变化
      const ziHour = calcMingGong('寅', '子', '甲');     // 时子
      const chouHour = calcMingGong('寅', '丑', '甲');   // 时丑
      expect(ziHour.branch).not.toBe(chouHour.branch);
    });

    it('不同月支命宫支应不同', () => {
      // 时子，年甲，月支变化
      const yinMonth = calcMingGong('寅', '子', '甲');
      const maoMonth = calcMingGong('卯', '子', '甲');
      expect(yinMonth.branch).not.toBe(maoMonth.branch);
    });

    it('paipan 集成：1984-02-04 23:30 男 命宫=丁卯', () => {
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      expect(chart.mingGong.ganzhi).toBe('丁卯');
    });

    it('paipan 集成：辅助宫位应包含方法说明', () => {
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      // 命宫和身宫应已计算
      expect(chart.mingGong).toBeDefined();
      expect(chart.shenGong).toBeDefined();
    });
  });

  // ============================================================
  // 规则#15：身宫（生月支加生日支，命顺身逆/命逆身顺）
  // ============================================================
  describe('身宫（命顺身逆/命逆身顺）', () => {
    it('身宫应返回有效干支柱', () => {
      const result = calcShenGong('寅', '辰', '子', '甲', '男');
      expect(result.ganzhi).toBeDefined();
      expect(result.branch).toBeDefined();
      expect(result.stem).toBeDefined();
    });

    it('命例1（月寅、日辰、时子、年甲、男）身宫应为庚午', () => {
      // 甲年男 = 阳年男 = 命顺 → 身逆
      // monthIdx=2(寅), dayIdx=4(辰), hourIdx=0(子)
      // offset = (0-2) % 12 = 10
      // 命顺→身逆：身宫支 = (4-10+12) % 12 = 6 → 午
      // 甲年五虎遁午月 → 庚
      const result = calcShenGong('寅', '辰', '子', '甲', '男');
      expect(result.branch).toBe('午');
      expect(result.ganzhi).toBe('庚午');
    });

    it('命顺（阳年男）→ 身逆', () => {
      // 同命例，但性别为女 → 阳年女 = 命逆 → 身顺
      const male = calcShenGong('寅', '辰', '子', '甲', '男');   // 命顺身逆
      const female = calcShenGong('寅', '辰', '子', '甲', '女'); // 命逆身顺
      // 命顺身逆：身宫支 = (dayIdx - offset) % 12 = (4-10+12)%12 = 6 → 午
      expect(male.branch).toBe('午');
      // 命逆身顺：身宫支 = (dayIdx + offset) % 12 = (4+10)%12 = 2 → 寅
      expect(female.branch).toBe('寅');
    });

    it('命逆（阴年男）→ 身顺', () => {
      // 乙年男 = 阴年男 = 命逆 → 身顺
      const result = calcShenGong('寅', '辰', '子', '乙', '男');
      // offset = (0-2+12)%12 = 10
      // 命逆身顺：身宫支 = (4+10)%12 = 2 → 寅
      expect(result.branch).toBe('寅');
    });

    it('阴年女（命顺）→ 身逆', () => {
      // 乙年女 = 阴年女 = 命顺 → 身逆
      const result = calcShenGong('寅', '辰', '子', '乙', '女');
      // 命顺身逆：身宫支 = (4-10+12)%12 = 6 → 午
      expect(result.branch).toBe('午');
    });

    it('身宫天干应使用年干五虎遁', () => {
      const jia = calcShenGong('寅', '辰', '子', '甲', '男');
      // 甲年午月 → 庚
      expect(jia.stem).toBe('庚');
    });

    it('paipan 集成：1984-02-04 23:30 男 身宫=庚午', () => {
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      expect(chart.shenGong.ganzhi).toBe('庚午');
    });

    it('paipan 集成：男女身宫应不同（命顺逆不同）', () => {
      const male = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      const female = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '女', longitude: 116.41 });
      // 甲年男命顺身逆，甲年女命逆身顺 → 身宫支不同
      expect(male.shenGong.branch).not.toBe(female.shenGong.branch);
    });
  });

  // ============================================================
  // 辅助宫位组装
  // ============================================================
  describe('辅助宫位组装（calculateAuxiliaryPalaces）', () => {
    it('应返回胎元、命宫、身宫三柱', () => {
      const input: BirthInput = {
        year: 1984, month: 2, day: 4, hour: 23, minute: 30,
        gender: '男', longitude: 116.41,
      };
      const tc = correctTime(input.year, input.month, input.day, input.hour, input.minute, input.longitude);
      const chart = paipan(input);
      const auxiliary = calculateAuxiliaryPalaces(tc.trueSolarTime, chart.fourPillars, { gender: '男' });
      expect(auxiliary.taiYuan).toBeDefined();
      expect(auxiliary.mingGong).toBeDefined();
      expect(auxiliary.shenGong).toBeDefined();
      expect(auxiliary.taiYuanMethod).toBeDefined();
      expect(auxiliary.shenGongMethod).toBeDefined();
    });

    it('胎元方法说明应标注前三百日法', () => {
      const input: BirthInput = {
        year: 1984, month: 2, day: 4, hour: 23, minute: 30,
        gender: '男', longitude: 116.41,
      };
      const tc = correctTime(input.year, input.month, input.day, input.hour, input.minute, input.longitude);
      const chart = paipan(input);
      const auxiliary = calculateAuxiliaryPalaces(tc.trueSolarTime, chart.fourPillars, { gender: '男' });
      expect(auxiliary.taiYuanMethod).toContain('三百日');
    });

    it('身宫方法说明应标注古今图书集成法', () => {
      const input: BirthInput = {
        year: 1984, month: 2, day: 4, hour: 23, minute: 30,
        gender: '男', longitude: 116.41,
      };
      const tc = correctTime(input.year, input.month, input.day, input.hour, input.minute, input.longitude);
      const chart = paipan(input);
      const auxiliary = calculateAuxiliaryPalaces(tc.trueSolarTime, chart.fourPillars, { gender: '男' });
      expect(auxiliary.shenGongMethod).toContain('古今图书集成');
    });
  });
});
