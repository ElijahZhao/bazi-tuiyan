/**
 * 排盘引擎 — 类型定义
 *
 * 来源：[项目大纲 第二节架构图、第四节展示项]
 */

// ============================================================
// 基础类型
// ============================================================

export type Stem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
export type Branch = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';
export type Element = '木' | '火' | '土' | '金' | '水';
export type YinYang = '阳' | '阴';
export type Gender = '男' | '女';

export type TenGod =
  | '比肩' | '劫财' | '食神' | '伤官'
  | '偏财' | '正财' | '七杀' | '正官'
  | '偏印' | '正印';

// 十二长生十二宫
export type ChangShengState =
  | '长生' | '沐浴' | '冠带' | '临官' | '帝旺'
  | '衰' | '病' | '死' | '墓' | '绝' | '胎' | '养';

// 别名：十二长生阶段（analysis.ts 使用）
export type LifeStage = ChangShengState;

// ============================================================
// 输入
// ============================================================

export interface BirthInput {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;   // 0-23
  minute: number; // 0-59
  gender: Gender;
  longitude: number;      // 出生地经度
  birthPlace?: string;
  timezone?: number;       // UTC 偏移小时数（默认 8 = 北京时间）
  enableNightZi?: boolean; // 是否启用夜子时/子正区分，默认 true
}

// ============================================================
// 柱
// ============================================================

export interface HiddenStem {
  stem: Stem;
  type: '本气' | '中气' | '余气';
  ratio: number; // 力量比例 0-1
}

export interface Pillar {
  stem: Stem;
  branch: Branch;
  ganzhi: string;       // 如 "甲子"
  nayin: string;        // 如 "海中金"
  nayinElement: Element;
}

export interface PillarDetail extends Pillar {
  hiddenStems: HiddenStem[];
  tenGod: TenGod;        // 以日主为中心的十神
  changSheng?: ChangShengState; // 十二长生状态
  kongWang?: Branch[];   // 空亡地支
  shenSha: string[];     // 神煞列表
  wangShuai?: '旺' | '相' | '休' | '囚' | '死'; // 五行旺相休囚死
}

export interface FourPillars {
  year: PillarDetail;
  month: PillarDetail;
  day: PillarDetail;
  hour: PillarDetail;
}

// ============================================================
// 辅助宫位
// ============================================================

export interface AuxiliaryPalaces {
  taiYuan: Pillar;        // 胎元
  taiYuanMethod: string;  // 胎元方法说明
  mingGong: Pillar;       // 命宫
  shenGong: Pillar;       // 身宫
  shenGongMethod: string; // 身宫方法说明
}

// ============================================================
// 大运 / 流运
// ============================================================

export interface DaYun {
  index: number;
  startAge: number;
  startYear: number;
  pillar: Pillar;
}

export interface DaYunResult {
  direction: '顺' | '逆';
  startAge: number;
  startMonth: number;
  startDay: number;
  startHour: number;
  steps: DaYun[];
}

export interface LiuNian {
  year: number;
  pillar: Pillar;
}

export interface LiuYue {
  monthBranch: Branch;
  pillar: Pillar;
}

export interface LiuRi {
  date: string; // YYYY-MM-DD
  pillar: Pillar;
}

export interface LiuShi {
  hourBranch: Branch;
  pillar: Pillar;
}

export interface XiaoYun {
  age: number; // 虚岁
  pillar: Pillar;
}

// ============================================================
// 关系分析
// ============================================================

export interface BranchRelation {
  type: '六合' | '六冲' | '三合' | '半三合' | '三会' | '三刑' | '六害' | '相破';
  branches: string;
  description: string;
  transform?: Element; // 合化五行
}

export interface StemRelation {
  type: '天干五合' | '天干相冲';
  stems: string;
  transform?: Element; // 化气五行
  huaQiMet?: boolean;  // 是否满足化气条件
}

export interface AnHeRelation {
  branches: string;
  hiddenStems: string;
  description: string;
  controversial?: boolean;
}

export interface GongJiaRelation {
  type: '拱' | '夹';
  branches: string;
  virtualBranch: Branch;
  transform: Element;
}

export interface RelationAnalysis {
  branchRelations: BranchRelation[];
  stemRelations: StemRelation[];
  anHeRelations: AnHeRelation[];
  gongJiaRelations: GongJiaRelation[];
  yangRen: { stem: Stem; positions: { system: string; branch: Branch }[] } | null;
}

// ============================================================
// 旺衰格局
// ============================================================

export interface WangShuaiInfo {
  elementStatus: Record<Element, '旺' | '相' | '休' | '囚' | '死'>;
  dayMasterStrength: '旺' | '弱' | '偏旺' | '偏弱' | '中和';
  deLing: boolean;  // 得令
  deDi: boolean;    // 得地
  deShi: boolean;   // 得势
  pattern?: string; // 格局
  yongShen?: string; // 用神
}

export interface RenYuanSiLing {
  month: Branch;
  segments: { stem: Stem; days: number; description: string }[];
  currentSegment?: { stem: Stem; description: string };
}

// ============================================================
// 节气
// ============================================================

export interface SolarTermInfo {
  name: string;
  index: number;
  time: Date;
  longitude: number;
  isJie: boolean;
}

// ============================================================
// 时间校正
// ============================================================

export interface TimeCorrection {
  clockTime: Date;        // 钟表时间
  dstAdjusted: Date;      // 夏令时还原后
  longitudeAdjusted: Date; // 经度差修正后
  trueSolarTime: Date;    // 真太阳时（均时差修正后）
  dstApplied: boolean;    // 是否进行了夏令时还原
  isDST: boolean;         // 别名：是否夏令时（= dstApplied）
  dstOffset: number;      // 夏令时偏移分钟数（60 或 0）
  equationOfTime: number; // 均时差（分钟）
  longitudeDiff: number;  // 经度差（分钟）
  timezone: number;       // UTC 偏移小时数
}

// ============================================================
// 命盘完整结果
// ============================================================

export interface ChartResult {
  input: BirthInput;
  timeCorrection: TimeCorrection;
  solarTerms: SolarTermInfo[];
  fourPillars: FourPillars;
  auxiliary: AuxiliaryPalaces;
  daYun: DaYunResult;
  liuNian: LiuNian[];
  xiaoYun: XiaoYun[];
  relations: RelationAnalysis;
  wangShuai: WangShuaiInfo;
  renYuanSiLing: RenYuanSiLing;
  elementCount: Record<Element, number>; // 五行计数
}

// ============================================================
// 辅助类型（各模块使用）
// ============================================================

// 胎元结果（palaces.ts 使用）
export interface TaiYuan {
  pillar: Pillar;
  method: string;
  source: string;
}

// 命宫结果（palaces.ts 使用）
export interface MingGong {
  branch: Branch;
  stem: Stem;
  source: string;
}

// 身宫结果（palaces.ts 使用）
export interface ShenGong {
  branch: Branch;
  stem: Stem;
  method: string;
  source: string;
}

// 藏干条目别名（prosperity.ts 使用）
export type HiddenStemEntry = HiddenStem;

// 五行力量（prosperity.ts 使用）
export interface ElementStrength {
  element: Element;
  count: number;
  ratio: number;
  status: '旺' | '相' | '休' | '囚' | '死';
}

// 旺衰格局结果（prosperity.ts 使用）
export interface ProsperityResult {
  elementStrengths: ElementStrength[];
  dayMasterStrength: '旺' | '偏旺' | '中和' | '偏弱' | '弱';
  deLing: boolean;
  deDi: boolean;
  deShi: boolean;
  pattern: string;
  yongShen: Element | null;
  yongShenMethod: string;
}

// 神煞结果类型
export type ShenShaResult = Record<string, string[]>;

// ============================================================
// BaziChart — 完整命盘对象（index.ts 返回）
// ============================================================

export interface BaziChart {
  id: string;
  input: BirthInput;
  timeCorrection: TimeCorrection;
  fourPillars: FourPillars;
  dayMaster: Stem;
  dayMasterElement: Element;
  hiddenStems: {
    year: HiddenStem[];
    month: HiddenStem[];
    day: HiddenStem[];
    hour: HiddenStem[];
  };
  tenGods: {
    year: TenGod;
    month: TenGod;
    day: string;
    hour: TenGod;
    hiddenStems: {
      year: { stem: Stem; tenGod: TenGod }[];
      month: { stem: Stem; tenGod: TenGod }[];
      day: { stem: Stem; tenGod: TenGod }[];
      hour: { stem: Stem; tenGod: TenGod }[];
    };
  };
  nayin: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  daYun: DaYunResult;
  liuNian: LiuNian[];
  xiaoYun: XiaoYun[];
  taiYuan: Pillar;
  mingGong: Pillar;
  shenGong: Pillar;
  lifeStages: {
    year: ChangShengState;
    month: ChangShengState;
    day: ChangShengState;
    hour: ChangShengState;
  };
  shenSha: ShenShaResult;
  kongWang: {
    day: Branch[];
    year: Branch[];
  };
  branchRelations: BranchRelation[];
  stemRelations: StemRelation[];
  anHeRelations: AnHeRelation[];
  gongJiaRelations: GongJiaRelation[];
  prosperity: ProsperityResult;
  elementCount: Record<Element, number>; // 五行计数
  renYuanSiLing: RenYuanSiLing; // 人元司令分野
  liuYue: LiuYue[]; // 流月（当年）
  liuRi: LiuRi; // 流日（当日）
  liuShi: LiuShi[]; // 流时（当日十二时辰）
  createdAt: string;
}
