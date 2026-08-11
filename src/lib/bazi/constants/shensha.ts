// 神煞查法依据表（对应项目大纲11.3节）
// 来源：参考来源6.17口诀验证 + 6.16空亡 + 规则#21羊刃

export interface ShenShaRule {
  name: string;         // 神煞名称
  source: string;       // 查法依据：日干/年干/年支/日支/月支/日柱旬空
  lookupTable: Record<string, string | string[]>;  // 查表数据
  note?: string;        // 备注
}

// 天乙贵人（查日干为主，年干为辅）
// 口诀："甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸蛇兔藏，六辛逢马虎"
export const TIANYI_GUIREN: Record<string, string[]> = {
  '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],  // 牛羊
  '乙': ['子', '申'], '己': ['子', '申'],                      // 鼠猴
  '丙': ['亥', '酉'], '丁': ['亥', '酉'],                      // 猪鸡
  '壬': ['巳', '卯'], '癸': ['巳', '卯'],                      // 蛇兔
  '辛': ['午', '寅']                                            // 马虎
};

// 文昌贵人（查日干）
// 口诀："甲乙巳午报君知，丙戊申宫丁己鸡，庚猪辛鼠壬逢虎，癸人见兔入云梯"
export const WENCHANG: Record<string, string> = {
  '甲': '巳', '乙': '午', '丙': '申', '丁': '酉',
  '戊': '申', '己': '酉', '庚': '亥', '辛': '子',
  '壬': '寅', '癸': '卯'
};

// 华盖（查年支为主，日支为辅）
// 口诀："寅午戌见戌，亥卯未见未，申子辰见辰，巳酉丑见丑"
export const HUAGAI: Record<string, string> = {
  '寅': '戌', '午': '戌', '戌': '戌',
  '亥': '未', '卯': '未', '未': '未',
  '申': '辰', '子': '辰', '辰': '辰',
  '巳': '丑', '酉': '丑', '丑': '丑'
};

// 驿马（查年支为主，日支为辅）
// 口诀："寅午戌马在申，申子辰马在寅，巳酉丑马在亥，亥卯未马在巳"
export const YIMA: Record<string, string> = {
  '寅': '申', '午': '申', '戌': '申',
  '申': '寅', '子': '寅', '辰': '寅',
  '巳': '亥', '酉': '亥', '丑': '亥',
  '亥': '巳', '卯': '巳', '未': '巳'
};

// 桃花（查年支为主，日支为辅）
// 口诀："申子辰在酉，寅午戌在卯，巳酉丑在午，亥卯未在子"
export const TAOHUA: Record<string, string> = {
  '申': '酉', '子': '酉', '辰': '酉',
  '寅': '卯', '午': '卯', '戌': '卯',
  '巳': '午', '酉': '午', '丑': '午',
  '亥': '子', '卯': '子', '未': '子'
};

// 禄神（查日干）
// 甲禄在寅、乙禄在卯、丙禄在巳、丁禄在午、戊禄在巳、己禄在午、庚禄在申、辛禄在酉、壬禄在亥、癸禄在子
export const LUSHEN: Record<string, string> = {
  '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
  '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子'
};

// 将星（查年支为主，日支为辅）
// 口诀："寅午戌见午，申子辰见子，巳酉丑见酉，亥卯未见卯"
export const JIANGXING: Record<string, string> = {
  '寅': '午', '午': '午', '戌': '午',
  '申': '子', '子': '子', '辰': '子',
  '巳': '酉', '酉': '酉', '丑': '酉',
  '亥': '卯', '卯': '卯', '未': '卯'
};

// 灾煞（查年支，将星对冲）
// "申子辰见午，寅午戌见子，巳酉丑见卯，亥卯未见酉"
export const ZAISHA: Record<string, string> = {
  '申': '午', '子': '午', '辰': '午',
  '寅': '子', '午': '子', '戌': '子',
  '巳': '卯', '酉': '卯', '丑': '卯',
  '亥': '酉', '卯': '酉', '未': '酉'
};

// 劫煞（查年支）
// "申子辰见巳，寅午戌见亥，巳酉丑见寅，亥卯未见申"
export const JIESHA: Record<string, string> = {
  '申': '巳', '子': '巳', '辰': '巳',
  '寅': '亥', '午': '亥', '戌': '亥',
  '巳': '寅', '酉': '寅', '丑': '寅',
  '亥': '申', '卯': '申', '未': '申'
};

// 孤辰寡宿（查年支）
// "亥子丑人，见寅为孤，见戌为寡；寅卯辰人，见巳为孤，见丑为寡；
//  巳午未人，见申为孤，见辰为寡；申酉戌人，见亥为孤，见未为寡"
export const GUCHEN_GUASU: Record<string, { gu: string; gua: string }> = {
  '亥': { gu: '寅', gua: '戌' }, '子': { gu: '寅', gua: '戌' }, '丑': { gu: '寅', gua: '戌' },
  '寅': { gu: '巳', gua: '丑' }, '卯': { gu: '巳', gua: '丑' }, '辰': { gu: '巳', gua: '丑' },
  '巳': { gu: '申', gua: '辰' }, '午': { gu: '申', gua: '辰' }, '未': { gu: '申', gua: '辰' },
  '申': { gu: '亥', gua: '未' }, '酉': { gu: '亥', gua: '未' }, '戌': { gu: '亥', gua: '未' }
};

// 魁罡（查日柱）
// "壬辰庚戌与庚辰，戊戌魁罡四座神"
export const KUIGANG: string[] = ['壬辰', '庚戌', '庚辰', '戊戌'];

// 天罗地网（查年支，男查天罗/女查地网）
// "戌亥为天罗，辰巳为地网"
export const TIANLUO_DIWANG: { tianluo: string[]; diwang: string[] } = {
  tianluo: ['戌', '亥'],
  diwang: ['辰', '巳']
};

// 金舆（查日干）
// "甲龙乙蛇丙戊羊，丁己猴乡庚兔藏，辛虎壬马癸牛当"
export const JINYU: Record<string, string> = {
  '甲': '辰', '乙': '巳', '丙': '未', '丁': '申',
  '戊': '未', '己': '申', '庚': '卯', '辛': '寅',
  '壬': '午', '癸': '丑'
};

// 天德贵人（查月支，部分月份查天干、部分查地支）
// 口诀："正丁二申三月壬，四辛五亥六甲逢，七癸八寅九丙位，十乙巳子庚居中"
// 正月(寅)丁(干)、二月(卯)申(支)、三月(辰)壬(干)、四月(巳)辛(干)、五月(午)亥(支)、六月(未)甲(干)
// 七月(申)癸(干)、八月(酉)寅(支)、九月(戌)丙(干)、十月(亥)乙(干)、十一月(子)巳(支)、十二月(丑)庚(干)
export const TIANDE: { month: string; target: string; isStem: boolean }[] = [
  { month: '寅', target: '丁', isStem: true },
  { month: '卯', target: '申', isStem: false },
  { month: '辰', target: '壬', isStem: true },
  { month: '巳', target: '辛', isStem: true },
  { month: '午', target: '亥', isStem: false },
  { month: '未', target: '甲', isStem: true },
  { month: '申', target: '癸', isStem: true },
  { month: '酉', target: '寅', isStem: false },
  { month: '戌', target: '丙', isStem: true },
  { month: '亥', target: '乙', isStem: true },
  { month: '子', target: '巳', isStem: false },
  { month: '丑', target: '庚', isStem: true }
];

// 月德贵人（查月支，三合局）
// "寅午戌丙，申子辰壬，巳酉丑庚，亥卯未甲"
export const YUEDE: Record<string, string> = {
  '寅': '丙', '午': '丙', '戌': '丙',
  '申': '壬', '子': '壬', '辰': '壬',
  '巳': '庚', '酉': '庚', '丑': '庚',
  '亥': '甲', '卯': '甲', '未': '甲'
};

// 羊刃位置表（对应项目大纲11.17节）
// 三体系：五阳干说/禄前一位说/帝旺位说
// 阳干三说一致，阴干三说不一致
export const YANGREN_TABLE: {
  stem: string;
  lu: string;        // 禄位
  yangGan: string | null;  // 五阳干说（阴干无刃）
  luqian: string;    // 禄前一位说（最通行，引擎默认）
  diwang: string;    // 帝旺位说
  consistent: boolean;
}[] = [
  { stem: '甲', lu: '寅', yangGan: '卯', luqian: '卯', diwang: '卯', consistent: true },
  { stem: '丙', lu: '巳', yangGan: '午', luqian: '午', diwang: '午', consistent: true },
  { stem: '戊', lu: '巳', yangGan: '午', luqian: '午', diwang: '午', consistent: true },
  { stem: '庚', lu: '申', yangGan: '酉', luqian: '酉', diwang: '酉', consistent: true },
  { stem: '壬', lu: '亥', yangGan: '子', luqian: '子', diwang: '子', consistent: true },
  { stem: '乙', lu: '卯', yangGan: null, luqian: '辰', diwang: '寅', consistent: false },
  { stem: '丁', lu: '午', yangGan: null, luqian: '未', diwang: '巳', consistent: false },
  { stem: '己', lu: '午', yangGan: null, luqian: '未', diwang: '巳', consistent: false },
  { stem: '辛', lu: '酉', yangGan: null, luqian: '戌', diwang: '申', consistent: false },
  { stem: '癸', lu: '子', yangGan: null, luqian: '丑', diwang: '亥', consistent: false }
];

// 羊刃快捷查找函数
export function getYangren(stem: string, system: 'luqian' | 'diwang' | 'yangGan' = 'luqian'): string | null {
  const entry = YANGREN_TABLE.find(e => e.stem === stem);
  if (!entry) return null;
  if (system === 'yangGan') return entry.yangGan;
  if (system === 'diwang') return entry.diwang;
  return entry.luqian;
}
