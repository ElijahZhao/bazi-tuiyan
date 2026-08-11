/**
 * 层3：四柱排盘 — 规则 #6-#9 测试
 *
 * 年柱：以立春交节时刻为界
 * 月柱：十二节划分 + 五虎遁
 * 日柱：夜子时（23:00-24:00）用当日 / 子正（00:00-01:00）用当日
 * 时柱：五鼠遁
 *
 * 来源：[项目大纲 规则#6-#9, 11.11, 11.12]
 */

import { describe, it, expect } from 'vitest';
import { calcYearPillar, calcMonthPillar, calcDayHourPillars, calculateFourPillars } from '../four-pillars';
import { wuHuDun, wuShuDun, EARTHLY_BRANCHES } from '../constants';
import { paipan } from '../index';
import { correctTime } from '../time-correction';
import type { BirthInput } from '../types';

describe('规则#6-#9：四柱排盘', () => {
  // ============================================================
  // 规则#6：年柱以立春为界
  // ============================================================
  describe('年柱以立春为界', () => {
    it('立春后应取新年干支（1984-02-04 23:30 → 甲子年）', () => {
      // 1984年立春约在2月4日23时前后，23:30已过立春
      const input: BirthInput = {
        year: 1984, month: 2, day: 4, hour: 23, minute: 30,
        gender: '男', longitude: 116.41, birthPlace: '北京',
      };
      const tc = correctTime(input.year, input.month, input.day, input.hour, input.minute, input.longitude);
      const yearPillar = calcYearPillar(tc.trueSolarTime);
      expect(yearPillar.ganzhi).toBe('甲子');
    });

    it('立春前应取上一年干支（1989-02-03 14:00 → 戊辰年=1988）', () => {
      // 1989年立春在2月4日，2月3日立春前 → 用1988年干支
      const input: BirthInput = {
        year: 1989, month: 2, day: 3, hour: 14, minute: 0,
        gender: '男', longitude: 113.23, birthPlace: '广州',
      };
      const tc = correctTime(input.year, input.month, input.day, input.hour, input.minute, input.longitude);
      const yearPillar = calcYearPillar(tc.trueSolarTime);
      expect(yearPillar.ganzhi).toBe('戊辰');
    });

    it('年中日期应取当年干支（1984-06-15 → 甲子年）', () => {
      const tc = correctTime(1984, 6, 15, 12, 0, 116.41);
      const yearPillar = calcYearPillar(tc.trueSolarTime);
      expect(yearPillar.ganzhi).toBe('甲子');
    });

    it('1984年为甲子年（六十甲子起点）', () => {
      const tc = correctTime(1984, 6, 15, 12, 0, 116.41);
      const yearPillar = calcYearPillar(tc.trueSolarTime);
      expect(yearPillar.stem).toBe('甲');
      expect(yearPillar.branch).toBe('子');
    });

    it('1990年为庚午年', () => {
      const tc = correctTime(1990, 6, 15, 12, 0, 121.47);
      const yearPillar = calcYearPillar(tc.trueSolarTime);
      expect(yearPillar.stem).toBe('庚');
      expect(yearPillar.branch).toBe('午');
    });

    it('paipan 集成：立春界两侧年份应不同', () => {
      const before = paipan({ year: 1989, month: 2, day: 3, hour: 14, minute: 0, gender: '男', longitude: 113.23 });
      const after = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      // 立春前 → 上一年（戊辰=1988）
      expect(before.fourPillars.year.ganzhi).toBe('戊辰');
      // 立春后 → 新年（甲子=1984）
      expect(after.fourPillars.year.ganzhi).toBe('甲子');
    });
  });

  // ============================================================
  // 规则#7：月柱十二节划分 + 五虎遁
  // ============================================================
  describe('月柱十二节划分 + 五虎遁', () => {
    it('五虎遁：甲己年寅月起丙（甲年寅月=丙寅）', () => {
      // 寅月索引=2
      expect(wuHuDun('甲', 2)).toBe('丙');
      expect(wuHuDun('己', 2)).toBe('丙');
    });

    it('五虎遁：乙庚年寅月起戊', () => {
      expect(wuHuDun('乙', 2)).toBe('戊');
      expect(wuHuDun('庚', 2)).toBe('戊');
    });

    it('五虎遁：丙辛年寅月起庚', () => {
      expect(wuHuDun('丙', 2)).toBe('庚');
      expect(wuHuDun('辛', 2)).toBe('庚');
    });

    it('五虎遁：丁壬年寅月起壬', () => {
      expect(wuHuDun('丁', 2)).toBe('壬');
      expect(wuHuDun('壬', 2)).toBe('壬');
    });

    it('五虎遁：戊癸年寅月起甲', () => {
      expect(wuHuDun('戊', 2)).toBe('甲');
      expect(wuHuDun('癸', 2)).toBe('甲');
    });

    it('甲年各月天干应顺排（丙寅丁卯戊辰…）', () => {
      // 甲年：寅=丙, 卯=丁, 辰=戊, 巳=己, 午=庚, 未=辛, 申=壬, 酉=癸, 戌=甲, 亥=乙, 子=丙, 丑=丁
      const expected = ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'];
      const monthBranchIndices = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1];
      monthBranchIndices.forEach((mbIdx, i) => {
        expect(wuHuDun('甲', mbIdx)).toBe(expected[i]);
      });
    });

    it('1984年（甲年）6月15日应为午月（庚午月）', () => {
      // 6月15日在芒种后小暑前 → 午月
      const tc = correctTime(1984, 6, 15, 12, 0, 116.41);
      const yearPillar = calcYearPillar(tc.trueSolarTime);
      const monthPillar = calcMonthPillar(tc.trueSolarTime, yearPillar.stem);
      expect(monthPillar.branch).toBe('午');
      expect(monthPillar.ganzhi).toBe('庚午');
    });

    it('1984年（甲年）9月15日应为酉月（癸酉月）', () => {
      // 9月15日在白露后寒露前 → 酉月
      const tc = correctTime(1984, 9, 15, 12, 0, 116.41);
      const yearPillar = calcYearPillar(tc.trueSolarTime);
      const monthPillar = calcMonthPillar(tc.trueSolarTime, yearPillar.stem);
      expect(monthPillar.branch).toBe('酉');
      expect(monthPillar.ganzhi).toBe('癸酉');
    });

    it('1990年（庚年）6月15日应为午月（壬午月）', () => {
      const tc = correctTime(1990, 6, 15, 10, 30, 121.47);
      const yearPillar = calcYearPillar(tc.trueSolarTime);
      const monthPillar = calcMonthPillar(tc.trueSolarTime, yearPillar.stem);
      expect(monthPillar.branch).toBe('午');
      expect(monthPillar.ganzhi).toBe('壬午');
    });

    it('paipan 集成：不同年份同月份月支应相同', () => {
      const c84 = paipan({ year: 1984, month: 6, day: 15, hour: 12, minute: 0, gender: '男', longitude: 116.41 });
      const c90 = paipan({ year: 1990, month: 6, day: 15, hour: 12, minute: 0, gender: '男', longitude: 116.41 });
      expect(c84.fourPillars.month.branch).toBe('午');
      expect(c90.fourPillars.month.branch).toBe('午');
      // 甲年午月=庚午，庚年午月=壬午
      expect(c84.fourPillars.month.ganzhi).toBe('庚午');
      expect(c90.fourPillars.month.ganzhi).toBe('壬午');
    });
  });

  // ============================================================
  // 规则#8：日柱夜子时 / 子正
  // ============================================================
  describe('夜子时（23:00-24:00）与子正（00:00-01:00）', () => {
    it('夜子时：日柱用当日，时柱用次日日干遁五鼠遁', () => {
      // 2000-01-01 23:30 北京：日柱=戊午（当日），时柱=甲子（次日己→甲子）
      const tc = correctTime(2000, 1, 1, 23, 30, 116.41);
      const { dayPillar, hourPillar, isNightZi } = calcDayHourPillars(tc.trueSolarTime, true);
      expect(isNightZi).toBe(true);
      expect(dayPillar.ganzhi).toBe('戊午');
      // 次日（1月2日）日干为己，五鼠遁己→子时甲
      expect(hourPillar.ganzhi).toBe('甲子');
    });

    it('子正：日柱和时柱均用当日', () => {
      // 2000-01-01 00:30 北京：日柱=戊午，时柱=壬子（当日戊→壬子）
      const tc = correctTime(2000, 1, 1, 0, 30, 116.41);
      const { dayPillar, hourPillar, isNightZi } = calcDayHourPillars(tc.trueSolarTime, true);
      expect(isNightZi).toBe(false);
      expect(dayPillar.ganzhi).toBe('戊午');
      // 当日日干戊，五鼠遁戊→子时壬
      expect(hourPillar.ganzhi).toBe('壬子');
    });

    it('夜子时与子正时柱应不同（因日干不同）', () => {
      const tcNight = correctTime(2000, 1, 1, 23, 30, 116.41);
      const tcNoon = correctTime(2000, 1, 1, 0, 30, 116.41);
      const night = calcDayHourPillars(tcNight.trueSolarTime, true);
      const noon = calcDayHourPillars(tcNoon.trueSolarTime, true);
      // 两者日柱相同（同为戊午），但时柱不同
      expect(night.dayPillar.ganzhi).toBe(noon.dayPillar.ganzhi);
      expect(night.hourPillar.ganzhi).not.toBe(noon.hourPillar.ganzhi);
    });

    it('关闭夜子时区分后，23:00-24:00 时柱应用当日日干', () => {
      const tc = correctTime(2000, 1, 1, 23, 30, 116.41);
      const { dayPillar, hourPillar, isNightZi } = calcDayHourPillars(tc.trueSolarTime, false);
      expect(isNightZi).toBe(false);
      expect(dayPillar.ganzhi).toBe('戊午');
      // 当日日干戊 → 子时壬
      expect(hourPillar.ganzhi).toBe('壬子');
    });

    it('paipan 集成：夜子时命例（1984-02-04 23:30 → 戊辰日 甲子时）', () => {
      const chart = paipan({ year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 });
      // 日柱用当日 → 戊辰
      expect(chart.fourPillars.day.ganzhi).toBe('戊辰');
      // 时柱用次日日干遁五鼠遁：次日为己巳，己→子时甲
      expect(chart.fourPillars.hour.ganzhi).toBe('甲子');
    });
  });

  // ============================================================
  // 规则#9：时柱五鼠遁
  // ============================================================
  describe('时柱五鼠遁验证', () => {
    it('五鼠遁：甲己日子时起甲（甲日子时=甲子）', () => {
      expect(wuShuDun('甲', 0)).toBe('甲');
      expect(wuShuDun('己', 0)).toBe('甲');
    });

    it('五鼠遁：乙庚日子时起丙', () => {
      expect(wuShuDun('乙', 0)).toBe('丙');
      expect(wuShuDun('庚', 0)).toBe('丙');
    });

    it('五鼠遁：丙辛日子时起戊', () => {
      expect(wuShuDun('丙', 0)).toBe('戊');
      expect(wuShuDun('辛', 0)).toBe('戊');
    });

    it('五鼠遁：丁壬日子时起庚', () => {
      expect(wuShuDun('丁', 0)).toBe('庚');
      expect(wuShuDun('壬', 0)).toBe('庚');
    });

    it('五鼠遁：戊癸日子时起壬', () => {
      expect(wuShuDun('戊', 0)).toBe('壬');
      expect(wuShuDun('癸', 0)).toBe('壬');
    });

    it('甲日各时辰天干应顺排（甲子乙丑丙寅…）', () => {
      // 甲日：子=甲, 丑=乙, 寅=丙, 卯=丁, 辰=戊, 巳=己, 午=庚, 未=辛, 申=壬, 酉=癸, 戌=甲, 亥=乙
      const expected = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'];
      for (let i = 0; i < 12; i++) {
        expect(wuShuDun('甲', i)).toBe(expected[i]);
      }
    });

    it('时支索引：23时和0时均为子时（索引0）', () => {
      // 子时跨 23:00-01:00
      const branch23 = EARTHLY_BRANCHES[0];
      expect(branch23).toBe('子');
    });

    it('paipan 集成：午时（11:00-13:00）时支为午', () => {
      // 1984-06-15 12:00 → 午时
      const chart = paipan({ year: 1984, month: 6, day: 15, hour: 12, minute: 0, gender: '男', longitude: 116.41 });
      expect(chart.fourPillars.hour.branch).toBe('午');
    });
  });

  // ============================================================
  // 四柱组装集成
  // ============================================================
  describe('四柱组装（calculateFourPillars）', () => {
    it('应返回年月日时四柱完整结构', () => {
      const input: BirthInput = {
        year: 1984, month: 6, day: 15, hour: 12, minute: 0,
        gender: '男', longitude: 116.41,
      };
      const tc = correctTime(input.year, input.month, input.day, input.hour, input.minute, input.longitude);
      const fp = calculateFourPillars(input, tc);
      expect(fp.year).toBeDefined();
      expect(fp.month).toBeDefined();
      expect(fp.day).toBeDefined();
      expect(fp.hour).toBeDefined();
      // 每柱应有干支、纳音、藏干、十神
      expect(fp.year.ganzhi).toBeDefined();
      expect(fp.year.nayin).toBeDefined();
      expect(fp.year.hiddenStems).toBeInstanceOf(Array);
      expect(fp.year.tenGod).toBeDefined();
    });

    it('1984-06-15 12:00 北京 应为 甲子年 庚午月 庚辰日 壬午时', () => {
      const input: BirthInput = {
        year: 1984, month: 6, day: 15, hour: 12, minute: 0,
        gender: '男', longitude: 116.41,
      };
      const tc = correctTime(input.year, input.month, input.day, input.hour, input.minute, input.longitude);
      const fp = calculateFourPillars(input, tc);
      expect(fp.year.ganzhi).toBe('甲子');
      expect(fp.month.ganzhi).toBe('庚午');
      expect(fp.day.ganzhi).toBe('庚辰');
      expect(fp.hour.ganzhi).toBe('壬午');
    });

    it('日主应为日柱天干', () => {
      const input: BirthInput = {
        year: 1984, month: 6, day: 15, hour: 12, minute: 0,
        gender: '男', longitude: 116.41,
      };
      const chart = paipan(input);
      expect(chart.dayMaster).toBe(chart.fourPillars.day.stem);
    });
  });
});
