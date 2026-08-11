import type { ReactNode } from "react";
import Link from "next/link";
import { Disclaimer } from "@/components/disclaimer";

/* ============================================================
   数据：12 部古籍原典
   ============================================================ */
type AncientText = {
  no: number;
  title: string;
  meta: string;
  domain: string;
};

const ancientTexts: AncientText[] = [
  { no: 1, title: "三命通会", meta: "明·万民英", domain: "胎元、大运、子时、神煞、五行旺衰、天干化气" },
  { no: 2, title: "渊海子平", meta: "宋·徐子平", domain: "地支藏干、大运起法、五虎遁、五鼠遁、起胎法" },
  { no: 3, title: "子平真诠", meta: "清·沈孝瞻", domain: "用神取法、格局成败、顺用逆用" },
  { no: 4, title: "穷通宝鉴", meta: "清·余春台", domain: "调候用神（按季节寒暖燥湿取用）" },
  { no: 5, title: "滴天髓阐微", meta: "明·刘伯温", domain: "旺衰体用、扶抑通关、通根透干" },
  { no: 6, title: "李虚中命书", meta: "唐·李虚中", domain: "古法禄命、纳音释义、天乙贵人" },
  { no: 7, title: "命理探源", meta: "清·袁树珊", domain: "夜子时/子正定义、大运起法" },
  { no: 8, title: "星平大成", meta: "清·沈承勋", domain: "夜子时阴阳属性" },
  { no: 9, title: "五行大义", meta: "隋·萧吉", domain: "天干冲破、五行生克" },
  { no: 10, title: "千里命稿", meta: "民国·韦千里", domain: "天干相克、羊刃帝旺说" },
  { no: 11, title: "神峰通考", meta: "明·张神峰", domain: "逢卯安命、逢酉安身" },
  { no: 12, title: "古今图书集成·艺术典", meta: "清·陈梦雷", domain: "身宫排法" },
];

/* ============================================================
   数据：第一级来源机构
   ============================================================ */
type Institution = {
  name: string;
  abbr: string;
  role: string;
};

const institutions: Institution[] = [
  { name: "中国科学院紫金山天文台", abbr: "PMO", role: "节气数据最终校准基准" },
  { name: "国家标准 GB/T 33661-2017", abbr: "", role: "农历编算标准、节气黄经定义" },
  { name: "中国科学院国家授时中心", abbr: "NTSC", role: "北京时间定义" },
  { name: "香港天文台", abbr: "HKO", role: "节气时刻和均时差交叉验证" },
  { name: "美国海军天文台", abbr: "USNO", role: "均时差定义及范围" },
  { name: "国际天文联合会", abbr: "IAU", role: "天文参考系统、岁差模型" },
];

/* ============================================================
   数据：古籍数字化平台
   ============================================================ */
type Platform = {
  name: string;
  feature: string;
};

const platforms: Platform[] = [
  { name: "国学大师", feature: "四库全书影印本" },
  { name: "识典古籍", feature: "四库提要+古今图书集成" },
  { name: "古诗文网", feature: "古籍文字版在线阅读" },
  { name: "书格", feature: "高清原刊本扫描" },
  { name: "中华文库", feature: "四库全书本全文" },
  { name: "中研院知识图谱", feature: "古今图书集成结构化数据" },
  { name: "东里书斋", feature: "命理古籍分章阅读" },
  { name: "全学网", feature: "命理典籍选录" },
];

/* ============================================================
   数据：交叉验证工具
   ============================================================ */
type Tool = {
  name: string;
  purpose: string;
  tolerance: string;
  toneClass: string;
};

const tools: Tool[] = [
  { name: "lunar-javascript", purpose: "农历/节气/干支计算对比", tolerance: "允许≤30秒偏差", toneClass: "bg-jade" },
  { name: "bazi-ts-lib", purpose: "八字排盘算法对比", tolerance: "四柱结果须完全一致", toneClass: "bg-gold" },
  { name: "寿星天文历", purpose: "天文算法参考", tolerance: "非最终权威", toneClass: "bg-ink-light" },
];

/* ============================================================
   数据：排盘规则核查流程
   ============================================================ */
type Step = {
  title: string;
  detail?: string;
};

const processSteps: Step[] = [
  { title: "先查参考来源文件确认权威来源级别" },
  { title: "查古籍原文", detail: "第二级来源核对原文引录" },
  { title: "查天文数据", detail: "第一级来源核对已核验数据" },
  { title: "交叉验证", detail: "来源冲突时以第一级和第二级为准" },
  { title: "先更新参考来源文件再修改大纲" },
];

/* ============================================================
   数据：5 条禁止事项
   ============================================================ */
type Prohibition = {
  text: string;
  detail?: string;
};

const prohibitions: Prohibition[] = [
  {
    text: "禁止以百度百科、命理论坛、博客、自媒体作为规则的唯一依据",
    detail: "这些来源仅为线索参考，不可单独作为排盘规则依据",
  },
  {
    text: "禁止以寿星天文历等民间项目作为节气数据的最终权威",
    detail: "以中国科学院紫金山天文台数据为最终校准基准",
  },
  {
    text: "禁止将民间简化口诀等同于古籍原文定法",
    detail: "如胎元「月干进一位月支进三位」≠《三命通会》「前三百日」法",
  },
  {
    text: "禁止以中国道教协会、中国道教学院等宗教机构作为命理排盘规则的来源",
    detail: "它们未发布过此类排盘规则",
  },
  {
    text: "禁止在未查阅古籍原文的情况下修改排盘规则",
    detail: "任何规则修订须先核查古籍原文，再更新参考来源文件",
  },
];

/* ============================================================
   通用区块：标题 + 装饰分隔线
   ============================================================ */
function Section({
  label,
  title,
  desc,
  children,
}: {
  label: string;
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-12 animate-fade-in-up">
      <div className="mb-6">
        <div className="flex items-baseline gap-3">
          <span className="heading-font text-sm text-vermilion">{label}</span>
          <h2 className="heading-font text-2xl text-ink">{title}</h2>
        </div>
        <p className="mt-2 text-sm text-ink-lighter">{desc}</p>
        <div className="ink-divider mt-4" />
      </div>
      {children}
    </div>
  );
}

/* ============================================================
   关于页
   ============================================================ */
export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* 页头 */}
      <div className="mb-14 text-center animate-fade-in-up">
        <div className="mb-4 flex justify-center">
          <span className="seal-tag bg-vermilion text-white">关于本站</span>
        </div>
        <h1 className="heading-font text-4xl text-ink mb-3">关于</h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-ink-lighter">
          本页公开八字推演全部排盘规则的权威来源、古籍依据与校验流程，做到规则可溯源、来源可核查、数据可验证。祖宗之法不可违，每一条断语皆有出处。
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <span className="seal-tag bg-vermilion text-white">来源分级</span>
          <span className="seal-tag bg-jade text-white">古籍为宗</span>
          <span className="seal-tag bg-indigo-deep text-white">天文校准</span>
          <span className="seal-tag bg-gold text-white">规则可溯</span>
        </div>
      </div>

      {/* 板块一：12 部古籍与 29 条排盘规则 */}
      <Section
        label="板块一"
        title="12部古籍与29条排盘规则"
        desc="排盘规则的法理依据源自以下 12 部命理古籍原典，覆盖胎元、大运、子时、神煞、格局等 29 条核心规则的古籍出处。"
      >
        <div className="ink-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-paper-dark/60">
                  <th className="w-12 px-3 py-3 text-left font-semibold text-ink-light">#</th>
                  <th className="px-3 py-3 text-left font-semibold text-ink-light">古籍</th>
                  <th className="whitespace-nowrap px-3 py-3 text-left font-semibold text-ink-light">朝代·作者</th>
                  <th className="px-3 py-3 text-left font-semibold text-ink-light">权威领域</th>
                </tr>
              </thead>
              <tbody>
                {ancientTexts.map((t) => (
                  <tr
                    key={t.no}
                    className="border-b border-border/50 transition-colors last:border-0 hover:bg-paper-dark/40"
                  >
                    <td className="px-3 py-3 text-ink-lighter">{t.no}</td>
                    <td className="px-3 py-3">
                      <span className="heading-font text-ink">《{t.title}》</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-ink-light">{t.meta}</td>
                    <td className="px-3 py-3 text-ink-light">{t.domain}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* 板块二：第一级来源机构 */}
      <Section
        label="板块二"
        title="第一级来源机构"
        desc="天文历法数据以国家级、国际级权威机构与国家标准为最终校准基准，可信度最高。"
      >
        <div className="ink-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-paper-dark/60">
                  <th className="px-3 py-3 text-left font-semibold text-ink-light">机构 / 标准</th>
                  <th className="px-3 py-3 text-left font-semibold text-ink-light">权威领域</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map((i) => (
                  <tr
                    key={i.name}
                    className="border-b border-border/50 transition-colors last:border-0 hover:bg-paper-dark/40"
                  >
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="heading-font text-ink">{i.name}</span>
                        {i.abbr && (
                          <span className="seal-tag whitespace-nowrap bg-indigo-deep text-white">
                            {i.abbr}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-ink-light">{i.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* 板块三：古籍数字化平台 */}
      <Section
        label="板块三"
        title="古籍数字化平台"
        desc="以下平台提供第二级来源（古籍原典）的在线原文，是核查古籍原文的可靠渠道。"
      >
        <div className="ink-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-paper-dark/60">
                  <th className="px-3 py-3 text-left font-semibold text-ink-light">平台</th>
                  <th className="px-3 py-3 text-left font-semibold text-ink-light">特点</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((p) => (
                  <tr
                    key={p.name}
                    className="border-b border-border/50 transition-colors last:border-0 hover:bg-paper-dark/40"
                  >
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="heading-font text-ink">{p.name}</span>
                    </td>
                    <td className="px-3 py-3 text-ink-light">{p.feature}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* 板块四：交叉验证工具 */}
      <Section
        label="板块四"
        title="交叉验证工具"
        desc="以下开源项目与工具仅用于算法交叉验证，不可单独作为排盘规则依据。"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {tools.map((tool) => (
            <div key={tool.name} className="ink-card flex flex-col gap-3 p-5">
              <span className="heading-font text-base text-ink">{tool.name}</span>
              <p className="flex-1 text-sm text-ink-lighter">{tool.purpose}</p>
              <span
                className={`seal-tag self-start whitespace-nowrap text-white ${tool.toneClass}`}
              >
                {tool.tolerance}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* 板块五：排盘规则核查流程 */}
      <Section
        label="板块五"
        title="排盘规则核查流程"
        desc="每一次排盘规则核查，必须严格遵循以下五步流程。"
      >
        <div className="ink-card p-6">
          <ol className="space-y-4">
            {processSteps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="heading-font flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-jade text-sm text-white">
                  {i + 1}
                </span>
                <div className="pt-1">
                  <p className="font-medium text-ink">{step.title}</p>
                  {step.detail && (
                    <p className="mt-0.5 text-sm text-ink-lighter">{step.detail}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* 板块六：明确公示 5 条禁止事项 */}
      <Section
        label="板块六"
        title="明确公示5条禁止事项"
        desc="为保障排盘的权威性与可追溯性，特此公示以下五条禁止事项。"
      >
        <div className="ink-card p-6">
          <ol className="space-y-3">
            {prohibitions.map((p, i) => (
              <li
                key={i}
                className="flex gap-4 rounded-lg bg-vermilion/5 p-4"
              >
                <span className="heading-font flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-vermilion text-sm text-white">
                  {i + 1}
                </span>
                <div className="pt-1">
                  <p className="font-medium text-ink">{p.text}</p>
                  {p.detail && (
                    <p className="mt-0.5 text-sm text-ink-lighter">{p.detail}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* 免责声明 */}
      <div className="mb-12 animate-fade-in-up">
        <Disclaimer variant="full" />
      </div>

      {/* 结尾引导 */}
      <div className="mt-4 text-center animate-fade-in-up">
        <div className="ink-card p-8">
          <h3 className="heading-font text-xl text-ink mb-2">祖宗之法，排盘有据</h3>
          <p className="mx-auto mb-5 max-w-xl text-sm text-ink-lighter">
            排盘引擎全部纯客户端计算，无需联网；每一条规则皆可溯源至古籍原典与权威天文数据。
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/" className="vermilion-btn px-6 py-2.5 text-sm">
              开始排盘
            </Link>
            <Link
              href="/saved"
              className="rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-medium text-ink-light transition-colors hover:bg-paper-dark hover:text-ink"
            >
              我的命盘
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
