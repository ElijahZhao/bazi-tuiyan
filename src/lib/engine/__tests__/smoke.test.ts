/**
 * 引擎冒烟测试
 * 
 * 命例1: 1984-02-04 23:30 男 北京(116.41°)
 * 预期: 甲子年 戊寅月 戊辰日 甲子时 (立春后23:30, 夜子时)
 */

import { describe, it, expect } from 'vitest';
import { paipan } from '../index';
import type { BirthInput } from '../types';

describe('引擎冒烟测试', () => {
  it('命例1: 1984-02-04 23:30 男 北京 - 应正确排盘', () => {
    const input: BirthInput = {
      year: 1984,
      month: 2,
      day: 4,
      hour: 23,
      minute: 30,
      gender: '男',
      longitude: 116.41,
      birthPlace: '北京',
    };

    const chart = paipan(input);

    // 基本结构验证
    expect(chart).toBeDefined();
    expect(chart.fourPillars).toBeDefined();
    expect(chart.fourPillars.year.ganzhi).toBe('甲子');
    expect(chart.fourPillars.month.branch).toBe('寅');
    expect(chart.fourPillars.day.ganzhi).toBe('戊辰');
    expect(chart.fourPillars.hour.ganzhi).toBe('甲子');
    expect(chart.dayMaster).toBe('戊');
    expect(chart.daYun.direction).toBe('顺');
    
    // 验证纳音
    expect(chart.fourPillars.year.nayin).toBe('海中金');
    
    // 验证神煞
    expect(Object.keys(chart.shenSha).length).toBeGreaterThan(0);
    
    // 验证关系分析
    expect(chart.branchRelations).toBeDefined();
    expect(chart.stemRelations).toBeDefined();
    
    // 验证旺衰格局
    expect(chart.prosperity).toBeDefined();
    expect(chart.prosperity.dayMasterStrength).toBeDefined();
    expect(chart.prosperity.pattern).toBeDefined();
    
    // 验证辅助宫位
    expect(chart.taiYuan).toBeDefined();
    expect(chart.mingGong).toBeDefined();
    expect(chart.shenGong).toBeDefined();
    
    // 验证大运
    expect(chart.daYun.steps).toHaveLength(8);
    expect(chart.daYun.startAge).toBeGreaterThanOrEqual(0);
  });

  it('命例2: 1990-06-15 10:30 女 上海 - 应正确排盘', () => {
    const input: BirthInput = {
      year: 1990,
      month: 6,
      day: 15,
      hour: 10,
      minute: 30,
      gender: '女',
      longitude: 121.47,
      birthPlace: '上海',
    };

    const chart = paipan(input);

    expect(chart).toBeDefined();
    // 1990年 = 庚午年
    expect(chart.fourPillars.year.stem).toBe('庚');
    expect(chart.fourPillars.year.branch).toBe('午');
    // 6月15日在芒种后小暑前 → 午月
    expect(chart.fourPillars.month.branch).toBe('午');
    // 庚为阳干，阳年女 = 逆排
    expect(chart.daYun.direction).toBe('逆');
  });

  it('命例3: 1989-02-03 14:00 男 广州 - 立春前应属上一年', () => {
    const input: BirthInput = {
      year: 1989,
      month: 2,
      day: 3,
      hour: 14,
      minute: 0,
      gender: '男',
      longitude: 113.23,
      birthPlace: '广州',
    };

    const chart = paipan(input);

    expect(chart).toBeDefined();
    // 1989年立春在2月4日，2月3日立春前 → 用上一年干支
    // 1988年 = 戊辰年
    expect(chart.fourPillars.year.stem).toBe('戊');
    expect(chart.fourPillars.year.branch).toBe('辰');
    // 戊年男 = 阳年男 = 逆排
    expect(chart.daYun.direction).toBe('顺');
  });

  it('命例4: 1988-08-08 08:00 男 北京 - 夏令时还原', () => {
    const input: BirthInput = {
      year: 1988,
      month: 8,
      day: 8,
      hour: 8,
      minute: 0,
      gender: '男',
      longitude: 116.41,
      birthPlace: '北京',
    };

    const chart = paipan(input);

    expect(chart).toBeDefined();
    // 1988年有夏令时（4月10日-9月11日），8月8日在夏令时期间
    expect(chart.timeCorrection.isDST).toBe(true);
    expect(chart.timeCorrection.dstOffset).toBe(60);
    // 1988年 = 戊辰年
    expect(chart.fourPillars.year.stem).toBe('戊');
    expect(chart.fourPillars.year.branch).toBe('辰');
  });

  it('所有命例应无运行时错误', () => {
    const testCases: BirthInput[] = [
      { year: 1984, month: 2, day: 4, hour: 23, minute: 30, gender: '男', longitude: 116.41 },
      { year: 1990, month: 6, day: 15, hour: 10, minute: 30, gender: '女', longitude: 121.47 },
      { year: 1989, month: 2, day: 3, hour: 14, minute: 0, gender: '男', longitude: 113.23 },
      { year: 1988, month: 8, day: 8, hour: 8, minute: 0, gender: '男', longitude: 116.41 },
      { year: 2000, month: 1, day: 1, hour: 0, minute: 0, gender: '女', longitude: 120.16 },
      { year: 1995, month: 12, day: 31, hour: 23, minute: 59, gender: '男', longitude: 114.05 },
      { year: 1970, month: 7, day: 20, hour: 12, minute: 0, gender: '女', longitude: 108.93 },
    ];

    for (const input of testCases) {
      expect(() => paipan(input)).not.toThrow();
    }
  });
});
