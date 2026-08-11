<div align="center">

# 八字推演

### Bazi Divination Engine

**严格遵循古籍原典的八字排盘与命理分析工具**

*祖宗之法不可违 · 精确天文排盘 · 纯客户端计算*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-bazi--tuiyan.vercel.app-b91c1c?style=for-the-badge)](https://bazi-tuiyan.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-a16207?style=for-the-badge)](LICENSE)

</div>

---

## 概览

「八字推演」是一款基于中国传统命理学的 Web 应用，严格遵循《三命通会》《渊海子平》《子平真诠》等 **12 部古籍原典**，以中国科学院紫金山天文台天文数据为校准基准，实现从生辰信息到完整命盘的全流程纯客户端计算。

### 在线体验

**[bazi-tuiyan.vercel.app](https://bazi-tuiyan.vercel.app/)**

---

## 核心特性

| 特性 | 说明 |
|------|------|
| **29 条排盘规则** | 严格遵循《三命通会》《渊海子平》《子平真诠》等 12 部古籍原典 |
| **天文级精度** | 基于 astronomy-engine（VSOP87+DE440 算法），节气偏差 < 30 秒 |
| **公历 / 农历双历法** | 自由切换，支持闰月转换，覆盖 1900-2100 |
| **150+ 国际城市** | 覆盖六大洲，自动匹配经度与时区 |
| **真太阳时校正** | 经度差 + 均时差 + 夏令时还原，四步精确校正 |
| **AI 古法断语** | 基于命理知识库的 AI 润色解读，支持多轮追问 |
| **纯客户端计算** | 排盘无需联网，零网络延迟，隐私安全 |
| **现代东方美学** | 宣纸底 + 水墨黑 + 朱砂红配色，八卦罗盘 / 太极 / 法器背景特效 |

---

## 排盘引擎架构

排盘引擎采用九层纯函数架构，每层独立可测，数据自上而下流动：

```
用户输入（公历生辰 + 性别 + 出生地经度）
        │
        ▼  [客户端纯计算，无网络]
┌──────────────────────────────────────────────────┐
│  排盘引擎（TypeScript 纯函数库）                    │
│                                                   │
│  1. 时间校正层                                     │
│     · 夏令时还原（1986-1991 精确日期表）             │
│     · 经度差修正（4分钟 × (经度 - 120°)）            │
│     · 均时差修正（视太阳时 - 平太阳时）               │
│     · 校正顺序：钟表 → 夏令时 → 经度 → 均时差        │
│                                                   │
│  2. 节气天文计算层                                  │
│     · 定气法（太阳地心视黄经每 15° 一节气）            │
│     · 以紫金山天文台数据为最终校准基准                  │
│     · VSOP87 + DE440 天文算法（精度 < 1 秒）         │
│                                                   │
│  3. 四柱排盘层                                      │
│     · 年柱（立春交节时刻为界）                        │
│     · 月柱（十二节划分 + 五虎遁年起月）                │
│     · 日柱（零点为日始 + 夜子时 / 子正区分）           │
│     · 时柱（五鼠遁日起时）                           │
│                                                   │
│  4. 大运流年层                                      │
│     · 大运（年干阴阳定顺逆 + 起运岁数精确到天）         │
│     · 流年 / 流月 / 流日 / 流时                      │
│     · 小运（时柱为起点 + 阳男阴女顺行）               │
│                                                   │
│  5. 辅助宫位层                                      │
│     · 胎元（前三百日法）                             │
│     · 命宫（子上起正月逆数至生月，安时顺数至卯）        │
│     · 身宫（生月支加生日支，命顺身逆 / 命逆身顺）      │
│                                                   │
│  6. 十神关系层                                      │
│     · 地支藏干（《渊海子平》体系）                     │
│     · 十神（以日主为中心）                           │
│     · 纳音（六十甲子 30 对 + 太玄数公式）              │
│     · 十二长生（阳干顺行；阴干标注参考性）             │
│                                                   │
│  7. 神煞层（25+ 种）                                │
│     · 天乙 / 文昌 / 华盖 / 驿马 / 桃花               │
│     · 禄 / 空亡 / 将星 / 灾煞 / 劫煞                 │
│     · 孤辰寡宿 / 魁罡 / 天罗地网 / 金舆              │
│     · 天德 / 月德 / 羊刃三体系切换                   │
│                                                   │
│  8. 关系分析层                                      │
│     · 刑冲合害破（天干五合 / 地支六合六冲）            │
│     · 暗合 / 拱夹虚邀                               │
│     · 三合三会方局                                  │
│                                                   │
│  9. 旺衰格局层                                      │
│     · 日主旺衰（得令 / 得地 / 得势）                  │
│     · 格局判定（正格 / 变格）                        │
│     · 用神喜忌                                     │
└──────────────────────────────────────────────────┘
        │
        ▼
  完整命盘 + AI 古法断语
```

---

## 项目结构

```
bazi-tuiyan/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # 首页（排盘输入表单）
│   │   ├── chart/page.tsx            # 命盘展示页
│   │   ├── saved/page.tsx            # 已保存命盘
│   │   ├── about/page.tsx            # 关于页
│   │   ├── api/interpret/route.ts    # AI 解读 API Route
│   │   ├── layout.tsx                # 全局布局（含背景特效）
│   │   └── globals.css               # 设计系统 + 动画
│   │
│   ├── components/
│   │   ├── animations/
│   │   │   ├── visual-effects.tsx    # 玄学法器背景（罗盘/太极/法器/粒子）
│   │   │   └── gsap-effects.tsx      # GSAP 滚动动画
│   │   ├── charts/
│   │   │   ├── echarts-base.tsx      # ECharts 封装基类
│   │   │   ├── element-radar.tsx     # 五行雷达图
│   │   │   ├── changsheng-chart.tsx  # 十二长生图
│   │   │   ├── dayun-timeline.tsx    # 大运时间轴
│   │   │   ├── wangshuai-heatmap.tsx # 旺衰热力图
│   │   │   └── chart-section.tsx     # 图表分区组件
│   │   ├── interpretation/
│   │   │   └── interpretation-panel.tsx  # AI 解读面板（支持追问）
│   │   └── disclaimer.tsx            # 免责声明组件
│   │
│   ├── lib/
│   │   ├── engine/                   # 排盘引擎核心
│   │   │   ├── time-correction.ts    # 时间校正
│   │   │   ├── solar-terms.ts        # 节气天文计算
│   │   │   ├── four-pillars.ts       # 四柱排盘
│   │   │   ├── da-yun.ts             # 大运流年
│   │   │   ├── auxiliary-palaces.ts  # 辅助宫位
│   │   │   ├── prosperity.ts         # 十二长生
│   │   │   ├── relations.ts          # 关系分析
│   │   │   ├── shen-sha.ts           # 神煞
│   │   │   ├── analysis.ts           # 旺衰格局
│   │   │   ├── palaces.ts            # 宫位
│   │   │   ├── wang-shuai.ts         # 旺衰分析
│   │   │   ├── constants.ts          # 引擎常量
│   │   │   ├── types.ts              # 类型定义
│   │   │   ├── index.ts              # 引擎入口
│   │   │   └── __tests__/            # 单元测试（402 项）
│   │   │
│   │   ├── bazi/                     # 命理数据层
│   │   │   ├── calculators/          # 计算器（薄封装）
│   │   │   ├── constants/            # 数据表
│   │   │   │   ├── canggan.ts        # 地支藏干
│   │   │   │   ├── dizhi.ts          # 地支
│   │   │   │   ├── tiangan.ts        # 天干
│   │   │   │   ├── wuxing.ts         # 五行
│   │   │   │   ├── nayin.ts          # 纳音
│   │   │   │   ├── changsheng.ts     # 十二长生
│   │   │   │   ├── shensha.ts        # 神煞规则
│   │   │   │   └── dst.ts            # 夏令时日期表
│   │   │   └── types.ts
│   │   │
│   │   ├── interpretation/
│   │   │   └── knowledge-base.ts     # 命理知识库（AI 解读用）
│   │   ├── lunar-utils.ts            # 农历工具
│   │   ├── storage.ts                # 本地存储（命盘 / 对话）
│   │   └── utils.ts                  # 通用工具
│   │
│   └── ...
│
├── docs/
│   ├── 项目大纲.md                    # 功能规格总纲（v2.5）
│   ├── 参考来源文件.md                # 权威来源总纲（v1.2）
│   └── 技能与插件清单.md              # 技术选型参考
│
├── public/                           # 静态资源
├── vitest.config.ts                  # 测试配置
├── next.config.ts                    # Next.js 配置
├── tailwind.config / postcss         # Tailwind CSS v4
└── package.json
```

---

## 命盘展示项

排盘完成后，命盘展示页包含以下完整信息：

### 四柱基本信息
- **四柱干支** — 年柱 / 月柱 / 日柱 / 时柱（天干 + 地支）
- **日主** — 以日干为日主
- **纳音** — 六十甲子纳音（每柱）
- **十神** — 以日主为中心的十神分布
- **地支藏干** — 每个地支的藏干及透出情况

### 大运流年
- **大运** — 起运岁数（精确到天）、顺逆、每步大运干支
- **流年** — 当前流年干支
- **流月 / 流日 / 流时** — 五虎遁 / 五鼠遁推算
- **小运** — 时柱起点，阳男阴女顺行

### 辅助宫位
- **胎元** — 前三百日法
- **命宫** — 子上起正月逆数至生月，安时顺数至卯
- **身宫** — 生月支加生日支，命顺身逆

### 关系分析
- **天干五合 / 相冲** — 甲己合化土等
- **地支六合 / 六冲 / 三合 / 三会** — 完整关系网
- **刑害破** — 刑（无礼之刑等）、害（六害）、破
- **暗合 / 拱夹虚邀** — 进阶关系分析

### 神煞（25+ 种）
天乙贵人、文昌、华盖、驿马、桃花、禄神、空亡、将星、灾煞、劫煞、孤辰寡宿、魁罡、天罗地网、金舆、天德、月德、羊刃等

### 可视化图表
- **五行雷达图** — 金木水火土分布
- **十二长生图** — 日主在十二地支的长生状态
- **大运时间轴** — 大运起止与流年标注
- **旺衰热力图** — 四柱旺衰分布

### AI 古法断语
- 基于命理知识库的 AI 润色解读
- 支持多轮追问对话
- 对话自动保存（基于四柱干支唯一 key）

---

## 视觉设计系统

采用「现代东方美学」设计语言：

| 设计元素 | 说明 |
|---------|------|
| **配色** | 宣纸底 (#f5f1ea) + 水墨黑 (#1c1917) + 朱砂红 (#b91c1c) + 翡翠绿 (#047857) + 鎏金 (#a16207) + 靛青 (#312e81) |
| **字体** | Noto Serif SC（标题）+ Geist Sans（正文）+ 系统衬体（干支大字） |
| **背景特效** | 八卦罗盘 / 太极图 / 铜钱 / 葫芦 / 祥云纹 / 回纹顶饰 / 小型罗盘 / 天干地支飘浮符文 / 五行字符 / 卦名飘浮 |
| **粒子系统** | 双层 Canvas 粒子（鎏金 80 + 朱砂 30 = 110 颗） |
| **极光背景** | 三色极光光晕（朱砂 / 靛青 / 鎏金）+ 鼠标交互 |
| **动画系统** | GSAP ScrollTrigger 滚动视差 + 6 组 CSS 动画（mysticSpin / drift / floatSlow / mysticGlow / artifactPulse / breathe） |
| **卡片系统** | 墨韵卡片（毛玻璃）+ 渐变边框卡片 + 玻璃态卡片 |
| **交互特效** | 磁吸按钮 + 3D 倾斜卡片 + 墨韵涟漪 + 光泽文字 |

---

## 权威来源

### 第一级：国家级 / 国际级权威机构

| 机构 | 用途 |
|------|------|
| **中国科学院紫金山天文台 (PMO)** | 节气交节时刻、农历编算、历书术语定义 |
| **国家标准 GB/T 33661-2017** | 农历编算标准、节气黄经定义（立春=315°, 春分=0°, 夏至=90°, 秋分=180°, 冬至=270°） |
| **中国科学院国家授时中心 (NTSC)** | 北京时间定义（UTC(NTSC) + 8h） |
| **香港天文台 (HKO)** | 历年节气时刻交叉验证 |

### 第二级：命理古籍原典（12 部）

| 古籍 | 作者 / 年代 | 核心引用 |
|------|------------|---------|
| 《三命通会》 | 万民维 · 明 | 四柱排盘总纲、命宫排法、神煞体系 |
| 《渊海子平》 | 徐子平 · 宋 | 地支藏干、十神体系、格局判定 |
| 《子平真诠》 | 沈孝瞻 · 清 | 格局用神、月令司权 |
| 《滴天髓》 | 京图 · 明 | 旺衰判断、用神取法 |
| 《穷通宝鉴》 | 余春台 · 清 | 调候用神 |
| 《李虚中命书》 | 李虚中 · 唐 | 三柱推命（年柱为主） |
| 《五行精纪》 | 廖中 · 宋 | 纳音体系、神煞 |
| 《神峰通考》 | 张神峰 · 明 | 格局辨讹 |
| 《星平会海》 | 明 | 星命合参 |
| 《命理约言》 | 陈素庵 · 清 | 命理规范化 |
| 《千里命稿》 | 韦千里 · 民国 | 现代命理入门 |
| 《命理探源》 | 袁树珊 · 民国 | 命理考证 |

---

## 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| **框架** | Next.js 16.3 | App Router + Turbopack |
| **UI** | React 19.2 | 最新 React |
| **语言** | TypeScript 5.x | 全量类型安全 |
| **样式** | Tailwind CSS v4 | 原子化 CSS + 设计系统 |
| **天文计算** | astronomy-engine 2.1 | VSOP87 + DE440 算法 |
| **农历转换** | lunar-typescript 1.8 | 农历 / 公历互转 |
| **动画** | GSAP 3.15 + Framer Motion 13 | ScrollTrigger + 物理动画 |
| **图表** | ECharts 6.1 | 雷达图 / 时间轴 / 热力图 |
| **图标** | Lucide React 1.31 | 现代图标库 |
| **测试** | Vitest 4.1 | 402 项单元测试 |
| **部署** | Vercel | 边缘节点部署 |

---

## 本地运行

### 环境要求

- Node.js >= 18.18
- npm >= 9

### 安装与启动

```bash
# 克隆仓库
git clone https://github.com/ElijahZhao/bazi-tuiyan.git
cd bazi-tuiyan

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用。

### 生产构建

```bash
npm run build
npm run start
```

### 运行测试

```bash
npx vitest run
```

测试覆盖 9 个模块、402 项测试用例：

| 测试文件 | 测试数 | 覆盖内容 |
|---------|--------|---------|
| `four-pillars.test.ts` | 38 | 年月日时柱排盘 |
| `time-correction.test.ts` | 42 | 真太阳时 / 夏令时 / 经度差 |
| `da-yun.test.ts` | 47 | 大运起运 / 流年推算 |
| `relations.test.ts` | 67 | 刑冲合害破 / 三合三会 |
| `shensha.test.ts` | 68 | 25+ 种神煞 |
| `analysis.test.ts` | 55 | 旺衰格局 / 用神 |
| `prosperity.test.ts` | 51 | 十二长生 |
| `auxiliary-palaces.test.ts` | 28 | 胎元 / 命宫 / 身宫 |
| `smoke.test.ts` | 6 | 端到端冒烟测试 |

---

## 部署

项目已部署在 Vercel：

**[https://bazi-tuiyan.vercel.app/](https://bazi-tuiyan.vercel.app/)**

### Vercel 部署步骤

1. Fork 本仓库到你的 GitHub
2. 登录 [Vercel](https://vercel.com/)
3. New Project → Import 你的 GitHub 仓库
4. Framework Preset 自动识别为 Next.js
5. 点击 Deploy，等待构建完成

### 环境变量

如需启用 AI 解读功能，需配置以下环境变量：

```env
# 火山方舟 API（AI 解读用）
ARK_API_KEY=your_api_key
ARK_MODEL=your_model_id
```

> 注：排盘引擎全部纯客户端计算，无需任何环境变量即可运行核心功能。AI 解读为可选增强功能。

---

## 免责声明

本站排盘与解读内容基于中国传统命理学古籍所载算法，属于**传统文化学术研究领域**，不代表现代科学验证结论。

- 排盘结果及 AI 解读仅供**文化参考与学术交流**
- **不构成**任何形式的医疗、法律、财务、婚恋、就业等决策建议
- AI 生成内容可能存在偏差，不得作为专业命理咨询的替代
- 排盘引擎全部纯客户端计算，出生信息**不上传服务器**

使用本站即表示您已阅读、理解并同意以上全部条款。

---

## License

[MIT](LICENSE)

---

<div align="center">

**八字推演** · 祖宗之法，排盘有据

天文数据以中国科学院紫金山天文台为最终校准基准 · 排盘引擎纯客户端计算

</div>
