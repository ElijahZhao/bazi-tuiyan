/**
 * 八字排盘引擎核心类型定义
 *
 * 本文件定义排盘引擎（纯 TS 函数库）所需的全部数据结构，覆盖：
 *   1. 天干地支 / 五行 / 阴阳 基础类型
 *   2. 排盘输入 BaziInput
 *   3. 四柱 Pillar
 *   4. 大运 / 流年 / 小运
 *   5. 神煞 ShenShaResult
 *   6. 地支关系 RelationResult / 天干关系 StemRelationResult
 *   7. 完整命盘 BaziChart
 *   8. 计算选项 CalculationOptions
 *
 * 对应项目大纲「三、排盘引擎——完整规则清单」与「十一、排盘引擎详细数据表」。
 *
 * @module bazi/types
 */

// ============================================================
// 一、天干地支基础类型
// ============================================================

/**
 * 天干：甲、乙、丙、丁、戊、己、庚、辛、壬、癸
 *
 * 其中甲丙戊庚壬为阳干，乙丁己辛癸为阴干。
 * @see 规则 #16 地支藏干（《渊海子平》体系）
 */
export type TianGan =
  | '甲'
  | '乙'
  | '丙'
  | '丁'
  | '戊'
  | '己'
  | '庚'
  | '辛'
  | '壬'
  | '癸';

/**
 * 地支：子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥
 *
 * 其中子寅辰午申戌为阳支，丑卯巳未酉亥为阴支。
 */
export type DiZhi =
  | '子'
  | '丑'
  | '寅'
  | '卯'
  | '辰'
  | '巳'
  | '午'
  | '未'
  | '申'
  | '酉'
  | '戌'
  | '亥';

/**
 * 五行：金、木、水、火、土
 *
 * 相生：金生水、水生木、木生火、火生土、土生金
 * 相克：金克木、木克土、土克水、水克火、火克金
 */
export type WuXing = '金' | '木' | '水' | '火' | '土';

/** 阴阳 */
export type YinYang = '阳' | '阴';

// ============================================================
// 二、排盘输入类型
// ============================================================

/**
 * 胎元计算方法（对应规则 #13、详细数据表 11.1）
 *
 * - `forward300`：前三百日法（默认，《三命通会》卷二原文）
 * - `stemBranchAdvance`：月干进一位、月支进三位法（民间简化口诀，非古籍正法）
 * - `conceptionMonth`：受胎月法（出生月前推十个月所在月份）
 */
export type TaiYuanMethod = 'forward300' | 'stemBranchAdvance' | 'conceptionMonth';

/**
 * 身宫计算方法（对应规则 #15、详细数据表 11.2）
 *
 * - `gujinTushu`：古今图书集成法（默认，《古今图书集成·艺术典》卷六百九十八）
 * - `fengyou`：逢酉安身法（《神峰通考》五星正说类，非八字主流起例）
 */
export type ShengongMethod = 'gujinTushu' | 'fengyou';

/**
 * 羊刃体系（对应规则 #21）
 *
 * - `luqian`：禄前一位说（默认）
 * - `diwang`：帝旺位说
 * - `yangGan`：五阳干有刃说
 *
 * 三说并存，古籍本身不统一，引擎支持切换并标注所用体系。
 */
export type YangrenSystem = 'luqian' | 'diwang' | 'yangGan';

/**
 * 排盘输入
 *
 * 出生时间以公历（公历年月日时）+ 性别 + 出生地经度为核心输入，
 * 引擎内部完成真太阳时校正后再排盘（对应规则 #1~#4）。
 */
export interface BaziInput {
  /** 出生日期，ISO 格式 YYYY-MM-DD（公历） */
  birthDate: string;
  /** 出生时间，HH:MM（24 小时制，钟表时间） */
  birthTime: string;
  /** 性别：决定大运顺逆（阳年男/阴年女顺排，阴年男/阳年女逆排） */
  gender: 'male' | 'female';
  /** 出生地经度（用于真太阳时校正：4 分钟 ×（当地经度 - 120°）） */
  longitude: number;
  /** 出生地纬度（可选） */
  latitude?: number;
  /** 出生地名称（可选，仅展示用） */
  locationName?: string;
  /**
   * 是否启用夜子时（23:00-00:00）与子正（00:00-01:00）区分。
   * 默认 true。对应规则 #8：夜子时日柱用当日、时柱用次日日干遁五鼠遁。
   */
  enableNightZiShi?: boolean;
  /** 胎元计算方法，默认 forward300（前三百日法） */
  taiyuanMethod?: TaiYuanMethod;
  /** 身宫计算方法，默认 gujinTushu（古今图书集成法） */
  shengongMethod?: ShengongMethod;
  /** 羊刃体系，默认 luqian（禄前一位说） */
  yangrenSystem?: YangrenSystem;
}

// ============================================================
// 三、四柱类型
// ============================================================

/** 藏干力量比例项（本气 > 中气 > 余气） */
export interface HiddenStemRatio {
  /** 藏干 */
  stem: TianGan;
  /** 力量比例，0~1（参考：本气 0.6 / 中气 0.25 / 余气 0.15；单藏干 1.0） */
  ratio: number;
}

/**
 * 四柱（年柱 / 月柱 / 日柱 / 时柱，以及胎元 / 命宫 / 身宫均复用此结构）
 *
 * 对应规则 #6~#9（四柱排盘）、#16（地支藏干）、#18（纳音）、#19（十二长生）。
 */
export interface Pillar {
  /** 天干 */
  stem: TianGan;
  /** 地支 */
  branch: DiZhi;
  /** 地支藏干（《渊海子平》地支藏遁歌，本气/中气/余气顺序） */
  hiddenStems: TianGan[];
  /** 藏干力量比例（本气 > 中气 > 余气，用于日主旺衰"得地"量化） */
  hiddenStemRatios?: HiddenStemRatio[];
  /**
   * 十神。年/月/时柱以日主为中心定十神；
   * 日柱此字段为日主本身（或留空，由 dayMaster 字段统一给出）。
   * 取值：比肩/劫财/食神/伤官/偏财/正财/七杀/正官/偏印/正印
   */
  tenGod?: string;
  /** 六十甲子纳音名称（如"海中金"） */
  nayin?: string;
  /** 纳音五行 */
  nayinElement?: WuXing;
  /** 十二长生状态（长生/沐浴/冠带/临官/帝旺/衰/病/死/墓/绝/胎/养） */
  changsheng?: string;
  /** 是否空亡（以日柱查旬空为主，年柱为辅） */
  empty?: boolean;
}

// ============================================================
// 四、大运 / 流年 / 小运
// ============================================================

/**
 * 大运（对应规则 #10、#11）
 *
 * 顺逆以年干阴阳为准（阳年男/阴年女顺排；阴年男/阳年女逆排）；
 * 起运岁数由出生时刻到最近一"节"的精确时间差换算（3 天 = 1 岁）。
 */
export interface DaYunItem {
  /** 大运干支柱 */
  pillar: Pillar;
  /** 起运岁数 */
  startAge: number;
  /** 起始公历年 */
  startYear: number;
  /** 止运岁数 */
  endAge: number;
  /** 止运公历年 */
  endYear: number;
  /** 该步大运十神（以日主定） */
  tenGod?: string;
}

/**
 * 流年（对应规则 #12）
 *
 * 逐年干支，age 为虚岁。
 */
export interface LiuNianItem {
  /** 公历年 */
  year: number;
  /** 流年干支柱 */
  pillar: Pillar;
  /** 虚岁 */
  age: number;
}

/**
 * 小运（对应规则 #12）
 *
 * 以时柱为起点，阳男阴女顺行 / 阴男阳女逆行（同大运方向），
 * 虚岁 1 岁起运（虚岁 1 岁 = 时柱本身），逐年行一柱。
 */
export interface XiaoYunItem {
  /** 虚岁 */
  age: number;
  /** 小运干支柱 */
  pillar: Pillar;
}

// ============================================================
// 五、神煞
// ============================================================

/**
 * 神煞查询结果（对应规则 #20、#21，详细数据表 11.3）
 *
 * 每种神煞标注查法依据（日干/年干/年支/日支/月支/日柱旬空）。
 * location 取值：年 / 月 / 日 / 时 / 胎 / 命 / 身。
 */
export interface ShenShaResult {
  /** 神煞名称（如天乙贵人、文昌、华盖、驿马、桃花、禄神、空亡、羊刃等） */
  name: string;
  /** 所在位置：年 / 月 / 日 / 时 / 胎 / 命 / 身 */
  location: string;
  /** 对应地支（部分神煞以地支论，如华盖/驿马/桃花） */
  branch?: DiZhi;
  /** 查法依据：日干 / 年干 / 年支 / 日支 / 月支 / 日柱旬空 等 */
  source: string;
  /** 神煞释义（可选） */
  description?: string;
}

// ============================================================
// 六、关系分析
// ============================================================

/** 地支关系类型（对应规则 #23、#24、#25） */
export type DiZhiRelationType =
  | 'liuhe' // 六合
  | 'liuchong' // 六冲
  | 'sanhe' // 三合局
  | 'bansanhe' // 半三合
  | 'sanhui' // 三会局
  | 'sanxing' // 三刑
  | 'liuhai' // 六害
  | 'xiangpo' // 相破
  | 'anhe' // 暗合（核心四组 + 争议组）
  | 'gongjia'; // 拱夹虚邀

/**
 * 地支关系查询结果
 *
 * 对应规则 #23（六合/六冲/三合/三会/三刑/六害/相破/半三合）、
 * #24（暗合）、#25（拱夹虚邀）。
 */
export interface RelationResult {
  /** 关系类型 */
  type: DiZhiRelationType;
  /** 参与地支 */
  branches: DiZhi[];
  /** 所在柱位（年/月/日/时/胎/命/身 等） */
  locations: string[];
  /** 关系描述 */
  description: string;
  /** 合化五行（如三合局/六合化气所得五行，仅合局相关关系有值） */
  element?: WuXing;
}

/** 天干关系类型（对应规则 #22、#29） */
export type StemRelationType =
  | 'wuhe' // 天干五合
  | 'chongpo' // 天干相冲（冲破：甲庚/乙辛/丙壬/丁癸）
  | 'xiangke'; // 天干相克（庚辛克甲乙等）

/**
 * 天干关系查询结果
 *
 * 对应规则 #22（天干五合 + 化气条件：甲己化土/乙庚化金/丙辛化水/丁壬化木/戊癸化火）、
 * #29（天干相克/相冲）。
 */
export interface StemRelationResult {
  /** 关系类型 */
  type: StemRelationType;
  /** 参与天干 */
  stems: TianGan[];
  /** 所在柱位（年/月/日/时 等） */
  locations: string[];
  /** 关系描述 */
  description: string;
  /** 化气五行（仅天干五合有值，如甲己化土 → '土'） */
  transformElement?: WuXing;
  /** 是否真化（须月令当化神 + 无争合妒合且化神不被克破 + 化神透引，三者俱备方论真化） */
  isTransformed?: boolean;
}

// ============================================================
// 七、完整命盘
// ============================================================

/** 五行分布统计项 */
export interface WuxingDistributionItem {
  /** 五行 */
  element: WuXing;
  /** 出现次数（四柱天干 + 地支藏干加权计数） */
  count: number;
  /** 占比百分比（0~100） */
  percentage: number;
}

/** 五行旺相休囚死状态项（对应规则 #26，详细数据表 11.4） */
export interface WuxingSeasonStateItem {
  /** 五行 */
  element: WuXing;
  /** 当季状态：旺 / 相 / 休 / 囚 / 死 */
  state: string;
}

/** 五行旺相休囚死（按出生月令定季） */
export interface WuxingSeasonState {
  /** 季节：春 / 夏 / 秋 / 冬 / 四季月 */
  season: string;
  /** 各五行当季状态 */
  states: WuxingSeasonStateItem[];
}

/** 日主旺衰（对应规则 #27：得令 + 得地 + 得势综合判断） */
export type DayMasterStrength = 'strong' | 'weak' | 'balanced';

/**
 * 完整命盘
 *
 * 排盘引擎的最终输出，整合四柱、辅助宫位、大运流运、神煞、关系分析、
 * 五行分析、旺衰格局等全部结果（对应项目大纲第四节命盘展示项）。
 */
export interface BaziChart {
  /** 原始输入 */
  input: BaziInput;
  /** 真太阳时（钟表时间→夏令时还原→经度差修正→均时差修正后的结果） */
  trueSolarTime: Date;

  // —— 四柱 ——
  /** 年柱（以立春交节时刻为界） */
  yearPillar: Pillar;
  /** 月柱（以十二节划分，月干用五虎遁） */
  monthPillar: Pillar;
  /** 日柱（以零点为日始；夜子时日柱用当日） */
  dayPillar: Pillar;
  /** 时柱（时干用五鼠遁） */
  timePillar: Pillar;

  /** 日主 = 日柱天干 */
  dayMaster: TianGan;

  // —— 辅助宫位 ——
  /** 胎元（默认前三百日法） */
  taiYuan: Pillar;
  /** 命宫（逢卯即安命宫） */
  mingGong: Pillar;
  /** 身宫（默认古今图书集成法） */
  shenGong: Pillar;

  // —— 大运流运 ——
  /** 大运列表 */
  daYun: DaYunItem[];
  /** 流年列表（可选，按需计算） */
  liuNian?: LiuNianItem[];
  /** 小运列表（可选，按需计算） */
  xiaoYun?: XiaoYunItem[];

  // —— 神煞 ——
  /** 神煞列表 */
  shenSha: ShenShaResult[];

  // —— 关系分析 ——
  /** 地支关系列表 */
  relations: RelationResult[];
  /** 天干关系列表 */
  stemRelations: StemRelationResult[];

  // —— 五行分析 ——
  /** 五行分布 */
  wuxingDistribution: WuxingDistributionItem[];
  /** 五行旺相休囚死（可选，按需计算） */
  wuxingSeasonState?: WuxingSeasonState;

  // —— 旺衰格局 ——
  /** 日主旺衰（可选，按需计算） */
  dayMasterStrength?: DayMasterStrength;
  /** 格局（可选，如建禄格/正官格等，对应规则 #28） */
  pattern?: string;
  /** 用神（可选，对应规则 #28：扶抑/病药/调候/专旺/通关五法） */
  yongShen?: string;

  /** 备注（可选，记录所用方法、来源分歧说明等） */
  notes?: string[];
}

// ============================================================
// 八、计算选项
// ============================================================

/**
 * 计算选项（控制排盘引擎输出哪些可选结果）
 *
 * 引擎默认产出四柱、辅助宫位、大运、神煞、关系、五行分布等核心项；
 * 下列开关用于按需开启流月/流日/流时/小运、十二长生、人元司令分野、
 * 旺衰格局等较重的计算，以控制客户端性能（<50ms 出结果）。
 */
export interface CalculationOptions {
  /** 是否计算流月（以节为界，月干用流年干遁五虎遁） */
  includeLiuYue?: boolean;
  /** 是否计算流日（取当日干支） */
  includeLiuRi?: boolean;
  /** 是否计算流时（五鼠遁，以流日干遁） */
  includeLiuShi?: boolean;
  /** 是否计算小运 */
  includeXiaoYun?: boolean;
  /** 是否计算十二长生状态 */
  includeChangsheng?: boolean;
  /** 是否计算人元司令分野（每月藏干用事日数） */
  includeRenyuanSiling?: boolean;
  /** 是否计算地支 / 天干关系分析 */
  includeRelations?: boolean;
  /** 是否计算神煞 */
  includeShenSha?: boolean;
  /** 是否计算五行分析（分布 + 旺相休囚死） */
  includeWuxingAnalysis?: boolean;
  /** 是否计算格局与用神分析 */
  includePatternAnalysis?: boolean;
}

// ============================================================
// 附录：运行时常量（与基础联合类型一一对应，供排盘引擎查表使用）
// ============================================================

/** 天干序列（索引 0~9 对应甲~癸） */
export const TIAN_GAN: readonly TianGan[] = [
  '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸',
] as const;

/** 地支序列（索引 0~11 对应子~亥） */
export const DI_ZHI: readonly DiZhi[] = [
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
] as const;

/** 五行序列 */
export const WU_XING: readonly WuXing[] = ['金', '木', '水', '火', '土'] as const;

/** 阳干 */
export const YANG_GAN: readonly TianGan[] = ['甲', '丙', '戊', '庚', '壬'] as const;

/** 阴干 */
export const YIN_GAN: readonly TianGan[] = ['乙', '丁', '己', '辛', '癸'] as const;

/** 阳支 */
export const YANG_ZHI: readonly DiZhi[] = ['子', '寅', '辰', '午', '申', '戌'] as const;

/** 阴支 */
export const YIN_ZHI: readonly DiZhi[] = ['丑', '卯', '巳', '未', '酉', '亥'] as const;
