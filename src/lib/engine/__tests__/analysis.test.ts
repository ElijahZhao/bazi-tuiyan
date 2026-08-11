/**
 * 层6：十神 / 纳音 / 十二长生 / 藏干 — 规则 #16-#19 测试
 *
 * 地支藏干（12地支藏干逐字核对）
 * 十神（以日主为中心）
 * 纳音（六十甲子纳音30对验证）
 * 十二长生（阳干顺行）
 *
 * 来源：[项目大纲 规则#16-#19, 11.6, 11.7, 11.13, 11.18]
 */

import { describe, it, expect } from 'vitest';
import { getTenGod, getLifeStage, verifyNayin, checkNayinConsistency, getNayin, getNayinElement, SIXTY_JIAZI } from '../analysis';
import {
  HIDDEN_STEMS,
  STEM_ELEMENT,
  STEM_YIN_YANG,
  GENERATING,
  OVERCOMING,
  YANG_CHANG_SHENG,
  CHANG_SHENG_12,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
} from '../constants';
import { paipan } from '../index';
import type { Stem, Branch, Element, TenGod } from '../types';

describe('规则#16-#19：藏干/十神/纳音/十二长生', () => {
  // ============================================================
  // 规则#16：地支藏干（12地支藏干逐字核对）
  // ============================================================
  describe('地支藏干（12地支藏干逐字核对）', () => {
    it('子藏癸（本气）', () => {
      expect(HIDDEN_STEMS['子']).toHaveLength(1);
      expect(HIDDEN_STEMS['子'][0].stem).toBe('癸');
      expect(HIDDEN_STEMS['子'][0].type).toBe('本气');
    });

    it('丑藏己癸辛（本气己、中气癸、余气辛）', () => {
      const h = HIDDEN_STEMS['丑'];
      expect(h).toHaveLength(3);
      expect(h[0]).toMatchObject({ stem: '己', type: '本气' });
      expect(h[1]).toMatchObject({ stem: '癸', type: '中气' });
      expect(h[2]).toMatchObject({ stem: '辛', type: '余气' });
    });

    it('寅藏甲丙戊（本气甲、中气丙、余气戊）', () => {
      const h = HIDDEN_STEMS['寅'];
      expect(h).toHaveLength(3);
      expect(h[0]).toMatchObject({ stem: '甲', type: '本气' });
      expect(h[1]).toMatchObject({ stem: '丙', type: '中气' });
      expect(h[2]).toMatchObject({ stem: '戊', type: '余气' });
    });

    it('卯藏乙（本气）', () => {
      expect(HIDDEN_STEMS['卯']).toHaveLength(1);
      expect(HIDDEN_STEMS['卯'][0].stem).toBe('乙');
    });

    it('辰藏戊乙癸（本气戊、中气乙、余气癸）', () => {
      const h = HIDDEN_STEMS['辰'];
      expect(h).toHaveLength(3);
      expect(h[0]).toMatchObject({ stem: '戊', type: '本气' });
      expect(h[1]).toMatchObject({ stem: '乙', type: '中气' });
      expect(h[2]).toMatchObject({ stem: '癸', type: '余气' });
    });

    it('巳藏丙戊庚（本气丙、中气戊、余气庚）', () => {
      const h = HIDDEN_STEMS['巳'];
      expect(h).toHaveLength(3);
      expect(h[0]).toMatchObject({ stem: '丙', type: '本气' });
      expect(h[1]).toMatchObject({ stem: '戊', type: '中气' });
      expect(h[2]).toMatchObject({ stem: '庚', type: '余气' });
    });

    it('午藏丁己（本气丁、中气己）', () => {
      const h = HIDDEN_STEMS['午'];
      expect(h).toHaveLength(2);
      expect(h[0]).toMatchObject({ stem: '丁', type: '本气' });
      expect(h[1]).toMatchObject({ stem: '己', type: '中气' });
    });

    it('未藏己丁乙（本气己、中气丁、余气乙）', () => {
      const h = HIDDEN_STEMS['未'];
      expect(h).toHaveLength(3);
      expect(h[0]).toMatchObject({ stem: '己', type: '本气' });
      expect(h[1]).toMatchObject({ stem: '丁', type: '中气' });
      expect(h[2]).toMatchObject({ stem: '乙', type: '余气' });
    });

    it('申藏庚壬戊（本气庚、中气壬、余气戊）', () => {
      const h = HIDDEN_STEMS['申'];
      expect(h).toHaveLength(3);
      expect(h[0]).toMatchObject({ stem: '庚', type: '本气' });
      expect(h[1]).toMatchObject({ stem: '壬', type: '中气' });
      expect(h[2]).toMatchObject({ stem: '戊', type: '余气' });
    });

    it('酉藏辛（本气）', () => {
      expect(HIDDEN_STEMS['酉']).toHaveLength(1);
      expect(HIDDEN_STEMS['酉'][0].stem).toBe('辛');
    });

    it('戌藏戊辛丁（本气戊、中气辛、余气丁）', () => {
      const h = HIDDEN_STEMS['戌'];
      expect(h).toHaveLength(3);
      expect(h[0]).toMatchObject({ stem: '戊', type: '本气' });
      expect(h[1]).toMatchObject({ stem: '辛', type: '中气' });
      expect(h[2]).toMatchObject({ stem: '丁', type: '余气' });
    });

    it('亥藏壬甲（本气壬、中气甲）', () => {
      const h = HIDDEN_STEMS['亥'];
      expect(h).toHaveLength(2);
      expect(h[0]).toMatchObject({ stem: '壬', type: '本气' });
      expect(h[1]).toMatchObject({ stem: '甲', type: '中气' });
    });

    it('本气力量比例应为最大值', () => {
      for (const branch of EARTHLY_BRANCHES) {
        const h = HIDDEN_STEMS[branch];
        if (h.length > 1) {
          const mainRatio = h[0].ratio;
          for (let i = 1; i < h.length; i++) {
            expect(mainRatio).toBeGreaterThanOrEqual(h[i].ratio);
          }
        }
      }
    });

    it('各支藏干力量比例之和应为1', () => {
      for (const branch of EARTHLY_BRANCHES) {
        const h = HIDDEN_STEMS[branch];
        const sum = h.reduce((acc, cur) => acc + cur.ratio, 0);
        expect(sum).toBeCloseTo(1.0, 5);
      }
    });
  });

  // ============================================================
  // 规则#17：十神（以日主为中心）
  // ============================================================
  describe('十神（以日主为中心，正官=异性相克等）', () => {
    it('日主戊：见甲为七杀（克我、同阴阳）', () => {
      // 戊(阳土)，甲(阳木)，木克土=克我，同阳→七杀
      expect(getTenGod('戊', '甲')).toBe('七杀');
    });

    it('日主戊：见乙为正官（克我、异阴阳）', () => {
      // 乙(阴木)，木克土=克我，异阴→正官
      expect(getTenGod('戊', '乙')).toBe('正官');
    });

    it('日主戊：见丙为偏印（生我、同阴阳）', () => {
      // 丙(阳火)，火生土=生我，同阳→偏印
      expect(getTenGod('戊', '丙')).toBe('偏印');
    });

    it('日主戊：见丁为正印（生我、异阴阳）', () => {
      expect(getTenGod('戊', '丁')).toBe('正印');
    });

    it('日主戊：见戊为比肩（同我、同阴阳）', () => {
      expect(getTenGod('戊', '戊')).toBe('比肩');
    });

    it('日主戊：见己为劫财（同我、异阴阳）', () => {
      expect(getTenGod('戊', '己')).toBe('劫财');
    });

    it('日主戊：见庚为食神（我生、同阴阳）', () => {
      // 庚(阳金)，土生金=我生，同阳→食神
      expect(getTenGod('戊', '庚')).toBe('食神');
    });

    it('日主戊：见辛为伤官（我生、异阴阳）', () => {
      expect(getTenGod('戊', '辛')).toBe('伤官');
    });

    it('日主戊：见壬为偏财（我克、同阴阳）', () => {
      // 壬(阳水)，土克水=我克，同阳→偏财
      expect(getTenGod('戊', '壬')).toBe('偏财');
    });

    it('日主戊：见癸为正财（我克、异阴阳）', () => {
      expect(getTenGod('戊', '癸')).toBe('正财');
    });

    it('十神应覆盖全部10种', () => {
      const gods: Set<TenGod> = new Set();
      for (const target of HEAVENLY_STEMS) {
        gods.add(getTenGod('戊', target));
      }
      expect(gods.size).toBe(10);
    });

    it('日主见自己应恒为比肩', () => {
      for (const dm of HEAVENLY_STEMS) {
        expect(getTenGod(dm, dm)).toBe('比肩');
      }
    });

    it('paipan 集成：1984-06-15 日柱庚，日主庚', () => {
      const chart = paipan({ year: 1984, month: 6, day: 15, hour: 12, minute: 0, gender: '男', longitude: 116.41 });
      expect(chart.dayMaster).toBe('庚');
      // 年干甲，庚见甲=偏财（我克，同阳）
      expect(chart.tenGods.year).toBe('偏财');
    });
  });

  // ============================================================
  // 规则#18：纳音（六十甲子纳音30对验证）
  // ============================================================
  describe('纳音（六十甲子纳音30对验证）', () => {
    const expectedPairs: [string, string, string, Element][] = [
      ['甲子', '乙丑', '海中金', '金'],
      ['丙寅', '丁卯', '炉中火', '火'],
      ['戊辰', '己巳', '大林木', '木'],
      ['庚午', '辛未', '路旁土', '土'],
      ['壬申', '癸酉', '剑锋金', '金'],
      ['甲戌', '乙亥', '山头火', '火'],
      ['丙子', '丁丑', '涧下水', '水'],
      ['戊寅', '己卯', '城头土', '土'],
      ['庚辰', '辛巳', '白蜡金', '金'],
      ['壬午', '癸未', '杨柳木', '木'],
      ['甲申', '乙酉', '泉中水', '水'],
      ['丙戌', '丁亥', '屋上土', '土'],
      ['戊子', '己丑', '霹雳火', '火'],
      ['庚寅', '辛卯', '松柏木', '木'],
      ['壬辰', '癸巳', '长流水', '水'],
      ['甲午', '乙未', '沙中金', '金'],
      ['丙申', '丁酉', '山下火', '火'],
      ['戊戌', '己亥', '平地木', '木'],
      ['庚子', '辛丑', '壁上土', '土'],
      ['壬寅', '癸卯', '金箔金', '金'],
      ['甲辰', '乙巳', '覆灯火', '火'],
      ['丙午', '丁未', '天河水', '水'],
      ['戊申', '己酉', '大驿土', '土'],
      ['庚戌', '辛亥', '钗钏金', '金'],
      ['壬子', '癸丑', '桑柘木', '木'],
      ['甲寅', '乙卯', '大溪水', '水'],
      ['丙辰', '丁巳', '沙中土', '土'],
      ['戊午', '己未', '天上火', '火'],
      ['庚申', '辛酉', '石榴木', '木'],
      ['壬戌', '癸亥', '大海水', '水'],
    ];

    it('甲子纳音应为海中金', () => {
      expect(getNayin('甲', '子')).toBe('海中金');
    });

    it('壬戌纳音应为大海水', () => {
      expect(getNayin('壬', '戌')).toBe('大海水');
    });

    it('30对纳音应全部正确', () => {
      for (const [gz1, , nayin] of expectedPairs) {
        const stem = gz1[0] as Stem;
        const branch = gz1[1] as Branch;
        expect(getNayin(stem, branch)).toBe(nayin);
      }
    });

    it('30对纳音五行应全部正确', () => {
      for (const [gz1, , , elem] of expectedPairs) {
        const stem = gz1[0] as Stem;
        const branch = gz1[1] as Branch;
        expect(getNayinElement(stem, branch)).toBe(elem);
      }
    });

    it('每对纳音两柱应同属一纳音', () => {
      for (const [gz1, gz2, nayin] of expectedPairs) {
        const s1 = gz1[0] as Stem, b1 = gz1[1] as Branch;
        const s2 = gz2[0] as Stem, b2 = gz2[1] as Branch;
        expect(getNayin(s1, b1)).toBe(nayin);
        expect(getNayin(s2, b2)).toBe(nayin);
      }
    });

    it('六十甲子应有60项', () => {
      expect(SIXTY_JIAZI).toHaveLength(60);
    });

    it('六十甲子首柱甲子末柱癸亥', () => {
      expect(SIXTY_JIAZI[0].ganzhi).toBe('甲子');
      expect(SIXTY_JIAZI[59].ganzhi).toBe('癸亥');
    });

    it('纳音公式（太玄数）应与查表一致', () => {
      // 抽样验证：甲子乙丑、丙寅丁卯、壬戌癸亥
      expect(checkNayinConsistency('甲', '子').match).toBe(true);
      expect(checkNayinConsistency('丙', '寅').match).toBe(true);
      expect(checkNayinConsistency('壬', '戌').match).toBe(true);
      expect(checkNayinConsistency('戊', '辰').match).toBe(true);
    });

    it('全部60甲子纳音公式一致性', () => {
      for (const item of SIXTY_JIAZI) {
        const c = checkNayinConsistency(item.stem, item.branch);
        expect(c.match).toBe(true);
      }
    });

    it('verifyNayin 甲子乙丑应为金', () => {
      expect(verifyNayin('甲', '子', '乙', '丑')).toBe('金');
    });

    it('paipan 集成：甲子年纳音为海中金', () => {
      const chart = paipan({ year: 1984, month: 6, day: 15, hour: 12, minute: 0, gender: '男', longitude: 116.41 });
      expect(chart.fourPillars.year.nayin).toBe('海中金');
      expect(chart.nayin.year).toBe('海中金');
    });
  });

  // ============================================================
  // 规则#19：十二长生（阳干顺行）
  // ============================================================
  describe('十二长生（阳干顺行）', () => {
    it('十二长生顺序应为长生→沐浴→冠带→临官→帝旺→衰→病→死→墓→绝→胎→养', () => {
      expect(CHANG_SHENG_12).toEqual([
        '长生', '沐浴', '冠带', '临官', '帝旺',
        '衰', '病', '死', '墓', '绝', '胎', '养',
      ]);
    });

    it('甲干长生在亥（甲亥=长生）', () => {
      expect(YANG_CHANG_SHENG['甲']).toBe('亥');
      expect(getLifeStage('甲', '亥').stage).toBe('长生');
    });

    it('丙干长生在寅（丙寅=长生）', () => {
      expect(YANG_CHANG_SHENG['丙']).toBe('寅');
      expect(getLifeStage('丙', '寅').stage).toBe('长生');
    });

    it('戊干长生在寅（火土同长生）', () => {
      expect(YANG_CHANG_SHENG['戊']).toBe('寅');
      expect(getLifeStage('戊', '寅').stage).toBe('长生');
    });

    it('庚干长生在巳（庚巳=长生）', () => {
      expect(YANG_CHANG_SHENG['庚']).toBe('巳');
      expect(getLifeStage('庚', '巳').stage).toBe('长生');
    });

    it('壬干长生在申（壬申=长生）', () => {
      expect(YANG_CHANG_SHENG['壬']).toBe('申');
      expect(getLifeStage('壬', '申').stage).toBe('长生');
    });

    it('甲干顺行：亥长生→子沐浴→丑冠带→寅临官→卯帝旺', () => {
      expect(getLifeStage('甲', '亥').stage).toBe('长生');
      expect(getLifeStage('甲', '子').stage).toBe('沐浴');
      expect(getLifeStage('甲', '丑').stage).toBe('冠带');
      expect(getLifeStage('甲', '寅').stage).toBe('临官');
      expect(getLifeStage('甲', '卯').stage).toBe('帝旺');
    });

    it('甲干顺行：辰衰→巳病→午死→未墓→申绝→酉胎→戌养', () => {
      expect(getLifeStage('甲', '辰').stage).toBe('衰');
      expect(getLifeStage('甲', '巳').stage).toBe('病');
      expect(getLifeStage('甲', '午').stage).toBe('死');
      expect(getLifeStage('甲', '未').stage).toBe('墓');
      expect(getLifeStage('甲', '申').stage).toBe('绝');
      expect(getLifeStage('甲', '酉').stage).toBe('胎');
      expect(getLifeStage('甲', '戌').stage).toBe('养');
    });

    it('丙干顺行：寅长生→卯沐浴→辰冠带→巳临官→午帝旺', () => {
      expect(getLifeStage('丙', '寅').stage).toBe('长生');
      expect(getLifeStage('丙', '卯').stage).toBe('沐浴');
      expect(getLifeStage('丙', '辰').stage).toBe('冠带');
      expect(getLifeStage('丙', '巳').stage).toBe('临官');
      expect(getLifeStage('丙', '午').stage).toBe('帝旺');
    });

    it('阳干长生位应标记为非参考性（isReference=false）', () => {
      for (const stem of ['甲', '丙', '戊', '庚', '壬'] as Stem[]) {
        const changSheng = YANG_CHANG_SHENG[stem]!;
        expect(getLifeStage(stem, changSheng).isReference).toBe(false);
      }
    });

    it('阴干应标记为参考性（isReference=true）', () => {
      for (const stem of ['乙', '丁', '己', '辛', '癸'] as Stem[]) {
        const result = getLifeStage(stem, '子');
        expect(result.isReference).toBe(true);
      }
    });

    it('paipan 集成：命盘应包含四柱十二长生', () => {
      const chart = paipan({ year: 1984, month: 6, day: 15, hour: 12, minute: 0, gender: '男', longitude: 116.41 });
      expect(chart.lifeStages).toHaveProperty('year');
      expect(chart.lifeStages).toHaveProperty('month');
      expect(chart.lifeStages).toHaveProperty('day');
      expect(chart.lifeStages).toHaveProperty('hour');
    });
  });
});
