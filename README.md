# 八字推演 (Bazi Divination Engine)

> 严格遵循古籍原典的八字排盘与命理分析工具 · 精确天文排盘 · 祖宗之法不可违

**在线访问**: [https://bazi-tuiyan.vercel.app/](https://bazi-tuiyan.vercel.app/)

**GitHub 源码**: [https://github.com/ElijahZhao/bazi-tuiyan](https://github.com/ElijahZhao/bazi-tuiyan)

## 核心特性

- **29条排盘规则** — 严格遵循《三命通会》《渊海子平》《子平真诠》等12部古籍原典
- **天文级精度** — VSOP87+DE440 算法，节气偏差 < 30秒
- **公历/农历双历法** — 自由切换，支持闰月转换
- **150+ 国际城市** — 覆盖六大洲，自动匹配经度与时区
- **真太阳时校正** — 经度差 + 均时差 + 夏令时还原，四步精确校正
- **纯客户端计算** — 无需联网，零网络延迟，隐私安全

## 排盘引擎九层架构

1. 时间校正（真太阳时 / 夏令时 / 经度差 / 均时差）
2. 节气天文计算（太阳黄经 / 交节时刻 / 月支确定）
3. 四柱排盘（年柱立春界 / 月柱五虎遁 / 日柱夜子时 / 时柱五鼠遁）
4. 大运流年流月流日流时小运
5. 辅助宫位（胎元 / 命宫 / 身宫）
6. 十神 / 纳音 / 十二长生
7. 神煞 25+ 种
8. 关系分析（刑冲合害破 / 暗合 / 拱夹虚邀）
9. 旺衰格局

## 权威来源

- 天文数据以**中国科学院紫金山天文台**为最终校准基准
- 国家标准 **GB/T 33661-2017**（农历编算标准、节气黄经定义）
- 12部命理古籍原典（唐至民国）

## 技术栈

- Next.js 16 + React 19 + TypeScript
- astronomy-engine（天文计算）
- lunar-typescript（农历转换）
- Tailwind CSS v4 + Framer Motion + GSAP
- Vitest（346项单元测试全通过）

## 本地运行

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用。

## 部署

项目已部署在 Vercel：[https://bazi-tuiyan.vercel.app/](https://bazi-tuiyan.vercel.app/)

## License

MIT
