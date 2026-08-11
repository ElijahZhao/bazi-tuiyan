// 中国夏令时精确日期表（对应项目大纲11.10节）
// 来源：国务院办公厅公告
// 1986-1991年期间 Asia/Shanghai 夏令时偏移为 UTC+9
export interface DSTEntry {
  year: number;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  note: string;
}

export const CHINA_DST: DSTEntry[] = [
  { year: 1986, startMonth: 5, startDay: 4, endMonth: 9, endDay: 14, note: '首年试行，开始日期特殊' },
  { year: 1987, startMonth: 4, startDay: 12, endMonth: 9, endDay: 13, note: '4月中旬第一个星期日~9月中旬第一个星期日' },
  { year: 1988, startMonth: 4, startDay: 10, endMonth: 9, endDay: 11, note: '同上规则' },
  { year: 1989, startMonth: 4, startDay: 16, endMonth: 9, endDay: 17, note: '同上规则' },
  { year: 1990, startMonth: 4, startDay: 15, endMonth: 9, endDay: 16, note: '同上规则' },
  { year: 1991, startMonth: 4, startDay: 14, endMonth: 9, endDay: 15, note: '最后一年' }
];

// 历史夏令时
export const HISTORICAL_DST: { period: string; region: string; note: string }[] = [
  { period: '1919', region: '上海、天津等地', note: '短暂实行' },
  { period: '1935-1937', region: '南京国民政府辖区', note: '抗战爆发后废弃' }
];

// 转换规则：夏令时期间，钟表时间 = 标准时间 + 1小时
// 还原时：标准时间 = 钟表时间 - 1小时
// 夏令时起止时刻均为凌晨2:00（即夏令时开始时2:00→3:00，结束时2:00→1:00）
// 1992年起全面取消

// 判断给定日期时间是否处于中国夏令时期间
export function isChinaDST(year: number, month: number, day: number, hour: number): boolean {
  const entry = CHINA_DST.find(e => e.year === year);
  if (!entry) return false;
  
  const startDate = entry.startMonth * 100 + entry.startDay;
  const endDate = entry.endMonth * 100 + entry.endDay;
  const currentDate = month * 100 + day;
  
  // 夏令时从开始日2:00到结束日2:00
  if (currentDate > startDate && currentDate < endDate) return true;
  if (currentDate === startDate && hour >= 2) return true;
  if (currentDate === endDate && hour < 2) return true;
  
  return false;
}

// 天文数据常量
// 北京时间定义：东经120°标准时 = UTC(NTSC) + 8小时
export const BEIJING_TIME_OFFSET = 8; // UTC+8

// 标准子午线经度（东经120°）
export const STANDARD_LONGITUDE = 120.0;

// 经度差修正：4分钟 × (当地经度 - 120°)
export function longitudeCorrection(longitude: number): number {
  return 4 * (longitude - STANDARD_LONGITUDE); // 返回分钟
}

// 均时差范围
// 最大值：+16分33秒（约11月3日）
// 最小值：-14分06秒（约2月11日）
// 绝对值上限：不超过17分钟
export const EOT_MAX = 16 * 60 + 33; // +16分33秒（秒）
export const EOT_MIN = -(14 * 60 + 6); // -14分06秒（秒）
export const EOT_ABS_LIMIT = 17 * 60; // 17分钟（秒）

// 均时差定义：视太阳时 - 平太阳时
// 来源：紫金山天文台、USNO

// 二十四节气黄经值（立春=315°）
// 来源：GB/T 33661-2017
export const SOLAR_TERM_LONGITUDES: Record<string, number> = {
  '立春': 315, '雨水': 330, '惊蛰': 345, '春分': 0,
  '清明': 15, '谷雨': 30, '立夏': 45, '小满': 60,
  '芒种': 75, '夏至': 90, '小暑': 105, '大暑': 120,
  '立秋': 135, '处暑': 150, '白露': 165, '秋分': 180,
  '寒露': 195, '霜降': 210, '立冬': 225, '小雪': 240,
  '大雪': 255, '冬至': 270, '小寒': 285, '大寒': 300
};

// 节气计算精度
// 1900-2100年范围内误差<1秒（VSOP87+DE440）
// 来源：寿星天文历文档（参考），以紫金山天文台数据为最终校准基准

// 干支纪日连续性
// 连续纪日起点：春秋鲁隐公三年（公元前720年）二月己巳日
// 来源：光明日报《中国古天文历法学》
export const GANZHI_START_YEAR = -720; // 公元前720年

// 常用城市经度表（用于前端城市选择器）
export const CITY_LONGITUDES: { name: string; longitude: number; latitude: number }[] = [
  { name: '北京', longitude: 116.41, latitude: 39.90 },
  { name: '上海', longitude: 121.47, latitude: 31.23 },
  { name: '广州', longitude: 113.27, latitude: 23.13 },
  { name: '深圳', longitude: 114.06, latitude: 22.55 },
  { name: '天津', longitude: 117.20, latitude: 39.13 },
  { name: '重庆', longitude: 106.55, latitude: 29.56 },
  { name: '成都', longitude: 104.07, latitude: 30.67 },
  { name: '武汉', longitude: 114.31, latitude: 30.59 },
  { name: '杭州', longitude: 120.16, latitude: 30.27 },
  { name: '南京', longitude: 118.78, latitude: 32.06 },
  { name: '西安', longitude: 108.94, latitude: 34.34 },
  { name: '长沙', longitude: 112.94, latitude: 28.23 },
  { name: '沈阳', longitude: 123.43, latitude: 41.81 },
  { name: '哈尔滨', longitude: 126.64, latitude: 45.75 },
  { name: '长春', longitude: 125.32, latitude: 43.82 },
  { name: '大连', longitude: 121.62, latitude: 38.91 },
  { name: '青岛', longitude: 120.38, latitude: 36.07 },
  { name: '济南', longitude: 117.00, latitude: 36.65 },
  { name: '郑州', longitude: 113.62, latitude: 34.75 },
  { name: '太原', longitude: 112.55, latitude: 37.87 },
  { name: '石家庄', longitude: 114.51, latitude: 38.04 },
  { name: '呼和浩特', longitude: 111.75, latitude: 40.84 },
  { name: '乌鲁木齐', longitude: 87.62, latitude: 43.83 },
  { name: '兰州', longitude: 103.83, latitude: 36.06 },
  { name: '银川', longitude: 106.23, latitude: 38.49 },
  { name: '西宁', longitude: 101.78, latitude: 36.62 },
  { name: '拉萨', longitude: 91.13, latitude: 29.65 },
  { name: '昆明', longitude: 102.83, latitude: 24.88 },
  { name: '贵阳', longitude: 106.71, latitude: 26.60 },
  { name: '南宁', longitude: 108.37, latitude: 22.82 },
  { name: '海口', longitude: 110.33, latitude: 20.03 },
  { name: '三亚', longitude: 109.51, latitude: 18.25 },
  { name: '福州', longitude: 119.30, latitude: 26.08 },
  { name: '厦门', longitude: 118.09, latitude: 24.48 },
  { name: '南昌', longitude: 115.86, latitude: 28.68 },
  { name: '合肥', longitude: 117.27, latitude: 31.86 },
  { name: '台北', longitude: 121.55, latitude: 25.03 },
  { name: '香港', longitude: 114.17, latitude: 22.32 },
  { name: '澳门', longitude: 113.55, latitude: 22.20 }
];
