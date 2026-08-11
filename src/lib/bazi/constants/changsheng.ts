// 十二长生十二宫名称
export const CHANGSHENG_NAMES = [
  '长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'
] as const;

// 阳干十二长生表（顺行，无争议）
// 对应项目大纲11.13节
// 说明：丙火与戊土共享同一长生位（寅），因"火土同长生"——火生土，故火的长生位亦是土的长生位
export const YANGGAN_CHANGSHENG: Record<string, string[]> = {
  // 长生、沐浴、冠带、临官、帝旺、衰、病、死、墓、绝、胎、养
  '甲': ['亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌'],
  '丙': ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'],
  '戊': ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'], // 火土同长生
  '庚': ['巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰'],
  '壬': ['申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未']
};

// 阴干十二长生表（逆行，标注参考性——存在学术争议）
// 部分流派认为阴干也顺行，与阳干同起始
export const YINGAN_CHANGSHENG: Record<string, { 
  changsheng: string; 
  diwang: string; 
  direction: string;
  note: string;
}> = {
  '乙': { changsheng: '午', diwang: '寅', direction: '逆行', note: '争议：部分流派认为阴干也顺行，与阳干同起始' },
  '丁': { changsheng: '酉', diwang: '巳', direction: '逆行', note: '同上' },
  '己': { changsheng: '酉', diwang: '巳', direction: '逆行', note: '同上（火土同长生）' },
  '辛': { changsheng: '子', diwang: '申', direction: '逆行', note: '同上' },
  '癸': { changsheng: '卯', diwang: '亥', direction: '逆行', note: '同上' }
};

// 查十二长生状态
// 参数：天干、地支
// 返回：十二长生状态名称，若为阴干则附加"(参考)"标注
export function getChangsheng(stem: string, branch: string, useYinGan: boolean = false): string | null {
  // 先查阳干表
  const yangTable = YANGGAN_CHANGSHENG[stem];
  if (yangTable) {
    const idx = yangTable.indexOf(branch);
    if (idx >= 0) return CHANGSHENG_NAMES[idx];
  }
  
  // 若启用阴干逆行表
  if (useYinGan) {
    const yinInfo = YINGAN_CHANGSHENG[stem];
    if (yinInfo) {
      // 阴干逆行：从长生位开始逆行十二地支
      const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
      const DIZHI_INDEX: Record<string, number> = {};
      DIZHI.forEach((d, i) => DIZHI_INDEX[d] = i);
      
      const csIdx = DIZHI_INDEX[yinInfo.changsheng];
      const brIdx = DIZHI_INDEX[branch];
      // 逆行：位置 = (csIdx - (brIdx - csIdx)) mod 12 → 不对
      // 逆行意味着从长生位开始，地支逆序排列
      // 长生=csIdx, 沐浴=csIdx-1, 冠带=csIdx-2, ...
      const offset = ((csIdx - brIdx) % 12 + 12) % 12;
      return CHANGSHENG_NAMES[offset] + '(参考)';
    }
  }
  
  return null;
}
