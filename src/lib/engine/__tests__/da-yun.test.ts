/**
 * 层4：大运 / 流年 / 流月 / 流日 / 流时 / 小运 — 规则 #10-#12 测试
 *
 * 大运顺逆：阳年男顺/阴年男逆/阳年女逆/阴年女顺
 * 起运岁数：3天=1岁
 * 大运从月柱下一柱（顺）或上一柱（逆）开始
 * 流月以节为界，月干用流年干遁五虎遁
 * 流日取当日干支
 * 流时用五鼠遁（以流日干遁）
 * 小运以时柱为起点，虚岁一岁起运
 *
 * 来源：[项目大纲 规则#10-#12, 11.20]
 */

import { describe, it, expect } from 'vitest';
import {
  getDaYunDirection,
  calculateStartAge,
  calculateDaYun,
  calculateLiuNian,
  calculateXiaoYun,
  calculateLiuYue,
  calculateLiuRi,
  calculateLiuShi,
} from '../da-yun';
import { paipan, correctTime, calculateFourPillars } from '../index';
import { SIXTY_JIAZI, pillarFromIndex } from '../constants';
import type { BirthInput, Stem, Gender } from '../types';

describe('规则#10-#12：大运流年流月流日流时小运', () => {
  // ============================================================
  // 规则#10：大运顺逆
  // ============================================================
  describe('大运顺逆：阳年男顺/阴年男逆/阳年女逆/阴年女顺', () => {
    it('阳年男应顺排（甲年男）', () => {
      expect(getDaYunDirection('甲', '男')).toBe('顺');
    });

    it('阳年女应逆排（甲年女）', () => {
      expect(getDaYunDirection('甲', '女')).toBe('逆');
    });

    it('阴年男应逆排（乙年男）', () => {
      expect(getDaYunDirection('乙', '男')).toBe('逆');
    });

    it('阴年女应顺排（乙年女）', () => {
      expect(getDaYunDirection('乙', '女')).toBe('顺');
    });

    it('十干顺逆应正确（阳干男顺/阴干男逆）', () => {
      const yangStems: Stem[] = ['甲', '丙', '戊', '庚', '壬'];
      const yinStems: Stem[] = ['乙', '丁', '己', '辛', '癸'];
      for (const s of yangStems) {
        expect(getDaYunDirection(s, '男')).toBe('顺');
        expect(getDaYunDirection(s, '女')).toBe('逆');
      }
      for (const s of yinStems) {
        expect(getDaYunDirection(s, '男')).toBe('逆');
        expect(getDaYunDirection(s, '女')).toBe('顺');
      }
    });

    it('paipan 集成：1984（甲子年）男应顺排', () => {
      const chart = paipan({ year: 1984, month: 6, day: 15, hour: 12, minute: 0, gender: '男', longitude: 116.41 });
      expect(chart.daYun.direction).toBe('顺');
    });

    it('paipan 集成：1990（庚午年）女应逆排', () => {
      const chart = paipan({ year: 1990, month: 6, day: 15, hour: 10, minute: 30, gender: '女', longitude: 121.47 });
      expect(chart.daYun.direction).toBe('逆');
    });
  });

  // ============================================================
  // 规则#11：起运岁数计算（3天=1岁）
  // ============================================================
  describe('起运岁数计算（3天=1岁）', () => {
    it('起运岁数应为非负整数', () => {
      const tc = correctTime(1984, 6, 15, 12, 0, 116.41);
      const result = calculateStartAge(tc.trueSolarTime, '甲', '男');
      expect(result.startAge).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result.startAge)).toBe(true);
      expect(result.direction).toBe('顺');
    });

    it('paipan 集成：1984-02-04 23:30 男 起运9岁', () => {
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      expect(chart.daYun.startAge).toBe(9);
    });

    it('paipan 集成：1990-06-15 女 起运3岁', () => {
      const chart = paipan({ year: 1990, month: 6, day: 15, hour: 10, minute: 30, gender: '女', longitude: 121.47 });
      expect(chart.daYun.startAge).toBe(3);
    });

    it('起运信息应包含月日时余数', () => {
      const tc = correctTime(1984, 2, 4, 23, 30, 116.41);
      const result = calculateStartAge(tc.trueSolarTime, '甲', '男');
      expect(result).toHaveProperty('startMonth');
      expect(result).toHaveProperty('startDay');
      expect(result).toHaveProperty('startHour');
    });
  });

  // ============================================================
  // 规则#11：大运从月柱下一柱（顺）或上一柱（逆）开始
  // ============================================================
  describe('大运起柱：月柱下一柱（顺）或上一柱（逆）', () => {
    it('顺排：大运首柱应为月柱的下一柱', () => {
      // 1984-06-15 甲子年 庚午月（庚午=六十甲子索引6），顺排首柱=辛未（索引7）
      const chart = paipan({ year: 1984, month: 6, day: 15, hour: 12, minute: 0, gender: '男', longitude: 116.41 });
      expect(chart.fourPillars.month.ganzhi).toBe('庚午');
      expect(chart.daYun.direction).toBe('顺');
      expect(chart.daYun.steps[0].pillar.ganzhi).toBe('辛未');
    });

    it('顺排：大运各柱应依次递增', () => {
      const chart = paipan({ year: 1984, month: 6, day: 15, hour: 12, minute: 0, gender: '男', longitude: 116.41 });
      const monthIdx = SIXTY_JIAZI.findIndex(
        item => item.stem === chart.fourPillars.month.stem && item.branch === chart.fourPillars.month.branch,
      );
      for (let i = 0; i < chart.daYun.steps.length; i++) {
        const expectedIdx = (monthIdx + 1 + i) % 60;
        expect(chart.daYun.steps[i].pillar.ganzhi).toBe(pillarFromIndex(expectedIdx).ganzhi);
      }
    });

    it('逆排：大运首柱应为月柱的上一柱', () => {
      // 1990-06-15 庚午年 壬午月，逆排首柱=辛巳
      const chart = paipan({ year: 1990, month: 6, day: 15, hour: 10, minute: 30, gender: '女', longitude: 121.47 });
      expect(chart.fourPillars.month.ganzhi).toBe('壬午');
      expect(chart.daYun.direction).toBe('逆');
      expect(chart.daYun.steps[0].pillar.ganzhi).toBe('辛巳');
    });

    it('逆排：大运各柱应依次递减', () => {
      const chart = paipan({ year: 1990, month: 6, day: 15, hour: 10, minute: 30, gender: '女', longitude: 121.47 });
      const monthIdx = SIXTY_JIAZI.findIndex(
        item => item.stem === chart.fourPillars.month.stem && item.branch === chart.fourPillars.month.branch,
      );
      for (let i = 0; i < chart.daYun.steps.length; i++) {
        const expectedIdx = ((monthIdx - 1 - i) % 60 + 60) % 60;
        expect(chart.daYun.steps[i].pillar.ganzhi).toBe(pillarFromIndex(expectedIdx).ganzhi);
      }
    });

    it('大运应排8步', () => {
      const chart = paipan({ year: 1984, month: 6, day: 15, hour: 12, minute: 0, gender: '男', longitude: 116.41 });
      expect(chart.daYun.steps).toHaveLength(8);
    });

    it('大运起运岁数每步递增10岁', () => {
      const chart = paipan({ year: 1984, month: 6, day: 15, hour: 12, minute: 0, gender: '男', longitude: 116.41 });
      const baseAge = chart.daYun.startAge;
      for (let i = 0; i < chart.daYun.steps.length; i++) {
        expect(chart.daYun.steps[i].startAge).toBe(baseAge + i * 10);
      }
    });
  });

  // ============================================================
  // 规则#12：流月（以节为界，月干用流年干遁五虎遁）
  // ============================================================
  describe('流月（以节为界，月干用流年干遁五虎遁）', () => {
    it('流月应返回12个月', () => {
      const liuYue = calculateLiuYue(2024);
      expect(liuYue).toHaveLength(12);
    });

    it('2024年（甲辰年）寅月应为丙寅（甲年五虎遁寅月起丙）', () => {
      const liuYue = calculateLiuYue(2024);
      expect(liuYue[0].monthBranch).toBe('寅');
      expect(liuYue[0].pillar.ganzhi).toBe('丙寅');
    });

    it('2024年午月应为庚午', () => {
      const liuYue = calculateLiuYue(2024);
      const wuMonth = liuYue.find(m => m.monthBranch === '午');
      expect(wuMonth?.pillar.ganzhi).toBe('庚午');
    });

    it('流月月支顺序应为寅卯辰…丑', () => {
      const liuYue = calculateLiuYue(2024);
      const expected = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
      expect(liuYue.map(m => m.monthBranch)).toEqual(expected);
    });

    it('不同年干流月天干应不同（甲年vs乙年寅月）', () => {
      const liuYueJia = calculateLiuYue(2024); // 甲辰年
      const liuYueYi = calculateLiuYue(2025);  // 乙巳年
      // 甲年寅月=丙寅，乙年寅月=戊寅
      expect(liuYueJia[0].pillar.ganzhi).toBe('丙寅');
      expect(liuYueYi[0].pillar.ganzhi).toBe('戊寅');
    });
  });

  // ============================================================
  // 规则#12：流日（取当日干支）
  // ============================================================
  describe('流日（取当日干支）', () => {
    it('流日应返回日期字符串和干支', () => {
      const liuRi = calculateLiuRi(new Date(2024, 0, 1));
      expect(liuRi.date).toBe('2024-01-01');
      expect(liuRi.pillar.ganzhi).toBeDefined();
    });

    it('2024-01-01 流日应为甲子', () => {
      const liuRi = calculateLiuRi(new Date(2024, 0, 1));
      expect(liuRi.pillar.ganzhi).toBe('甲子');
    });

    it('相邻日期流日干支应递进', () => {
      const d1 = calculateLiuRi(new Date(2024, 0, 1));
      const d2 = calculateLiuRi(new Date(2024, 0, 2));
      // 甲子→乙丑
      expect(d1.pillar.ganzhi).toBe('甲子');
      expect(d2.pillar.ganzhi).toBe('乙丑');
    });
  });

  // ============================================================
  // 规则#12：流时（五鼠遁，以流日干遁）
  // ============================================================
  describe('流时（五鼠遁，以流日干遁）', () => {
    it('流时应返回12个时辰', () => {
      const liuShi = calculateLiuShi(new Date(2024, 0, 1));
      expect(liuShi).toHaveLength(12);
    });

    it('2024-01-01（甲子日）子时应为甲子', () => {
      const liuShi = calculateLiuShi(new Date(2024, 0, 1));
      expect(liuShi[0].hourBranch).toBe('子');
      expect(liuShi[0].pillar.ganzhi).toBe('甲子');
    });

    it('2024-01-01 丑时应为乙丑', () => {
      const liuShi = calculateLiuShi(new Date(2024, 0, 1));
      expect(liuShi[1].pillar.ganzhi).toBe('乙丑');
    });

    it('流时支顺序应为子丑寅…亥', () => {
      const liuShi = calculateLiuShi(new Date(2024, 0, 1));
      const expected = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
      expect(liuShi.map(s => s.hourBranch)).toEqual(expected);
    });

    it('甲子日各时辰天干应顺排（甲子乙丑丙寅…）', () => {
      const liuShi = calculateLiuShi(new Date(2024, 0, 1));
      const expected = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'];
      liuShi.forEach((s, i) => {
        expect(s.pillar.stem).toBe(expected[i]);
      });
    });
  });

  // ============================================================
  // 规则#12：小运（时柱为起点，虚岁一岁起运）
  // ============================================================
  describe('小运（以时柱为起点，虚岁一岁起运）', () => {
    it('小运首柱（虚岁1岁）应为时柱本身', () => {
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      expect(chart.xiaoYun[0].age).toBe(1);
      expect(chart.xiaoYun[0].pillar.ganzhi).toBe(chart.fourPillars.hour.ganzhi);
    });

    it('顺排小运各柱应从时柱依次递增', () => {
      // 1984 甲年男 顺排，时柱=甲子
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      expect(chart.fourPillars.hour.ganzhi).toBe('甲子');
      expect(chart.xiaoYun[0].pillar.ganzhi).toBe('甲子');
      expect(chart.xiaoYun[1].pillar.ganzhi).toBe('乙丑');
      expect(chart.xiaoYun[2].pillar.ganzhi).toBe('丙寅');
    });

    it('逆排小运各柱应从时柱依次递减', () => {
      // 1990 庚年女 逆排，时柱=癸巳
      const chart = paipan({ year: 1990, month: 6, day: 15, hour: 10, minute: 30, gender: '女', longitude: 121.47 });
      expect(chart.fourPillars.hour.ganzhi).toBe('癸巳');
      expect(chart.xiaoYun[0].pillar.ganzhi).toBe('癸巳');
      expect(chart.xiaoYun[1].pillar.ganzhi).toBe('壬辰');
    });

    it('小运虚岁应从1岁递增', () => {
      const chart = paipan({ year: 1984, month: 6, day: 15, hour: 12, minute: 0, gender: '男', longitude: 116.41 });
      for (let i = 0; i < chart.xiaoYun.length; i++) {
        expect(chart.xiaoYun[i].age).toBe(i + 1);
      }
    });

    it('小运方向应与大运方向一致', () => {
      const chartMale = paipan({ year: 1984, month: 6, day: 15, hour: 12, minute: 0, gender: '男', longitude: 116.41 });
      const chartFemale = paipan({ year: 1984, month: 6, day: 15, hour: 12, minute: 0, gender: '女', longitude: 116.41 });
      // 甲年男顺、甲年女逆
      const maleDir = getDaYunDirection('甲', '男');
      const femaleDir = getDaYunDirection('甲', '女');
      expect(chartMale.daYun.direction).toBe(maleDir);
      expect(chartFemale.daYun.direction).toBe(femaleDir);
      // 小运首柱=时柱，无论顺逆
      expect(chartMale.xiaoYun[0].pillar.ganzhi).toBe(chartMale.fourPillars.hour.ganzhi);
      expect(chartFemale.xiaoYun[0].pillar.ganzhi).toBe(chartFemale.fourPillars.hour.ganzhi);
    });
  });

  // ============================================================
  // 流年
  // ============================================================
  describe('流年', () => {
    it('流年应返回以当前年为中心的范围', () => {
      const liuNian = calculateLiuNian(2024, 2);
      expect(liuNian[0].year).toBe(2022);
      expect(liuNian[liuNian.length - 1].year).toBe(2026);
    });

    it('2024年流年应为甲辰', () => {
      const liuNian = calculateLiuNian(2024, 0);
      expect(liuNian[0].year).toBe(2024);
      expect(liuNian[0].pillar.stem).toBe('甲');
      expect(liuNian[0].pillar.branch).toBe('辰');
    });

    it('1984年流年应为甲子', () => {
      const liuNian = calculateLiuNian(1984, 0);
      expect(liuNian[0].pillar.ganzhi).toBe('甲子');
    });
  });
});
