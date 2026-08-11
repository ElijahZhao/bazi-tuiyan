/**
 * 层1：时间校正 — 规则 #1-#4 测试
 *
 * 真太阳时校正顺序：钟表时间 → 夏令时还原 → 经度差修正 → 均时差修正
 *
 * 来源：[项目大纲 规则#1-#4, 11.10]
 */

import { describe, it, expect } from 'vitest';
import {
  correctTime,
  isDST,
  restoreDST,
  adjustLongitude,
  getEquationOfTime,
  adjustEquationOfTime,
} from '../time-correction';
import { DST_PERIODS, CITY_LONGITUDES } from '../constants';
import { paipan } from '../index';
import type { BirthInput } from '../types';

describe('规则#1-#4：时间校正', () => {
  // ============================================================
  // 规则#1-#4：校正顺序
  // ============================================================
  describe('真太阳时校正顺序（钟表→夏令时→经度→均时差）', () => {
    it('correctTime 应返回四个阶段的 Date 对象', () => {
      const tc = correctTime(2000, 6, 15, 12, 0, 116.41);
      expect(tc.clockTime).toBeInstanceOf(Date);
      expect(tc.dstAdjusted).toBeInstanceOf(Date);
      expect(tc.longitudeAdjusted).toBeInstanceOf(Date);
      expect(tc.trueSolarTime).toBeInstanceOf(Date);
    });

    it('钟表时间应等于用户输入时间', () => {
      const tc = correctTime(2000, 6, 15, 12, 0, 116.41);
      expect(tc.clockTime.getFullYear()).toBe(2000);
      expect(tc.clockTime.getMonth()).toBe(5); // 0-indexed
      expect(tc.clockTime.getDate()).toBe(15);
      expect(tc.clockTime.getHours()).toBe(12);
      expect(tc.clockTime.getMinutes()).toBe(0);
    });

    it('非夏令时期间：夏令时还原后时间应等于钟表时间', () => {
      const tc = correctTime(2000, 6, 15, 12, 0, 116.41);
      expect(tc.dstApplied).toBe(false);
      expect(tc.dstAdjusted.getTime()).toBe(tc.clockTime.getTime());
    });

    it('经度差修正应在夏令时还原之后进行', () => {
      // 1988-08-08 08:00 北京（夏令时期间）
      const tc = correctTime(1988, 8, 8, 8, 0, 116.41);
      // dstAdjusted = 08:00 - 1h = 07:00
      expect(tc.dstAdjusted.getHours()).toBe(7);
      // longitudeAdjusted = dstAdjusted + 经度差
      // 北京经度差 = 4*(116.41-120) = -14.36 分钟
      const expectedLon = tc.dstAdjusted.getTime() + tc.longitudeDiff * 60 * 1000;
      expect(tc.longitudeAdjusted.getTime()).toBeCloseTo(expectedLon, -2);
    });

    it('真太阳时应在经度差修正之后再加均时差', () => {
      const tc = correctTime(2000, 6, 15, 12, 0, 121.47);
      const expectedTrue = tc.longitudeAdjusted.getTime() + tc.equationOfTime * 60 * 1000;
      expect(tc.trueSolarTime.getTime()).toBeCloseTo(expectedTrue, -2);
    });

    it('isDST 与 dstApplied 应一致', () => {
      const tcDST = correctTime(1988, 8, 8, 8, 0, 116.41);
      expect(tcDST.isDST).toBe(tcDST.dstApplied);
      const tcNormal = correctTime(2000, 6, 15, 12, 0, 116.41);
      expect(tcNormal.isDST).toBe(tcNormal.dstApplied);
    });
  });

  // ============================================================
  // 规则#2：夏令时还原（1986-1991）
  // ============================================================
  describe('夏令时还原（1986-1991年夏季日期应检测到DST）', () => {
    it('1988年8月8日（夏令时期间内）应检测到DST', () => {
      expect(isDST(new Date(1988, 7, 8, 8, 0))).toBe(true);
    });

    it('1986年5月4日（夏令时开始日）应检测到DST', () => {
      // 1986年夏令时 5月4日起
      expect(isDST(new Date(1986, 4, 4, 12, 0))).toBe(true);
    });

    it('1985年6月15日（夏令时实施前）不应检测到DST', () => {
      expect(isDST(new Date(1985, 5, 15, 12, 0))).toBe(false);
    });

    it('1992年及以后不应有夏令时', () => {
      expect(isDST(new Date(1992, 6, 15, 12, 0))).toBe(false);
      expect(isDST(new Date(2000, 6, 15, 12, 0))).toBe(false);
    });

    it('夏令时期间各年份均应被检测', () => {
      // 1986-1991 每年取一个夏季日期
      for (const year of [1986, 1987, 1988, 1989, 1990, 1991]) {
        expect(isDST(new Date(year, 6, 15, 12, 0))).toBe(true);
      }
    });

    it('冬令时月份不应检测到DST', () => {
      // 1988年1月（冬季）不在夏令时期间
      expect(isDST(new Date(1988, 0, 15, 12, 0))).toBe(false);
      // 1988年12月（冬季）
      expect(isDST(new Date(1988, 11, 15, 12, 0))).toBe(false);
    });

    it('restoreDST 应将钟表时间减去1小时', () => {
      const result = restoreDST(new Date(1988, 7, 8, 8, 0));
      expect(result.applied).toBe(true);
      expect(result.adjusted.getHours()).toBe(7);
    });

    it('非夏令时期间 restoreDST 应原样返回', () => {
      const result = restoreDST(new Date(2000, 5, 15, 12, 0));
      expect(result.applied).toBe(false);
      expect(result.adjusted.getTime()).toBe(new Date(2000, 5, 15, 12, 0).getTime());
    });

    it('DST_PERIODS 应包含1986-1991共6年', () => {
      const years = DST_PERIODS.map(p => p.year);
      expect(years).toEqual([1986, 1987, 1988, 1989, 1990, 1991]);
    });

    it('paipan 集成：1988-08-08 北京 应标记夏令时', () => {
      const input: BirthInput = {
        year: 1988, month: 8, day: 8, hour: 8, minute: 0,
        gender: '男', longitude: 116.41, birthPlace: '北京',
      };
      const chart = paipan(input);
      expect(chart.timeCorrection.isDST).toBe(true);
      expect(chart.timeCorrection.dstOffset).toBe(60);
    });
  });

  // ============================================================
  // 规则#3：经度差修正
  // ============================================================
  describe('经度差修正（上海121.47° vs 北京116.41°应有不同修正值）', () => {
    it('上海(121.47°)经度差应为正值（东经>120°）', () => {
      const result = adjustLongitude(new Date(2000, 5, 15, 12, 0), 121.47);
      expect(result.diffMinutes).toBeGreaterThan(0);
      // 4 × (121.47 - 120) = 4 × 1.47 = 5.88
      expect(result.diffMinutes).toBeCloseTo(5.88, 1);
    });

    it('北京(116.41°)经度差应为负值（东经<120°）', () => {
      const result = adjustLongitude(new Date(2000, 5, 15, 12, 0), 116.41);
      expect(result.diffMinutes).toBeLessThan(0);
      // 4 × (116.41 - 120) = 4 × -3.59 = -14.36
      expect(result.diffMinutes).toBeCloseTo(-14.36, 1);
    });

    it('120°经度处经度差应为0', () => {
      const result = adjustLongitude(new Date(2000, 5, 15, 12, 0), 120);
      expect(result.diffMinutes).toBeCloseTo(0, 5);
    });

    it('上海与北京经度差之差应等于4×经度差', () => {
      const sh = adjustLongitude(new Date(2000, 5, 15, 12, 0), 121.47);
      const bj = adjustLongitude(new Date(2000, 5, 15, 12, 0), 116.41);
      const diff = sh.diffMinutes - bj.diffMinutes;
      // 4 × (121.47 - 116.41) = 4 × 5.06 = 20.24
      expect(diff).toBeCloseTo(20.24, 1);
    });

    it('经度差修正应使时间前移或后移', () => {
      const base = new Date(2000, 5, 15, 12, 0);
      const sh = adjustLongitude(base, 121.47);
      // 东经>120°：时间应增加（后移）
      expect(sh.adjusted.getTime()).toBeGreaterThan(base.getTime());
      const bj = adjustLongitude(base, 116.41);
      // 东经<120°：时间应减少（前移）
      expect(bj.adjusted.getTime()).toBeLessThan(base.getTime());
    });

    it('CITY_LONGITUDES 应包含主要城市', () => {
      expect(CITY_LONGITUDES['北京']).toBe(116.41);
      expect(CITY_LONGITUDES['上海']).toBe(121.47);
      expect(CITY_LONGITUDES['广州']).toBe(113.23);
    });

    it('paipan 集成：不同经度应产生不同的真太阳时', () => {
      const tcSH = correctTime(2000, 6, 15, 12, 0, 121.47);
      const tcBJ = correctTime(2000, 6, 15, 12, 0, 116.41);
      // 上海真太阳时应晚于北京（因上海更东，真太阳时更晚）
      expect(tcSH.trueSolarTime.getTime()).not.toBe(tcBJ.trueSolarTime.getTime());
      expect(tcSH.longitudeDiff).toBeGreaterThan(tcBJ.longitudeDiff);
    });
  });

  // ============================================================
  // 规则#1：均时差
  // ============================================================
  describe('均时差范围验证（+16分33秒至-14分06秒）', () => {
    // 引擎采用 Spencer 1971 简化公式，精度约±1.5分钟
    // 理论均时差范围：+16分33秒(≈16.55分) 至 -14分06秒(≈-14.10分)

    it('getEquationOfTime 应返回数值（分钟）', () => {
      const eot = getEquationOfTime(new Date(2000, 5, 21, 12, 0));
      expect(typeof eot).toBe('number');
      expect(Number.isFinite(eot)).toBe(true);
    });

    it('全年均时差应处于理论范围附近（含公式近似误差）', () => {
      const samples: number[] = [];
      for (let m = 0; m < 12; m++) {
        for (let d = 1; d <= 28; d += 3) {
          samples.push(getEquationOfTime(new Date(2020, m, d, 12, 0)));
        }
      }
      const min = Math.min(...samples);
      const max = Math.max(...samples);
      // 理论 [-14.10, +16.55]，含 Spencer 简化公式 ~±1.5min 误差，放宽为 [-16, +18]
      expect(min).toBeGreaterThanOrEqual(-16);
      expect(max).toBeLessThanOrEqual(18);
    });

    it('均时差年变化幅度应显著（理论约30分39秒）', () => {
      const samples: number[] = [];
      for (let m = 0; m < 12; m++) {
        for (let d = 1; d <= 28; d += 3) {
          samples.push(getEquationOfTime(new Date(2020, m, d, 12, 0)));
        }
      }
      const range = Math.max(...samples) - Math.min(...samples);
      // 理论跨度 ≈ 16.55 - (-14.10) = 30.65 分钟
      expect(range).toBeGreaterThan(30);
    });

    it('均时差应跨越正负值', () => {
      const samples: number[] = [];
      for (let m = 0; m < 12; m++) {
        samples.push(getEquationOfTime(new Date(2020, m, 15, 12, 0)));
      }
      const hasPositive = samples.some(v => v > 0);
      const hasNegative = samples.some(v => v < 0);
      expect(hasPositive).toBe(true);
      expect(hasNegative).toBe(true);
    });

    it('adjustEquationOfTime 应在原时间上叠加均时差', () => {
      const base = new Date(2000, 5, 21, 12, 0);
      const result = adjustEquationOfTime(base);
      const expected = base.getTime() + result.eotMinutes * 60 * 1000;
      expect(result.adjusted.getTime()).toBeCloseTo(expected, -2);
    });

    it('paipan 集成：时间校正结果应包含均时差字段', () => {
      const input: BirthInput = {
        year: 2000, month: 6, day: 15, hour: 12, minute: 0,
        gender: '男', longitude: 121.47,
      };
      const chart = paipan(input);
      expect(typeof chart.timeCorrection.equationOfTime).toBe('number');
      expect(Number.isFinite(chart.timeCorrection.equationOfTime)).toBe(true);
    });
  });
});
