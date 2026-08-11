/**
 * 层1：时间校正 — 规则 #1-#4 测试
 *
 * 真太阳时校正顺序：钟表时间 → 夏令时还原 → 时区→UTC → 经度差修正 → 均时差修正
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
import { DST_PERIODS, CITY_LONGITUDES, CITIES } from '../constants';
import { paipan } from '../index';
import type { BirthInput } from '../types';

describe('规则#1-#4：时间校正', () => {
  // ============================================================
  // 规则#1-#4：校正顺序
  // ============================================================
  describe('真太阳时校正顺序（钟表→夏令时→时区→经度→均时差）', () => {
    it('correctTime 应返回各阶段的 Date 对象', () => {
      const tc = correctTime(2000, 6, 15, 12, 0, 116.41);
      expect(tc.clockTime).toBeInstanceOf(Date);
      expect(tc.dstAdjusted).toBeInstanceOf(Date);
      expect(tc.longitudeAdjusted).toBeInstanceOf(Date);
      expect(tc.trueSolarTime).toBeInstanceOf(Date);
    });

    it('钟表时间应等于用户输入时间（UTC 方法）', () => {
      const tc = correctTime(2000, 6, 15, 12, 0, 116.41);
      expect(tc.clockTime.getUTCFullYear()).toBe(2000);
      expect(tc.clockTime.getUTCMonth()).toBe(5); // 0-indexed
      expect(tc.clockTime.getUTCDate()).toBe(15);
      expect(tc.clockTime.getUTCHours()).toBe(12);
      expect(tc.clockTime.getUTCMinutes()).toBe(0);
    });

    it('非夏令时期间：夏令时还原后时间应等于钟表时间', () => {
      const tc = correctTime(2000, 6, 15, 12, 0, 116.41);
      expect(tc.dstApplied).toBe(false);
      expect(tc.dstAdjusted.getTime()).toBe(tc.clockTime.getTime());
    });

    it('经度差修正应在夏令时还原之后进行（保持本地时间表示）', () => {
      // 1988-08-08 08:00 北京（夏令时期间）
      const tc = correctTime(1988, 8, 8, 8, 0, 116.41);
      // dstAdjusted = 08:00 - 1h = 07:00（本地时间存为UTC）
      expect(tc.dstAdjusted.getUTCHours()).toBe(7);
      // 经度差 = 4*(116.41 - 120) = -14.36 分钟
      // longitudeAdjusted = dstMs + longitudeDiff（不做时区→UTC转换，保持本地时间线）
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

    it('应包含 timezone 字段', () => {
      const tc = correctTime(2000, 6, 15, 12, 0, 116.41);
      expect(tc.timezone).toBe(8);
      const tcNY = correctTime(2000, 6, 15, 12, 0, -74.01, -5);
      expect(tcNY.timezone).toBe(-5);
    });
  });

  // ============================================================
  // 规则#2：夏令时还原（1986-1991）
  // ============================================================
  describe('夏令时还原（1986-1991年夏季日期应检测到DST）', () => {
    it('1988年8月8日（夏令时期间内）应检测到DST', () => {
      expect(isDST(1988, 8, 8, 8)).toBe(true);
    });

    it('1986年5月4日（夏令时开始日）应检测到DST', () => {
      expect(isDST(1986, 5, 4, 12)).toBe(true);
    });

    it('1985年6月15日（夏令时实施前）不应检测到DST', () => {
      expect(isDST(1985, 6, 15, 12)).toBe(false);
    });

    it('1992年及以后不应有夏令时', () => {
      expect(isDST(1992, 7, 15, 12)).toBe(false);
      expect(isDST(2000, 7, 15, 12)).toBe(false);
    });

    it('夏令时期间各年份均应被检测', () => {
      for (const year of [1986, 1987, 1988, 1989, 1990, 1991]) {
        expect(isDST(year, 7, 15, 12)).toBe(true);
      }
    });

    it('冬令时月份不应检测到DST', () => {
      expect(isDST(1988, 1, 15, 12)).toBe(false);
      expect(isDST(1988, 12, 15, 12)).toBe(false);
    });

    it('restoreDST 应将钟表时间减去1小时', () => {
      const result = restoreDST(1988, 8, 8, 8, 0, 8);
      expect(result.applied).toBe(true);
      const adjusted = new Date(result.adjustedMs);
      expect(adjusted.getUTCHours()).toBe(7);
    });

    it('非夏令时期间 restoreDST 应原样返回', () => {
      const result = restoreDST(2000, 6, 15, 12, 0, 8);
      expect(result.applied).toBe(false);
      const original = Date.UTC(2000, 5, 15, 12, 0, 0);
      expect(result.adjustedMs).toBe(original);
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
      const baseMs = Date.UTC(2000, 5, 15, 12, 0, 0);
      const result = adjustLongitude(baseMs, 121.47, 8);
      expect(result.diffMinutes).toBeGreaterThan(0);
      // 4 × (121.47 - 120) = 4 × 1.47 = 5.88
      expect(result.diffMinutes).toBeCloseTo(5.88, 1);
    });

    it('北京(116.41°)经度差应为负值（东经<120°）', () => {
      const baseMs = Date.UTC(2000, 5, 15, 12, 0, 0);
      const result = adjustLongitude(baseMs, 116.41, 8);
      expect(result.diffMinutes).toBeLessThan(0);
      // 4 × (116.41 - 120) = 4 × -3.59 = -14.36
      expect(result.diffMinutes).toBeCloseTo(-14.36, 1);
    });

    it('120°经度处经度差应为0（北京时间标准子午线）', () => {
      const baseMs = Date.UTC(2000, 5, 15, 12, 0, 0);
      const result = adjustLongitude(baseMs, 120, 8);
      expect(result.diffMinutes).toBeCloseTo(0, 5);
    });

    it('上海与北京经度差之差应等于4×经度差', () => {
      const baseMs = Date.UTC(2000, 5, 15, 12, 0, 0);
      const sh = adjustLongitude(baseMs, 121.47, 8);
      const bj = adjustLongitude(baseMs, 116.41, 8);
      const diff = sh.diffMinutes - bj.diffMinutes;
      // 4 × (121.47 - 116.41) = 4 × 5.06 = 20.24
      expect(diff).toBeCloseTo(20.24, 1);
    });

    it('经度差修正应使时间前移或后移', () => {
      const baseMs = Date.UTC(2000, 5, 15, 12, 0, 0);
      const sh = adjustLongitude(baseMs, 121.47, 8);
      // 东经>120°：时间应增加（后移）
      expect(sh.adjustedMs).toBeGreaterThan(baseMs);
      const bj = adjustLongitude(baseMs, 116.41, 8);
      // 东经<120°：时间应减少（前移）
      expect(bj.adjustedMs).toBeLessThan(baseMs);
    });

    it('CITY_LONGITUDES 应包含主要城市', () => {
      expect(CITY_LONGITUDES['北京']).toBe(116.41);
      expect(CITY_LONGITUDES['上海']).toBe(121.47);
      expect(CITY_LONGITUDES['广州']).toBe(113.23);
    });

    it('CITIES 应包含国际城市和时区信息', () => {
      expect(CITIES['北京'].longitude).toBe(116.41);
      expect(CITIES['北京'].timezone).toBe(8);
      expect(CITIES['纽约'].longitude).toBe(-74.01);
      expect(CITIES['纽约'].timezone).toBe(-5);
      expect(CITIES['伦敦'].timezone).toBe(0);
      expect(CITIES['东京'].timezone).toBe(9);
    });

    it('paipan 集成：不同经度应产生不同的真太阳时', () => {
      const tcSH = correctTime(2000, 6, 15, 12, 0, 121.47);
      const tcBJ = correctTime(2000, 6, 15, 12, 0, 116.41);
      expect(tcSH.trueSolarTime.getTime()).not.toBe(tcBJ.trueSolarTime.getTime());
      expect(tcSH.longitudeDiff).toBeGreaterThan(tcBJ.longitudeDiff);
    });

    it('国际城市：纽约(UTC-5)经度差应相对于75°W计算', () => {
      const baseMs = Date.UTC(2000, 5, 15, 12, 0, 0);
      const result = adjustLongitude(baseMs, -74.01, -5);
      // 标准子午线 = -5 × 15 = -75°
      // 4 × (-74.01 - (-75)) = 4 × 0.99 = 3.96
      expect(result.diffMinutes).toBeCloseTo(3.96, 1);
      expect(result.diffMinutes).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // 规则#1：均时差
  // ============================================================
  describe('均时差范围验证（+16分33秒至-14分06秒）', () => {
    it('getEquationOfTime 应返回数值（分钟）', () => {
      const eot = getEquationOfTime(Date.UTC(2000, 5, 21, 12, 0, 0));
      expect(typeof eot).toBe('number');
      expect(Number.isFinite(eot)).toBe(true);
    });

    it('全年均时差应处于理论范围附近（含公式近似误差）', () => {
      const samples: number[] = [];
      for (let m = 0; m < 12; m++) {
        for (let d = 1; d <= 28; d += 3) {
          samples.push(getEquationOfTime(Date.UTC(2020, m, d, 12, 0, 0)));
        }
      }
      const min = Math.min(...samples);
      const max = Math.max(...samples);
      expect(min).toBeGreaterThanOrEqual(-16);
      expect(max).toBeLessThanOrEqual(18);
    });

    it('均时差年变化幅度应显著（理论约30分39秒）', () => {
      const samples: number[] = [];
      for (let m = 0; m < 12; m++) {
        for (let d = 1; d <= 28; d += 3) {
          samples.push(getEquationOfTime(Date.UTC(2020, m, d, 12, 0, 0)));
        }
      }
      const range = Math.max(...samples) - Math.min(...samples);
      expect(range).toBeGreaterThan(30);
    });

    it('均时差应跨越正负值', () => {
      const samples: number[] = [];
      for (let m = 0; m < 12; m++) {
        samples.push(getEquationOfTime(Date.UTC(2020, m, 15, 12, 0, 0)));
      }
      const hasPositive = samples.some(v => v > 0);
      const hasNegative = samples.some(v => v < 0);
      expect(hasPositive).toBe(true);
      expect(hasNegative).toBe(true);
    });

    it('adjustEquationOfTime 应在原时间上叠加均时差', () => {
      const baseMs = Date.UTC(2000, 5, 21, 12, 0, 0);
      const result = adjustEquationOfTime(baseMs);
      const expected = baseMs + result.eotMinutes * 60 * 1000;
      expect(result.adjustedMs).toBeCloseTo(expected, -2);
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

  // ============================================================
  // 国际时区支持
  // ============================================================
  describe('国际时区支持', () => {
    it('纽约(UTC-5)排盘应与北京(UTC+8)产生不同结果', () => {
      const tcNY = correctTime(2000, 6, 15, 12, 0, -74.01, -5);
      const tcBJ = correctTime(2000, 6, 15, 12, 0, 116.41, 8);
      // 同一时刻输入，不同时区和经度，真太阳时应不同
      expect(tcNY.trueSolarTime.getTime()).not.toBe(tcBJ.trueSolarTime.getTime());
    });

    it('伦敦(UTC+0)排盘：经度差应相对于0°子午线计算', () => {
      const tc = correctTime(2000, 6, 15, 12, 0, -0.13, 0);
      // 标准子午线 = 0 × 15 = 0°
      // 4 × (-0.13 - 0) = -0.52 分钟
      expect(tc.longitudeDiff).toBeCloseTo(-0.52, 1);
    });

    it('东京(UTC+9)排盘：经度差应相对于135°E计算', () => {
      const tc = correctTime(2000, 6, 15, 12, 0, 139.69, 9);
      // 标准子午线 = 9 × 15 = 135°
      // 4 × (139.69 - 135) = 4 × 4.69 = 18.76 分钟
      expect(tc.longitudeDiff).toBeCloseTo(18.76, 1);
    });

    it('paipan 集成：纽约出生应正确排盘', () => {
      const input: BirthInput = {
        year: 2000, month: 6, day: 15, hour: 12, minute: 0,
        gender: '男', longitude: -74.01, birthPlace: '纽约',
        timezone: -5,
      };
      const chart = paipan(input);
      expect(chart.timeCorrection.timezone).toBe(-5);
      expect(chart.fourPillars).toBeDefined();
    });
  });
});
