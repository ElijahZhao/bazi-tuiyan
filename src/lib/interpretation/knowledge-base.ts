/**
 * 古法断语知识库
 *
 * 纯前端内置规则库，零臆造，每条断语标注出处古籍及卷目。
 * 按 BaziChart 的命局特征匹配输出断语。
 *
 * 来源：12部古籍原典（对应参考来源文件第三节、第六节）
 * 对应：项目大纲 第五节·解读模块设计 5.1
 */

import type {
  BaziChart,
  Stem,
  Element,
  TenGod,
} from "@/lib/engine/types";
import { STEM_ELEMENTS, STEM_YIN_YANG } from "@/lib/engine/constants";

// ============================================================
// 类型定义
// ============================================================

export interface InterpretationEntry {
  /** 断语类别 */
  category: string;
  /** 断语标题 */
  title: string;
  /** 断语正文 */
  content: string;
  /** 出处古籍 */
  source: string;
  /** 出处卷目/章节 */
  sourceChapter: string;
}

export interface InterpretationSection {
  /** 板块名称 */
  name: string;
  /** 板块图标标签色 */
  tagColor: string;
  /** 该板块下的断语条目 */
  entries: InterpretationEntry[];
}

// ============================================================
// 天干特性论
// 来源：《滴天髓阐微》[参考来源 6.20]
// ============================================================

const STEM_CHARACTER: Record<Stem, { characteristic: string; source: string; chapter: string }> = {
  甲: {
    characteristic: "甲木参天，脱胎要火。春不容金，秋不容土。火炽乘龙，水宕骑虎。地润天和，植立千古。",
    source: "《滴天髓阐微》",
    chapter: "天干十论·论甲木",
  },
  乙: {
    characteristic: "乙木虽柔，刲羊解牛。怀丁抱丙，跨凤乘猴。虚湿之地，骑马亦忧。藤萝系甲，可春可秋。",
    source: "《滴天髓阐微》",
    chapter: "天干十论·论乙木",
  },
  丙: {
    characteristic: "丙火猛烈，欺霜侮雪。煅庚金，逢辛反怯。土众生慈，水猖显节。虎马犬乡，甲来成灭。",
    source: "《滴天髓阐微》",
    chapter: "天干十论·论丙火",
  },
  丁: {
    characteristic: "丁火柔中，内性昭融。抱乙而孝，合壬而忠。旺而不烈，衰而不穷。如有嫡母，可秋可冬。",
    source: "《滴天髓阐微》",
    chapter: "天干十论·论丁火",
  },
  戊: {
    characteristic: "戊土固重，既中且正。静翕动辟，万物司命。水润物生，火燥物病。若在艮坤，怕冲宜静。",
    source: "《滴天髓阐微》",
    chapter: "天干十论·论戊土",
  },
  己: {
    characteristic: "己土卑湿，中正蓄藏。不愁木盛，不畏水狂。火少火晦，火多火光。若要物旺，宜助宜帮。",
    source: "《滴天髓阐微》",
    chapter: "天干十论·论己土",
  },
  庚: {
    characteristic: "庚金带煞，刚健为最。得水而清，得火而锐。土润则生，土干则脆。能赢甲兄，输于乙妹。",
    source: "《滴天髓阐微》",
    chapter: "天干十论·论庚金",
  },
  辛: {
    characteristic: "辛金软弱，温润而清。畏土之叠，乐水之盈。能扶社稷，能救生灵。热则喜母，寒则喜丁。",
    source: "《滴天髓阐微》",
    chapter: "天干十论·论辛金",
  },
  壬: {
    characteristic: "壬水通河，能泄金气。刚中之德，周流不滞。通根透癸，冲天奔地。化则有情，从则相济。",
    source: "《滴天髓阐微》",
    chapter: "天干十论·论壬水",
  },
  癸: {
    characteristic: "癸水至弱，达于天津。得龙而润，功化斯神。不愁火土，不论庚辛。合戊见火，化象斯真。",
    source: "《滴天髓阐微》",
    chapter: "天干十论·论癸水",
  },
};

// ============================================================
// 调候用神
// 来源：《穷通宝鉴》[参考来源 3.4]
// ============================================================

interface TiaoHouRule {
  condition: string;
  advice: string;
  source: string;
  chapter: string;
}

const TIAO_HOU_MAP: Record<string, TiaoHouRule> = {
  // 甲木调候
  "甲_寅": { condition: "甲木生于寅月（初春）", advice: "初春尚寒，以丙火温暖为上，次用癸水润之。火多则庚金伐木以制之。", source: "《穷通宝鉴》", chapter: "卷一·论木·甲木" },
  "甲_卯": { condition: "甲木生于卯月（仲春）", advice: "阳和启蛰，木气方盛。以庚金伐木为用，取丁火制金。木旺金少，富贵之命。", source: "《穷通宝鉴》", chapter: "卷一·论木·甲木" },
  "甲_辰": { condition: "甲木生于辰月（季春）", advice: "木气已老，木旺非庚不克。先用庚金，次取壬水。", source: "《穷通宝鉴》", chapter: "卷一·论木·甲木" },
  "甲_巳": { condition: "甲木生于巳月（初夏）", advice: "木性枯焦，以癸水润木为主。次取丁火制庚金护木。", source: "《穷通宝鉴》", chapter: "卷一·论木·甲木" },
  "甲_午": { condition: "甲木生于午月（仲夏）", advice: "木性虚焦，先取癸水，次取丁火。木衰无水，枯槁之象。", source: "《穷通宝鉴》", chapter: "卷一·论木·甲木" },
  "甲_申": { condition: "甲木生于申月（初秋）", advice: "秋气已深，木气渐衰。以丁火制庚金为要，次用壬水化金生木。", source: "《穷通宝鉴》", chapter: "卷一·论木·甲木" },
  "甲_酉": { condition: "甲木生于酉月（仲秋）", advice: "木气已凋，以丁火制金为上，次取壬水。", source: "《穷通宝鉴》", chapter: "卷一·论木·甲木" },
  "甲_亥": { condition: "甲木生于亥月（初冬）", advice: "水旺木漂，先取庚金伐木，次取戊土制水。庚戊两透，富贵之命。", source: "《穷通宝鉴》", chapter: "卷一·论木·甲木" },
  "甲_子": { condition: "甲木生于子月（仲冬）", advice: "水冷木寒，以丁火温暖为主，次取庚金。", source: "《穷通宝鉴》", chapter: "卷一·论木·甲木" },
  "甲_丑": { condition: "甲木生于丑月（季冬）", advice: "天寒地冻，以丁火融冰解冻为主，次取庚金。", source: "《穷通宝鉴》", chapter: "卷一·论木·甲木" },
  // 丙火调候
  "丙_寅": { condition: "丙火生于寅月（初春）", advice: "丙火生于寅月，壬水为用，庚金发水之源。", source: "《穷通宝鉴》", chapter: "卷二·论火·丙火" },
  "丙_巳": { condition: "丙火生于巳月（初夏）", advice: "火旺之极，以壬水为制，次取庚金生水。", source: "《穷通宝鉴》", chapter: "卷二·论火·丙火" },
  "丙_午": { condition: "丙火生于午月（仲夏）", advice: "火势太旺，以壬水为制，庚金为佐。", source: "《穷通宝鉴》", chapter: "卷二·论火·丙火" },
  "丙_亥": { condition: "丙火生于亥月（初冬）", advice: "丙火微弱，以甲木生火为要，次取壬水。壬甲两透，富贵之命。", source: "《穷通宝鉴》", chapter: "卷二·论火·丙火" },
  "丙_子": { condition: "丙火生于子月（仲冬）", advice: "冬月丙火，以甲木生火为上，次取壬水。", source: "《穷通宝鉴》", chapter: "卷二·论火·丙火" },
  "丙_丑": { condition: "丙火生于丑月（季冬）", advice: "寒极用甲木生火，次取壬水。", source: "《穷通宝鉴》", chapter: "卷二·论火·丙火" },
  // 戊土调候
  "戊_寅": { condition: "戊土生于寅月（初春）", advice: "戊土生于寅月，丙火暖土为用，次取癸水润土。甲木旺则用庚金制之。", source: "《穷通宝鉴》", chapter: "卷三·论土·戊土" },
  "戊_巳": { condition: "戊土生于巳月（初夏）", advice: "戊土生于巳月，火炎土燥，以壬水为制，次取甲木疏土。", source: "《穷通宝鉴》", chapter: "卷三·论土·戊土" },
  "戊_午": { condition: "戊土生于午月（仲夏）", advice: "戊土生于午月，火炎土燥，以壬水为上，次取甲木。", source: "《穷通宝鉴》", chapter: "卷三·论土·戊土" },
  "戊_亥": { condition: "戊土生于亥月（初冬）", advice: "戊土生于亥月，以甲丙为用。甲木疏土，丙火暖土。", source: "《穷通宝鉴》", chapter: "卷三·论土·戊土" },
  "戊_子": { condition: "戊土生于子月（仲冬）", advice: "戊土生于子月，以丙火暖土为主，次取甲木。", source: "《穷通宝鉴》", chapter: "卷三·论土·戊土" },
  // 庚金调候
  "庚_寅": { condition: "庚金生于寅月（初春）", advice: "庚金生于寅月，以丁火炼金为要，次取甲木引丁。", source: "《穷通宝鉴》", chapter: "卷四·论金·庚金" },
  "庚_申": { condition: "庚金生于申月（初秋）", advice: "庚金生于申月，金旺之极，以丁火炼金为主，甲木引丁。", source: "《穷通宝鉴》", chapter: "卷四·论金·庚金" },
  "庚_酉": { condition: "庚金生于酉月（仲秋）", advice: "庚金生于酉月，金旺以丁火炼之，次取甲木。", source: "《穷通宝鉴》", chapter: "卷四·论金·庚金" },
  "庚_子": { condition: "庚金生于子月（仲冬）", advice: "庚金生于子月，金寒水冷，以丁火温暖为主，次取甲木。", source: "《穷通宝鉴》", chapter: "卷四·论金·庚金" },
  "庚_丑": { condition: "庚金生于丑月（季冬）", advice: "庚金生于丑月，金寒土冻，以丙火暖金为上，次取丁火。", source: "《穷通宝鉴》", chapter: "卷四·论金·庚金" },
  // 壬水调候
  "壬_寅": { condition: "壬水生于寅月（初春）", advice: "壬水生于寅月，水弱木旺，以庚金生水为要，次取戊土制水。", source: "《穷通宝鉴》", chapter: "卷五·论水·壬水" },
  "壬_巳": { condition: "壬水生于巳月（初夏）", advice: "壬水生于巳月，水弱火旺，以辛金生水为上，次取壬水比肩。", source: "《穷通宝鉴》", chapter: "卷五·论水·壬水" },
  "壬_午": { condition: "壬水生于午月（仲夏）", advice: "壬水生于午月，火旺水衰，以辛金生水为要，次取壬水。", source: "《穷通宝鉴》", chapter: "卷五·论水·壬水" },
  "壬_亥": { condition: "壬水生于亥月（初冬）", advice: "壬水生于亥月，水旺之极，以戊土制水为上，次取丁火暖局。", source: "《穷通宝鉴》", chapter: "卷五·论水·壬水" },
  "壬_子": { condition: "壬水生于子月（仲冬）", advice: "壬水生于子月，水旺极，以戊土制水为主，次取丙火暖局。", source: "《穷通宝鉴》", chapter: "卷五·论水·壬水" },
};

// ============================================================
// 十神配置断语
// 来源：《渊海子平》[参考来源 6.4]
// ============================================================

const TEN_GOD_ANALYSIS: Record<TenGod, { desc: string; source: string; chapter: string }> = {
  正官: {
    desc: "正官者，六格之先。喜身旺、印绶、财星，忌伤官、七杀、刑冲破害。正官只喜一位，多则不宜。",
    source: "《渊海子平》",
    chapter: "卷三·论正官",
  },
  七杀: {
    desc: "七杀者，偏官也。喜身旺合杀、食神制杀，忌财生杀党、官杀混杂。身强杀浅者大贵，身弱杀重者大凶。",
    source: "《渊海子平》",
    chapter: "卷三·论七杀",
  },
  正印: {
    desc: "正印者，生我之神。喜官星生印，忌财星坏印。印绶之人，聪明多智，好读书，有慈心。",
    source: "《渊海子平》",
    chapter: "卷三·论印绶",
  },
  偏印: {
    desc: "偏印者，枭神也。见食神则为枭神夺食，主孤僻寡合。偏印喜见偏财制之，忌见食神。",
    source: "《渊海子平》",
    chapter: "卷三·论偏印",
  },
  正财: {
    desc: "正财者，我克之神。喜身旺，忌比劫。财旺生官，富贵双全。财多身弱，反为财累。",
    source: "《渊海子平》",
    chapter: "卷三·论正财",
  },
  偏财: {
    desc: "偏财者，众人之财也。偏财喜身旺官旺，忌比劫争财。偏财格多主意外之财、经商之能。",
    source: "《渊海子平》",
    chapter: "卷三·论偏财",
  },
  食神: {
    desc: "食神者，我生之神。喜身旺，忌见枭神夺食。食神生财，富贵之基。食神制杀，威权之命。",
    source: "《渊海子平》",
    chapter: "卷三·论食神",
  },
  伤官: {
    desc: "伤官者，伤正官之神。喜佩印制之，或生财化之。伤官见官，为祸百端。伤官伤尽，反主大贵。",
    source: "《渊海子平》",
    chapter: "卷三·论伤官",
  },
  比肩: {
    desc: "比肩者，同类之朋。身弱喜比肩助之，身旺忌比肩争财。月令建禄，多主自力更生。",
    source: "《渊海子平》",
    chapter: "卷三·论比肩",
  },
  劫财: {
    desc: "劫财者，争财之神。身弱则喜，身旺则忌。劫财逢羊刃，主刚烈果断。羊刃无制，多主灾祸。",
    source: "《渊海子平》",
    chapter: "卷三·论劫财",
  },
};

// ============================================================
// 神煞断语
// 来源：《三命通会》[参考来源 6.17]
// ============================================================

const SHENSHA_INTERPRETATION: Record<string, { desc: string; source: string; chapter: string }> = {
  天乙贵人: {
    desc: "天乙者，天上之神也。其神最尊贵，所至之处，一切凶煞隐然而避。命带天乙贵人，主人聪明智慧，近贵之命。",
    source: "《三命通会》",
    chapter: "卷二·论天乙贵人",
  },
  文昌: {
    desc: "文昌者，天星也。主聪明好学，文章振发。命带文昌，多主学业有成，文笔出众。",
    source: "《三命通会》",
    chapter: "卷二·论文昌",
  },
  华盖: {
    desc: "华盖者，天星也。主孤高艺术，聪明伶俐。命带华盖，多主性情孤僻，好文学艺术，僧道之缘。",
    source: "《三命通会》",
    chapter: "卷二·论华盖",
  },
  驿马: {
    desc: "驿马者，奔波之神也。主迁流走动，外出旅行。命带驿马，多主奔波劳碌，或在外地发展。",
    source: "《三命通会》",
    chapter: "卷二·论驿马",
  },
  桃花: {
    desc: "桃花者，风流之星也。咸池名桃花，主风流多情，容貌俊秀。命带桃花，多主人缘好，但须防感情波折。",
    source: "《三命通会》",
    chapter: "卷二·论咸池",
  },
  将星: {
    desc: "将星者，权力之星也。主威权，有领导力。命带将星，多主武职或管理之才。",
    source: "《三命通会》",
    chapter: "卷二·论将星",
  },
  天德贵人: {
    desc: "天德者，天恩之星也。主一生安逸，不犯刑章。命带天德，多主心慈好善，逢凶化吉。",
    source: "《三命通会》",
    chapter: "卷二·论天德",
  },
  月德贵人: {
    desc: "月德者，月恩之星也。主逢凶化吉，万事安然。命带月德贵人，多主一生少病少灾。",
    source: "《三命通会》",
    chapter: "卷二·论月德",
  },
  金舆: {
    desc: "金舆者，天子之车也。主富贵荣华，妻贤子孝。命带金舆，多主有车马之福。",
    source: "《三命通会》",
    chapter: "卷二·论金舆",
  },
  魁罡: {
    desc: "魁罡者，刚烈之星也。主性情刚毅，有威权。庚辰、壬辰、庚戌、戊戌四日为魁罡。忌见财官，见则减福。",
    source: "《三命通会》",
    chapter: "卷二·论魁罡",
  },
};

// ============================================================
// 格局顺逆用断语
// 来源：《子平真诠》[参考来源 6.5, 6.7]
// ============================================================

const PATTERN_SHUN_NI: Record<string, { desc: string; source: string; chapter: string }> = {
  正官格: {
    desc: "正官格顺用：喜财生、印护，忌伤官破官。财印不并立，须看孰轻孰重。正官佩印，贵命之征。",
    source: "《子平真诠》",
    chapter: "卷二·论正官",
  },
  七杀格: {
    desc: "七杀格逆用：喜食神制杀、羊刃合杀，忌财党杀。身杀两停，大贵之命。杀重身轻，夭折之患。",
    source: "《子平真诠》",
    chapter: "卷二·论七杀",
  },
  食神格: {
    desc: "食神格顺用：喜财星相生，忌枭神夺食。食神生财，富命之征。食神制杀，权贵之命。",
    source: "《子平真诠》",
    chapter: "卷二·论食神",
  },
  伤官格: {
    desc: "伤官格逆用：喜佩印制之、生财化之。伤官伤尽，反主大贵。伤官见官，为祸百端。",
    source: "《子平真诠》",
    chapter: "卷二·论伤官",
  },
  正财格: {
    desc: "正财格顺用：喜身旺官旺，忌比劫争财。财旺生官，富贵双全。财多身弱，富屋贫人。",
    source: "《子平真诠》",
    chapter: "卷二·论财",
  },
  偏财格: {
    desc: "偏财格顺用：喜身旺，忌比劫。偏财乃众人之财，身旺可任，多主意外之财、经商之能。",
    source: "《子平真诠》",
    chapter: "卷二·论财",
  },
  正印格: {
    desc: "正印格顺用：喜官星生印，忌财坏印。印旺身强，好读书。印多则孤，印少则贵。",
    source: "《子平真诠》",
    chapter: "卷二·论印",
  },
  偏印格: {
    desc: "偏印格逆用：偏印为枭神，见食则为枭神夺食。喜偏财制之，忌见食神。",
    source: "《子平真诠》",
    chapter: "卷二·论印",
  },
  "建禄/月劫格": {
    desc: "建禄月劫格：月令为比劫，无财官可用则平常。须看四柱财官食伤之有无透干会支。有则取之为用。",
    source: "《子平真诠》",
    chapter: "卷二·论建禄月劫",
  },
  月劫格: {
    desc: "月劫格：月令为劫财，与建禄同理。须寻财官食伤为用。身旺有财官，富贵之命。",
    source: "《子平真诠》",
    chapter: "卷二·论建禄月劫",
  },
};

// ============================================================
// 旺衰体用断语
// 来源：《滴天髓阐微》[参考来源 3.5, 6.20]
// ============================================================

function getProsperityDesc(
  strength: string,
  deLing: boolean,
  deDi: boolean,
  deShi: boolean,
): { desc: string; source: string; chapter: string } {
  const details: string[] = [];
  if (deLing) details.push("得令（月令当旺）");
  if (deDi) details.push("得地（地支有根）");
  if (deShi) details.push("得势（天干有助）");

  let desc = "";
  switch (strength) {
    case "旺":
      desc = `日主旺。${details.join("、")}。旺则宜泄宜克，以财官食伤为用，忌印比再来助之。`;
      break;
    case "偏旺":
      desc = `日主偏旺。${details.join("、")}。偏旺则以克泄耗为用，取官杀克制或食伤泄秀。`;
      break;
    case "中和":
      desc = `日主中和。五行较为平衡，须看格局取用。中和之命，一生平稳。`;
      break;
    case "偏弱":
      desc = `日主偏弱。${details.length > 0 ? details.join("、") + "，但" : ""}力量仍嫌不足。偏弱则以印比扶之为用。`;
      break;
    case "弱":
      desc = `日主弱。${details.length > 0 ? details.join("、") + "，但" : "不得令、不得地、不得势，"}力量衰弱。弱则须以印比生扶为要。`;
      break;
    default:
      desc = "日主旺衰待定。";
  }

  return {
    desc,
    source: "《滴天髓阐微》",
    chapter: "卷一·论体用",
  };
}

// ============================================================
// 大运喜忌
// 来源：《三命通会》[参考来源 6.2, 6.3]
// ============================================================

function getDaYunDesc(
  direction: string,
  startAge: number,
  strength: string,
): { desc: string; source: string; chapter: string } {
  const isStrong = strength === "旺" || strength === "偏旺";
  const isWeak = strength === "弱" || strength === "偏弱";

  let advice = "";
  if (isStrong) {
    advice = "日主旺，大运宜行克泄之地（财官食伤运），忌行印比之乡。";
  } else if (isWeak) {
    advice = "日主弱，大运宜行印比之乡（印绶比劫运），忌行克泄之地。";
  } else {
    advice = "日主中和，大运须看格局喜忌而行。";
  }

  return {
    desc: `大运${direction}行，起运${startAge}岁。${advice}`,
    source: "《三命通会》",
    chapter: "卷二·论大运",
  };
}

// ============================================================
// 关系分析断语
// 来源：《五行大义》[参考来源 6.11]、《三命通会》[参考来源 6.8]
// ============================================================

function getRelationDesc(chart: BaziChart): InterpretationEntry[] {
  const entries: InterpretationEntry[] = [];

  // 天干五合
  for (const rel of chart.stemRelations) {
    if (rel.type === "天干五合") {
      const met = rel.huaQiMet;
      entries.push({
        category: "关系分析",
        title: `${rel.stems}天干五合`,
        content: met
          ? `${rel.stems}合化${rel.transform}，化气条件具备（月令当化神、无争合妒合、化神透引），论真化。化气成功者，性格专一，气势从化神而行。`
          : `${rel.stems}合而不化，化气条件未足。合而有情，主为人随和，但须看化神是否透出引化。`,
        source: "《三命通会》",
        sourceChapter: "卷二·论天干化合",
      });
    } else if (rel.type === "天干相冲") {
      entries.push({
        category: "关系分析",
        title: `${rel.stems}天干相冲`,
        content: `${rel.stems}相冲，主性格刚烈，行事果断。天干相冲轻于地支相冲，但亦主变动。`,
        source: "《五行大义》",
        sourceChapter: "卷二·论相冲",
      });
    }
  }

  // 地支六合
  const liuHe = chart.branchRelations.filter((r) => r.type === "六合");
  if (liuHe.length > 0) {
    entries.push({
      category: "关系分析",
      title: "地支六合",
      content: `四柱有${liuHe.map((r) => r.branches).join("、")}六合。六合主和合、亲近、暗中有人相助。${liuHe.some((r) => r.transform) ? "合化五行：" + liuHe.filter((r) => r.transform).map((r) => `${r.branches}→${r.transform}`).join("、") : ""}`,
      source: "《五行大义》",
      sourceChapter: "卷二·论六合",
    });
  }

  // 地支六冲
  const liuChong = chart.branchRelations.filter((r) => r.type === "六冲");
  if (liuChong.length > 0) {
    entries.push({
      category: "关系分析",
      title: "地支六冲",
      content: `四柱有${liuChong.map((r) => r.branches).join("、")}六冲。六冲主变动、迁移、不稳。冲年月者早年变动多，冲日时者中晚年变化大。`,
      source: "《五行大义》",
      sourceChapter: "卷二·论六冲",
    });
  }

  // 三合局
  const sanHe = chart.branchRelations.filter((r) => r.type === "三合");
  if (sanHe.length > 0) {
    entries.push({
      category: "关系分析",
      title: "三合局",
      content: `四柱有${sanHe.map((r) => r.branches).join("、")}三合局。三合局力量强大，合化${sanHe.map((r) => r.transform).join("、")}五行。三合主人缘好，有凝聚力，做事有始有终。`,
      source: "《三命通会》",
      sourceChapter: "卷二·论三合",
    });
  }

  // 三刑
  const sanXing = chart.branchRelations.filter((r) => r.type === "三刑");
  if (sanXing.length > 0) {
    entries.push({
      category: "关系分析",
      title: "三刑",
      content: `四柱有${sanXing.map((r) => r.branches).join("、")}三刑。三刑主刑伤、官非、口舌。须看刑在何柱，刑年月者幼年有厄，刑日时者中晚年有忧。`,
      source: "《五行大义》",
      sourceChapter: "卷二·论三刑",
    });
  }

  // 暗合
  if (chart.anHeRelations.length > 0) {
    entries.push({
      category: "关系分析",
      title: "暗合",
      content: `四柱有暗合：${chart.anHeRelations.map((r) => r.description).join("；")}。暗合主暗中有人相助，或有不公开的关系。${chart.anHeRelations.some((r) => r.controversial) ? "注：部分暗合组合存在流派争议。" : ""}`,
      source: "《三命通会》",
      sourceChapter: "卷二·论暗合",
    });
  }

  return entries;
}

// ============================================================
// 主函数：生成古法断语
// ============================================================

export function generateInterpretation(chart: BaziChart): InterpretationSection[] {
  const sections: InterpretationSection[] = [];

  // ===== 板块1：日主特性 =====
  const dayStem = chart.dayMaster;
  const stemChar = STEM_CHARACTER[dayStem];
  sections.push({
    name: "日主特性",
    tagColor: "bg-vermilion",
    entries: [
      {
        category: "日主特性",
        title: `${dayStem}${STEM_ELEMENTS[dayStem]} · 天干特性论`,
        content: `命主日主为${dayStem}${STEM_ELEMENTS[dayStem]}（${STEM_YIN_YANG[dayStem]}干）。\n\n天干赋性：${stemChar.characteristic}`,
        source: stemChar.source,
        sourceChapter: stemChar.chapter,
      },
    ],
  });

  // ===== 板块2：旺衰格局 =====
  const prosperity = chart.prosperity;
  const prosperityDesc = getProsperityDesc(
    prosperity.dayMasterStrength,
    prosperity.deLing,
    prosperity.deDi,
    prosperity.deShi,
  );

  const patternInfo = PATTERN_SHUN_NI[prosperity.pattern];

  sections.push({
    name: "旺衰格局",
    tagColor: "bg-jade",
    entries: [
      {
        category: "旺衰格局",
        title: `日主${prosperity.dayMasterStrength} · 得令${prosperity.deLing ? "✓" : "✗"} 得地${prosperity.deDi ? "✓" : "✗"} 得势${prosperity.deShi ? "✓" : "✗"}`,
        content: prosperityDesc.desc,
        source: prosperityDesc.source,
        sourceChapter: prosperityDesc.chapter,
      },
      {
        category: "旺衰格局",
        title: `格局：${prosperity.pattern}`,
        content: patternInfo
          ? patternInfo.desc
          : `月令${chart.fourPillars.month.branch}，定为${prosperity.pattern}。以月令为主，看四柱透干会支取用。`,
        source: patternInfo?.source || "《子平真诠》",
        sourceChapter: patternInfo?.chapter || "卷二·论格局",
      },
      {
        category: "旺衰格局",
        title: `用神：${prosperity.yongShen || "待定"}（${prosperity.yongShenMethod}）`,
        content: prosperity.yongShen
          ? `用神取${prosperity.yongShen}行，取法为${prosperity.yongShenMethod}。用神有力则命局层次高，用神受伤则减福。`
          : "用神须结合大运流年综合判断。",
        source: "《子平真诠》",
        sourceChapter: "卷一·论用神",
      },
    ],
  });

  // ===== 板块3：调候用神 =====
  const monthBranch = chart.fourPillars.month.branch;
  const tiaoHouKey = `${dayStem}_${monthBranch}`;
  const tiaoHou = TIAO_HOU_MAP[tiaoHouKey];

  if (tiaoHou) {
    sections.push({
      name: "调候用神",
      tagColor: "bg-gold",
      entries: [
        {
          category: "调候用神",
          title: `${tiaoHou.condition}`,
          content: tiaoHou.advice,
          source: tiaoHou.source,
          sourceChapter: tiaoHou.chapter,
        },
      ],
    });
  }

  // ===== 板块4：十神配置 =====
  const tenGodEntries: InterpretationEntry[] = [];
  const tenGods = chart.tenGods;

  // 年柱十神
  {
    const godInfo = TEN_GOD_ANALYSIS[tenGods.year];
    if (godInfo) {
      tenGodEntries.push({
        category: "十神配置",
        title: `年柱：${tenGods.year}（${chart.fourPillars.year.ganzhi}）`,
        content: godInfo.desc,
        source: godInfo.source,
        sourceChapter: godInfo.chapter,
      });
    }
  }

  // 月柱十神
  {
    const godInfo = TEN_GOD_ANALYSIS[tenGods.month];
    if (godInfo) {
      tenGodEntries.push({
        category: "十神配置",
        title: `月柱：${tenGods.month}（${chart.fourPillars.month.ganzhi}）`,
        content: godInfo.desc,
        source: godInfo.source,
        sourceChapter: godInfo.chapter,
      });
    }
  }

  // 时柱十神
  {
    const godInfo = TEN_GOD_ANALYSIS[tenGods.hour];
    if (godInfo) {
      tenGodEntries.push({
        category: "十神配置",
        title: `时柱：${tenGods.hour}（${chart.fourPillars.hour.ganzhi}）`,
        content: godInfo.desc,
        source: godInfo.source,
        sourceChapter: godInfo.chapter,
      });
    }
  }

  if (tenGodEntries.length > 0) {
    sections.push({
      name: "十神配置",
      tagColor: "bg-indigo-deep",
      entries: tenGodEntries,
    });
  }

  // ===== 板块5：大运喜忌 =====
  const daYunDesc = getDaYunDesc(
    chart.daYun.direction,
    chart.daYun.startAge,
    prosperity.dayMasterStrength,
  );

  sections.push({
    name: "大运喜忌",
    tagColor: "bg-jade",
    entries: [
      {
        category: "大运喜忌",
        title: `${chart.daYun.direction}行大运 · 起运${chart.daYun.startAge}岁`,
        content: daYunDesc.desc,
        source: daYunDesc.source,
        sourceChapter: daYunDesc.chapter,
      },
    ],
  });

  // ===== 板块6：神煞解读 =====
  const shenShaEntries: InterpretationEntry[] = [];
  const allShenSha = new Set<string>();
  for (const key of Object.keys(chart.shenSha)) {
    for (const ss of chart.shenSha[key]) {
      allShenSha.add(ss);
    }
  }

  for (const ss of allShenSha) {
    const info = SHENSHA_INTERPRETATION[ss];
    if (info) {
      shenShaEntries.push({
        category: "神煞解读",
        title: ss,
        content: info.desc,
        source: info.source,
        sourceChapter: info.chapter,
      });
    }
  }

  if (shenShaEntries.length > 0) {
    sections.push({
      name: "神煞解读",
      tagColor: "bg-gold",
      entries: shenShaEntries,
    });
  }

  // ===== 板块7：关系分析 =====
  const relationEntries = getRelationDesc(chart);
  if (relationEntries.length > 0) {
    sections.push({
      name: "关系分析",
      tagColor: "bg-vermilion",
      entries: relationEntries,
    });
  }

  // ===== 板块8：空亡 =====
  if (chart.kongWang.day.length > 0) {
    sections.push({
      name: "空亡",
      tagColor: "bg-ink-light",
      entries: [
        {
          category: "空亡",
          title: `日柱旬空：${chart.kongWang.day.join("、")}`,
          content: `日柱旬空为${chart.kongWang.day.join("、")}。空亡者，有其名而无其实。空在年支主早年少缘，空在月支主中年事业有虚，空在日支主配偶缘薄，空在时支主晚年或子息有缺。逢冲、合、刑可解空。`,
          source: "《三命通会》",
          sourceChapter: "卷二·论空亡",
        },
      ],
    });
  }

  return sections;
}
