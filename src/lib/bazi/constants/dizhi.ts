// 地支
export const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

// 地支索引（子=0, 丑=1, ..., 亥=11）
export const DIZHI_INDEX: Record<string, number> = {
  '子': 0, '丑': 1, '寅': 2, '卯': 3, '辰': 4, '巳': 5,
  '午': 6, '未': 7, '申': 8, '酉': 9, '戌': 10, '亥': 11
};

// 地支阴阳（子寅辰午申戌为阳，丑卯巳未酉亥为阴）
export const DIZHI_YINYANG: Record<string, string> = {
  '子': '阳', '丑': '阴', '寅': '阳', '卯': '阴', '辰': '阳', '巳': '阴',
  '午': '阳', '未': '阴', '申': '阳', '酉': '阴', '戌': '阳', '亥': '阴'
};

// 地支五行（亥子水、寅卯木、巳午火、申酉金、辰戌丑未土）
export const DIZHI_WUXING: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

// 地支太玄数（对应项目大纲11.7节）
// 子午=9, 丑未=8, 寅申=7, 卯酉=6, 辰戌=5, 巳亥=4
export const DIZHI_TAIXUAN: Record<string, number> = {
  '子': 9, '午': 9,
  '丑': 8, '未': 8,
  '寅': 7, '申': 7,
  '卯': 6, '酉': 6,
  '辰': 5, '戌': 5,
  '巳': 4, '亥': 4
};

// 地支对应时辰（小时范围）
export const DIZHI_HOUR_RANGE: Record<string, [number, number]> = {
  '子': [23, 1],   // 23:00-01:00 (跨日)
  '丑': [1, 3],    // 01:00-03:00
  '寅': [3, 5],    // 03:00-05:00
  '卯': [5, 7],    // 05:00-07:00
  '辰': [7, 9],    // 07:00-09:00
  '巳': [9, 11],   // 09:00-11:00
  '午': [11, 13],  // 11:00-13:00
  '未': [13, 15],  // 13:00-15:00
  '申': [15, 17],  // 15:00-17:00
  '酉': [17, 19],  // 17:00-19:00
  '戌': [19, 21],  // 19:00-21:00
  '亥': [21, 23]   // 21:00-23:00
};

// 月支与节气对应表（对应项目大纲11.11节）
// 月支由"节"划分，每个"节"的开始时刻即为新月支的开始
export const YUEZHI_SOLAR_TERM: { yuezhi: string; startTerm: string; longitude: [number, number] }[] = [
  { yuezhi: '寅', startTerm: '立春', longitude: [315, 345] },
  { yuezhi: '卯', startTerm: '惊蛰', longitude: [345, 15] },   // 跨0°
  { yuezhi: '辰', startTerm: '清明', longitude: [15, 45] },
  { yuezhi: '巳', startTerm: '立夏', longitude: [45, 75] },
  { yuezhi: '午', startTerm: '芒种', longitude: [75, 105] },
  { yuezhi: '未', startTerm: '小暑', longitude: [105, 135] },
  { yuezhi: '申', startTerm: '立秋', longitude: [135, 165] },
  { yuezhi: '酉', startTerm: '白露', longitude: [165, 195] },
  { yuezhi: '戌', startTerm: '寒露', longitude: [195, 225] },
  { yuezhi: '亥', startTerm: '立冬', longitude: [225, 255] },
  { yuezhi: '子', startTerm: '大雪', longitude: [255, 285] },
  { yuezhi: '丑', startTerm: '小寒', longitude: [285, 315] }
];

// 十二节（用于起运计算，对应规则#11）
// 节用于起运计算，气不数
export const SHI_ER_JIE = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'] as const;

// 十二气（不用于起运计算）
export const SHI_ER_QI = ['雨水', '春分', '谷雨', '小满', '夏至', '大暑', '处暑', '秋分', '霜降', '小雪', '冬至', '大寒'] as const;

// 二十四节气完整列表（按顺序）
export const SOLAR_TERMS = [
  '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
  '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
  '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
] as const;

// 节气黄经值（立春=315°，每个节气相差15°）
export const SOLAR_TERM_LONGITUDE: Record<string, number> = {
  '立春': 315, '雨水': 330, '惊蛰': 345, '春分': 0,
  '清明': 15, '谷雨': 30, '立夏': 45, '小满': 60,
  '芒种': 75, '夏至': 90, '小暑': 105, '大暑': 120,
  '立秋': 135, '处暑': 150, '白露': 165, '秋分': 180,
  '寒露': 195, '霜降': 210, '立冬': 225, '小雪': 240,
  '大雪': 255, '冬至': 270, '小寒': 285, '大寒': 300
};

// 地支六合（对应项目大纲11.14节）
// 子丑合土、寅亥合木、卯戌合火、辰酉合金、巳申合水、午未合火/土(争议)
export const DIZHI_LIUHE: { branches: [string, string]; element: string; note?: string }[] = [
  { branches: ['子', '丑'], element: '土' },
  { branches: ['寅', '亥'], element: '木' },
  { branches: ['卯', '戌'], element: '火' },
  { branches: ['辰', '酉'], element: '金' },
  { branches: ['巳', '申'], element: '水' },
  { branches: ['午', '未'], element: '火', note: '争议：有说化火，有说化土' }
];

// 地支六冲（对应项目大纲11.14节）
export const DIZHI_LIUCHONG: { branches: [string, string]; description: string }[] = [
  { branches: ['子', '午'], description: '水火相冲' },
  { branches: ['丑', '未'], description: '土土相冲（湿燥之争）' },
  { branches: ['寅', '申'], description: '木金相冲' },
  { branches: ['卯', '酉'], description: '木金相冲' },
  { branches: ['辰', '戌'], description: '土土相冲（湿燥之争）' },
  { branches: ['巳', '亥'], description: '火水相冲' }
];

// 三合局（对应项目大纲11.14节）
export const DIZHI_SANHE: { branches: [string, string, string]; element: string; zhongshen: string }[] = [
  { branches: ['申', '子', '辰'], element: '水', zhongshen: '子' },
  { branches: ['寅', '午', '戌'], element: '火', zhongshen: '午' },
  { branches: ['巳', '酉', '丑'], element: '金', zhongshen: '酉' },
  { branches: ['亥', '卯', '未'], element: '木', zhongshen: '卯' }
];

// 半三合（8组，对应项目大纲11.14节）
export const DIZHI_BANSANHE: { branches: [string, string]; type: string; element: string }[] = [
  { branches: ['申', '子'], type: '生旺半合', element: '水' },
  { branches: ['子', '辰'], type: '旺墓半合', element: '水' },
  { branches: ['寅', '午'], type: '生旺半合', element: '火' },
  { branches: ['午', '戌'], type: '旺墓半合', element: '火' },
  { branches: ['巳', '酉'], type: '生旺半合', element: '金' },
  { branches: ['酉', '丑'], type: '旺墓半合', element: '金' },
  { branches: ['亥', '卯'], type: '生旺半合', element: '木' },
  { branches: ['卯', '未'], type: '旺墓半合', element: '木' }
];

// 三会局（对应项目大纲11.14节）
export const DIZHI_SANHUI: { branches: [string, string, string]; element: string; direction: string }[] = [
  { branches: ['寅', '卯', '辰'], element: '木', direction: '东方' },
  { branches: ['巳', '午', '未'], element: '火', direction: '南方' },
  { branches: ['申', '酉', '戌'], element: '金', direction: '西方' },
  { branches: ['亥', '子', '丑'], element: '水', direction: '北方' }
];

// 三刑（4类，对应项目大纲11.14节）
export const DIZHI_SANXING: { type: string; branches: [string, string][]; description: string }[] = [
  { type: '无恩之刑', branches: [['寅','巳'], ['巳','申'], ['申','寅']], description: '忘恩负义' },
  { type: '恃势之刑', branches: [['丑','戌'], ['戌','未'], ['未','丑']], description: '仗势欺人' },
  { type: '无礼之刑', branches: [['子','卯'], ['卯','子']], description: '无礼之举' },
  { type: '自刑', branches: [['辰','辰'], ['午','午'], ['酉','酉'], ['亥','亥']], description: '自我刑伤' }
];

// 六害（6组）
export const DIZHI_LIUHAI: [string, string][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌']
];

// 相破（6组）
export const DIZHI_XIANGPO: [string, string][] = [
  ['子', '酉'], ['丑', '辰'], ['寅', '亥'], ['卯', '午'], ['巳', '申'], ['未', '戌']
];

// 暗合（核心四组+争议组，对应规则#24）
// 原理：藏干天干五合
export const DIZHI_ANHE: { branches: [string, string]; hiddenStems: [string, string]; note?: string }[] = [
  { branches: ['寅', '丑'], hiddenStems: ['甲', '己'], note: '核心组' },
  { branches: ['午', '亥'], hiddenStems: ['丁', '壬'], note: '核心组' },
  { branches: ['卯', '申'], hiddenStems: ['乙', '庚'], note: '核心组' },
  { branches: ['子', '巳'], hiddenStems: ['癸', '戊'], note: '核心组' },
  { branches: ['巳', '戌'], hiddenStems: ['丙', '辛'], note: '争议组' }
];

// 拱夹（对应项目大纲11.21节）
// 拱=三合局首尾两支缺中神
export const DIZHI_GONG: { branches: [string, string]; virtual: string; element: string }[] = [
  { branches: ['申', '辰'], virtual: '子', element: '水' },
  { branches: ['寅', '戌'], virtual: '午', element: '火' },
  { branches: ['巳', '丑'], virtual: '酉', element: '金' },
  { branches: ['亥', '未'], virtual: '卯', element: '木' }
];

// 夹=三会局首尾两支缺中神
export const DIZHI_JIA: { branches: [string, string]; virtual: string; element: string }[] = [
  { branches: ['寅', '辰'], virtual: '卯', element: '木' },
  { branches: ['巳', '未'], virtual: '午', element: '火' },
  { branches: ['申', '戌'], virtual: '酉', element: '金' },
  { branches: ['亥', '丑'], virtual: '子', element: '水' }
];
