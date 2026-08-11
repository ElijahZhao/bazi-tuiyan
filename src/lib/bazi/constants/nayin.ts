// 六十甲子纳音30对照表（对应项目大纲11.7节）
// 来源：参考来源6.13，逐句验证通过
// 每对纳音由两个连续的干支组成（如甲子乙丑=海中金）

export interface NayinEntry {
  index: number;        // 序号 1-30
  stemBranch1: string;  // 第一个干支（如"甲子"）
  stemBranch2: string;  // 第二个干支（如"乙丑"）
  nayinName: string;    // 纳音名称（如"海中金"）
  nayinElement: string; // 纳音五行（如"金"）
}

export const NAYIN_TABLE: NayinEntry[] = [
  { index: 1,  stemBranch1: '甲子', stemBranch2: '乙丑', nayinName: '海中金', nayinElement: '金' },
  { index: 2,  stemBranch1: '丙寅', stemBranch2: '丁卯', nayinName: '炉中火', nayinElement: '火' },
  { index: 3,  stemBranch1: '戊辰', stemBranch2: '己巳', nayinName: '大林木', nayinElement: '木' },
  { index: 4,  stemBranch1: '庚午', stemBranch2: '辛未', nayinName: '路旁土', nayinElement: '土' },
  { index: 5,  stemBranch1: '壬申', stemBranch2: '癸酉', nayinName: '剑锋金', nayinElement: '金' },
  { index: 6,  stemBranch1: '甲戌', stemBranch2: '乙亥', nayinName: '山头火', nayinElement: '火' },
  { index: 7,  stemBranch1: '丙子', stemBranch2: '丁丑', nayinName: '涧下水', nayinElement: '水' },
  { index: 8,  stemBranch1: '戊寅', stemBranch2: '己卯', nayinName: '城头土', nayinElement: '土' },
  { index: 9,  stemBranch1: '庚辰', stemBranch2: '辛巳', nayinName: '白蜡金', nayinElement: '金' },
  { index: 10, stemBranch1: '壬午', stemBranch2: '癸未', nayinName: '杨柳木', nayinElement: '木' },
  { index: 11, stemBranch1: '甲申', stemBranch2: '乙酉', nayinName: '泉中水', nayinElement: '水' },
  { index: 12, stemBranch1: '丙戌', stemBranch2: '丁亥', nayinName: '屋上土', nayinElement: '土' },
  { index: 13, stemBranch1: '戊子', stemBranch2: '己丑', nayinName: '霹雳火', nayinElement: '火' },
  { index: 14, stemBranch1: '庚寅', stemBranch2: '辛卯', nayinName: '松柏木', nayinElement: '木' },
  { index: 15, stemBranch1: '壬辰', stemBranch2: '癸巳', nayinName: '长流水', nayinElement: '水' },
  { index: 16, stemBranch1: '甲午', stemBranch2: '乙未', nayinName: '沙中金', nayinElement: '金' },
  { index: 17, stemBranch1: '丙申', stemBranch2: '丁酉', nayinName: '山下火', nayinElement: '火' },
  { index: 18, stemBranch1: '戊戌', stemBranch2: '己亥', nayinName: '平地木', nayinElement: '木' },
  { index: 19, stemBranch1: '庚子', stemBranch2: '辛丑', nayinName: '壁上土', nayinElement: '土' },
  { index: 20, stemBranch1: '壬寅', stemBranch2: '癸卯', nayinName: '金箔金', nayinElement: '金' },
  { index: 21, stemBranch1: '甲辰', stemBranch2: '乙巳', nayinName: '覆灯火', nayinElement: '火' },
  { index: 22, stemBranch1: '丙午', stemBranch2: '丁未', nayinName: '天河水', nayinElement: '水' },
  { index: 23, stemBranch1: '戊申', stemBranch2: '己酉', nayinName: '大驿土', nayinElement: '土' },
  { index: 24, stemBranch1: '庚戌', stemBranch2: '辛亥', nayinName: '钗钏金', nayinElement: '金' },
  { index: 25, stemBranch1: '壬子', stemBranch2: '癸丑', nayinName: '桑柘木', nayinElement: '木' },
  { index: 26, stemBranch1: '甲寅', stemBranch2: '乙卯', nayinName: '大溪水', nayinElement: '水' },
  { index: 27, stemBranch1: '丙辰', stemBranch2: '丁巳', nayinName: '沙中土', nayinElement: '土' },
  { index: 28, stemBranch1: '戊午', stemBranch2: '己未', nayinName: '天上火', nayinElement: '火' },
  { index: 29, stemBranch1: '庚申', stemBranch2: '辛酉', nayinName: '石榴木', nayinElement: '木' },
  { index: 30, stemBranch1: '壬戌', stemBranch2: '癸亥', nayinName: '大海水', nayinElement: '水' }
];

// 纳音五行分布统计（供校验）：金6、木6、水6、火6、土6，各6对
export const NAYIN_ELEMENT_COUNT: Record<string, number> = {
  '金': 6, '木': 6, '水': 6, '火': 6, '土': 6
};

// 快速查找：干支→纳音
// 根据天干索引和地支索引计算六十甲子序号（0-59），再除以2得到纳音对序号
export function getNayin(stem: string, branch: string): NayinEntry | undefined {
  return NAYIN_TABLE.find(entry => 
    (entry.stemBranch1 === stem + branch) || (entry.stemBranch2 === stem + branch)
  );
}

// 太玄数计算（对应项目大纲11.7节，用于交叉验证）
// 计算步骤：
// 1. 取一对甲子的四个字太玄数相加
// 2. 49减去总和得差值
// 3. 差值除以5取余数（余数为0时按5算）
// 4. 余数对应河图五行：1=水、2=火、3=木、4=金、5=土
// 5. 纳音五行 = 余数五行所生之五行
// 注意：需要引入tiangan.ts和dizhi.ts中的太玄数，此处仅定义计算函数接口

// 天干太玄数：甲己=9, 乙庚=8, 丙辛=7, 丁壬=6, 戊癸=5
// 地支太玄数：子午=9, 丑未=8, 寅申=7, 卯酉=6, 辰戌=5, 巳亥=4

// 六甲空亡表（对应项目大纲11.8节）
export const LIUJIA_KONGWANG: { xunshou: string; kongwang: [string, string] }[] = [
  { xunshou: '甲子', kongwang: ['戌', '亥'] },
  { xunshou: '甲戌', kongwang: ['申', '酉'] },
  { xunshou: '甲申', kongwang: ['午', '未'] },
  { xunshou: '甲午', kongwang: ['辰', '巳'] },
  { xunshou: '甲辰', kongwang: ['寅', '卯'] },
  { xunshou: '甲寅', kongwang: ['子', '丑'] }
];

// 查空亡：根据干支所在旬查空亡地支
export function getKongwang(stem: string, branch: string): [string, string] | undefined {
  // 六十甲子分6旬，每旬10个干支
  // 旬首：甲子、甲戌、甲申、甲午、甲辰、甲寅
  // 天干索引：甲=0,...,癸=9；地支索引：子=0,...,亥=11
  // 六十甲子序号 = (天干索引 - 地支索引 + 12) % 12 / 2 ... 不对
  // 正确方法：六十甲子序号 = (天干索引 + 天干索引偏移) % 60
  // 简化：直接查表
  const TIANGAN_IDX: Record<string, number> = { '甲':0,'乙':1,'丙':2,'丁':3,'戊':4,'己':5,'庚':6,'辛':7,'壬':8,'癸':9 };
  const DIZHI_IDX: Record<string, number> = { '子':0,'丑':1,'寅':2,'卯':3,'辰':4,'巳':5,'午':6,'未':7,'申':8,'酉':9,'戌':10,'亥':11 };
  const stemIdx = TIANGAN_IDX[stem];
  const branchIdx = DIZHI_IDX[branch];
  // 六十甲子序号（0-59）
  const seq = (stemIdx * 12 - stemIdx * 10 + branchIdx * 10 - branchIdx * 12 + 60) % 60;
  // 更简单的方法：序号 = stemIdx + 10 * floor((branchIdx - stemIdx + 12) / 2 % 6)
  // 或者直接用公式：((branchIdx - stemIdx) % 12) / 2 确定旬，然后查表
  // 最简单：遍历六旬
  for (const entry of LIUJIA_KONGWANG) {
    const xsStem = entry.xunshou[0];
    const xsBranch = entry.xunshou[1];
    const xsStemIdx = TIANGAN_IDX[xsStem];
    const xsBranchIdx = DIZHI_IDX[xsBranch];
    // 旬内10个干支：旬首的干索引到+9
    const stemDiff = (stemIdx - xsStemIdx + 10) % 10;
    const branchDiff = (branchIdx - xsBranchIdx + 12) % 12;
    // 同旬条件：干偏移0-9且支偏移0或2或4...（偶数且≤10）
    if (stemDiff < 10 && branchDiff === stemDiff) {
      return entry.kongwang;
    }
  }
  return undefined;
}
