"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CITIES, REGION_LABELS, type CityRegion } from "@/lib/engine/constants";
import type { BirthInput } from "@/lib/engine/types";
import { getLunarMonths, getLunarMonthDays, getLeapMonth, lunarToSolar } from "@/lib/lunar-utils";
import {
  ScrollReveal,
  MagneticButton,
  CountUp,
  TiltCard,
} from "@/components/animations/visual-effects";

type CalendarType = "solar" | "lunar";

/* ============================================================
   功能特性数据
   ============================================================ */
const FEATURES = [
  {
    icon: "📜",
    title: "29条排盘规则",
    desc: "严格遵循《三命通会》《渊海子平》《子平真诠》等12部古籍原典，每条规则可溯源",
    color: "from-vermilion/10 to-vermilion/5",
    border: "border-vermilion/20",
    span: "md:col-span-2",
  },
  {
    icon: "🔭",
    title: "天文级精度",
    desc: "VSOP87+DE440算法，节气偏差<30秒",
    color: "from-indigo-deep/10 to-indigo-deep/5",
    border: "border-indigo-deep/20",
    span: "md:col-span-2",
  },
  {
    icon: "📅",
    title: "公历/农历双历法",
    desc: "自由切换，支持闰月转换",
    color: "from-jade/10 to-jade/5",
    border: "border-jade/20",
    span: "",
  },
  {
    icon: "🌍",
    title: "150+国际城市",
    desc: "覆盖六大洲，自动匹配经度与时区",
    color: "from-gold/10 to-gold/5",
    border: "border-gold/20",
    span: "",
  },
  {
    icon: "☀️",
    title: "真太阳时校正",
    desc: "经度差 + 均时差 + 夏令时还原，四步精确校正",
    color: "from-vermilion/10 to-gold/5",
    border: "border-vermilion/20",
    span: "md:col-span-2",
  },
];

const STATS = [
  { value: 150, suffix: "+", label: "国际城市" },
  { value: 346, suffix: "", label: "单元测试" },
  { value: 12, suffix: "", label: "古籍原典" },
  { value: 9, suffix: "", label: "层排盘引擎" },
];

export default function HomePage() {
  const router = useRouter();

  const [calendarType, setCalendarType] = useState<CalendarType>("solar");
  const [year, setYear] = useState("1990");
  const [month, setMonth] = useState("6");
  const [day, setDay] = useState("15");
  const [lunarYear, setLunarYear] = useState("1990");
  const [lunarMonth, setLunarMonth] = useState("5");
  const [lunarDay, setLunarDay] = useState("15");
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [hour, setHour] = useState("10");
  const [minute, setMinute] = useState("30");
  const [gender, setGender] = useState<"男" | "女">("男");
  const [city, setCity] = useState("北京");
  const [longitude, setLongitude] = useState("116.41");
  const [timezone, setTimezone] = useState("8");
  const [enableNightZi, setEnableNightZi] = useState(true);

  const citiesByRegion = Object.entries(CITIES).reduce(
    (acc, [name, info]) => {
      if (!acc[info.region]) acc[info.region] = [];
      acc[info.region].push(name);
      return acc;
    },
    {} as Record<CityRegion, string[]>
  );

  const regionOrder: CityRegion[] = ['china', 'asia', 'europe', 'america', 'oceania', 'africa'];

  const lunarMonths = useMemo(() => {
    const y = parseInt(lunarYear);
    if (isNaN(y)) return [];
    return getLunarMonths(y);
  }, [lunarYear]);

  const lunarMonthDayCount = useMemo(() => {
    const y = parseInt(lunarYear);
    const m = parseInt(lunarMonth);
    if (isNaN(y) || isNaN(m)) return 30;
    return getLunarMonthDays(y, m, isLeapMonth);
  }, [lunarYear, lunarMonth, isLeapMonth]);

  const leapMonth = useMemo(() => {
    const y = parseInt(lunarYear);
    if (isNaN(y)) return 0;
    return getLeapMonth(y);
  }, [lunarYear]);

  const handleLunarMonthChange = (selectedMonth: string) => {
    setLunarMonth(selectedMonth);
    const m = parseInt(selectedMonth);
    if (isLeapMonth && leapMonth !== m) {
      setIsLeapMonth(false);
    }
  };

  const handleLunarYearChange = (selectedYear: string) => {
    setLunarYear(selectedYear);
    setIsLeapMonth(false);
    const y = parseInt(selectedYear);
    const m = parseInt(lunarMonth);
    const days = getLunarMonthDays(y, m, false);
    if (parseInt(lunarDay) > days) {
      setLunarDay(String(days));
    }
  };

  const handleCityChange = (selectedCity: string) => {
    setCity(selectedCity);
    const info = CITIES[selectedCity];
    if (info) {
      setLongitude(String(info.longitude));
      setTimezone(String(info.timezone));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let solarYear: number;
    let solarMonth: number;
    let solarDay: number;

    if (calendarType === "lunar") {
      const solar = lunarToSolar({
        year: parseInt(lunarYear),
        month: parseInt(lunarMonth),
        day: parseInt(lunarDay),
        hour: parseInt(hour),
        minute: parseInt(minute),
        isLeapMonth,
      });
      solarYear = solar.year;
      solarMonth = solar.month;
      solarDay = solar.day;
    } else {
      solarYear = parseInt(year);
      solarMonth = parseInt(month);
      solarDay = parseInt(day);
    }

    const input: BirthInput = {
      year: solarYear,
      month: solarMonth,
      day: solarDay,
      hour: parseInt(hour),
      minute: parseInt(minute),
      gender,
      longitude: parseFloat(longitude),
      birthPlace: city,
      timezone: parseFloat(timezone),
      enableNightZi,
    };

    const params = new URLSearchParams({
      y: String(input.year),
      m: String(input.month),
      d: String(input.day),
      h: String(input.hour),
      min: String(input.minute),
      g: input.gender,
      lon: String(input.longitude),
      tz: String(input.timezone || 8),
      city: input.birthPlace || '',
      nz: input.enableNightZi ? "1" : "0",
    });

    router.push(`/chart?${params.toString()}`);
  };

  const currentYear = new Date().getFullYear();

  const scrollToForm = () => {
    document.getElementById("paipan")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="ink-wash-bg relative">
      {/* ====================================================
          Hero 区域 — 全屏沉浸式
          ==================================================== */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        {/* 八卦罗盘装饰 — 双层旋转 */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* 外层罗盘 */}
          <div className="absolute w-[600px] h-[600px] opacity-[0.05] animate-slow-spin text-ink">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="0.3" />
              <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="0.3" />
              {/* 八卦爻线 */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                const rad = (angle * Math.PI) / 180;
                return (
                  <line
                    key={angle}
                    x1={100 + 80 * Math.cos(rad)}
                    y1={100 + 80 * Math.sin(rad)}
                    x2={100 + 95 * Math.cos(rad)}
                    y2={100 + 95 * Math.sin(rad)}
                    stroke="currentColor"
                    strokeWidth="0.5"
                  />
                );
              })}
              {/* 二十四山标记 */}
              {Array.from({ length: 24 }, (_, i) => {
                const angle = i * 15 - 90;
                const rad = (angle * Math.PI) / 180;
                return (
                  <line
                    key={i}
                    x1={100 + 85 * Math.cos(rad)}
                    y1={100 + 85 * Math.sin(rad)}
                    x2={100 + 90 * Math.cos(rad)}
                    y2={100 + 90 * Math.sin(rad)}
                    stroke="currentColor"
                    strokeWidth="0.2"
                  />
                );
              })}
            </svg>
          </div>
          {/* 内层太极 */}
          <div className="absolute w-[350px] h-[350px] opacity-[0.07] animate-slow-spin-reverse text-ink">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <path d="M 100 10 A 90 90 0 0 1 100 190 A 45 45 0 0 1 100 100 A 45 45 0 0 0 100 10 Z" fill="currentColor" />
              <circle cx="100" cy="55" r="8" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="100" cy="145" r="8" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Hero 内容 */}
        <div className="relative z-10 mx-auto max-w-3xl px-4 py-12 text-center">
          {/* 标题 */}
          <ScrollReveal direction="up" delay={0.1} duration={0.8}>
            <h1 className="heading-font title-gradient text-6xl md:text-7xl mb-4">
              八字推演
            </h1>
          </ScrollReveal>

          {/* 副标题 */}
          <ScrollReveal direction="up" delay={0.25} duration={0.8}>
            <p className="text-xl text-ink-light mb-2">
              严格遵循古籍原典 · 精确天文排盘 · 祖宗之法不可违
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.35} duration={0.8}>
            <p className="text-sm text-ink-lightest mb-8 tracking-wide">
              Bazi Divination Engine — Ancient Wisdom, Astronomical Precision
            </p>
          </ScrollReveal>

          {/* 特性标签 */}
          <ScrollReveal
            direction="up"
            delay={0.45}
            duration={0.6}
            staggerSelector=".hero-tag"
            stagger={0.08}
          >
            <div className="mb-8 flex flex-wrap justify-center gap-2">
              {["立春界年柱", "夜子时分柱", "真太阳时校正", "公历/农历", "国际城市"].map((tag, i) => (
                <span
                  key={tag}
                  className="hero-tag seal-tag bg-white/60 backdrop-blur-sm border border-white/80 text-ink shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </ScrollReveal>

          {/* CTA 按钮 */}
          <ScrollReveal direction="up" delay={0.55} duration={0.6}>
            <div className="flex flex-wrap justify-center gap-3">
              <MagneticButton strength={0.25}>
                <button
                  onClick={scrollToForm}
                  className="vermilion-btn animate-cta-pulse px-10 py-3.5 text-base"
                >
                  开始排盘
                </button>
              </MagneticButton>
            </div>
          </ScrollReveal>
        </div>

        {/* 向下滚动提示 */}
        <ScrollReveal direction="fade" delay={1} duration={0.8}>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
            <svg className="w-6 h-6 text-ink-lightest" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
        </ScrollReveal>
      </section>

      {/* ====================================================
          功能特性 Bento Grid — 玻璃态 + 倾斜卡片
          ==================================================== */}
      <section className="relative mx-auto max-w-4xl px-4 py-10">
        <ScrollReveal direction="up" duration={0.7}>
          <div className="mb-8 text-center">
            <span className="seal-tag bg-gold/90 text-white mb-3 inline-flex">核心特性</span>
            <h2 className="heading-font text-3xl text-ink mb-2 mt-3">九层排盘引擎</h2>
            <p className="text-sm text-ink-lighter">古籍为宗，天文为准</p>
            <div className="ink-divider mt-4 mx-auto max-w-[200px]" />
          </div>
        </ScrollReveal>

        <ScrollReveal
          direction="up"
          stagger={0.1}
          staggerSelector=".feature-card"
          duration={0.6}
          offset={5}
        >
          <div className="grid gap-4 md:grid-cols-4">
            {FEATURES.map((f, i) => (
              <TiltCard
                key={i}
                className={`feature-card glass-card bg-gradient-to-br ${f.color} ${f.border} border p-5 ${f.span}`}
                maxTilt={6}
              >
                <div className="text-3xl mb-3 animate-float" style={{ animationDelay: `${i * 0.5}s` }}>
                  {f.icon}
                </div>
                <h3 className="heading-font text-lg text-ink mb-1.5">{f.title}</h3>
                <p className="text-sm text-ink-lighter leading-relaxed">{f.desc}</p>
              </TiltCard>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ====================================================
          统计数据 — CountUp 动画
          ============================================================ */}
      <section className="mx-auto max-w-4xl px-4 py-8">
        <ScrollReveal
          direction="scale"
          stagger={0.1}
          staggerSelector=".stat-item"
          duration={0.5}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <div key={i} className="stat-item text-center glass-card p-6 stat-card">
                <div className="heading-font text-4xl text-gradient-vermilion mb-1">
                  <CountUp end={s.value} suffix={s.suffix} duration={2} />
                </div>
                <div className="text-xs text-ink-lighter tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ====================================================
          排盘表单 — 增强版
          ==================================================== */}
      <section id="paipan" className="relative mx-auto max-w-2xl px-4 py-12 scroll-mt-20">
        <ScrollReveal direction="up" duration={0.7}>
          <div className="mb-8 text-center">
            <span className="seal-tag bg-indigo-deep/90 text-white mb-3 inline-flex">排盘入口</span>
            <h2 className="heading-font text-3xl text-ink mb-2 mt-3">输入生辰，即刻排盘</h2>
            <p className="text-sm text-ink-lighter">支持公历/农历切换 · 全球城市 · 真太阳时校正</p>
            <div className="ink-divider mt-4 mx-auto max-w-[200px]" />
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.2} duration={0.7}>
          <form onSubmit={handleSubmit} className="gradient-border-card p-8 space-y-6">
            {/* 历法切换 */}
            <div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCalendarType("solar")}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                    calendarType === "solar"
                      ? "border-indigo-deep bg-indigo-deep text-white shadow-md"
                      : "border-border bg-card text-ink-light hover:bg-paper-dark hover:border-ink-lightest"
                  }`}
                >
                  公历
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarType("lunar")}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                    calendarType === "lunar"
                      ? "border-indigo-deep bg-indigo-deep text-white shadow-md"
                      : "border-border bg-card text-ink-light hover:bg-paper-dark hover:border-ink-lightest"
                  }`}
                >
                  农历
                </button>
              </div>
            </div>

            {/* 出生时间 — 公历模式 */}
            {calendarType === "solar" && (
              <div>
                <label className="heading-font text-sm text-ink mb-3 block">
                  出生时间（公历）
                </label>
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <select className="ink-input w-full" value={year} onChange={(e) => setYear(e.target.value)}>
                      {Array.from({ length: currentYear - 1900 + 1 }, (_, i) => {
                        const y = currentYear - i;
                        return <option key={y} value={y}>{y}年</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <select className="ink-input w-full" value={month} onChange={(e) => setMonth(e.target.value)}>
                      {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}月</option>)}
                    </select>
                  </div>
                  <div>
                    <select className="ink-input w-full" value={day} onChange={(e) => setDay(e.target.value)}>
                      {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}日</option>)}
                    </select>
                  </div>
                  <div>
                    <select className="ink-input w-full" value={hour} onChange={(e) => setHour(e.target.value)}>
                      {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, "0")}时</option>)}
                    </select>
                  </div>
                  <div>
                    <select className="ink-input w-full" value={minute} onChange={(e) => setMinute(e.target.value)}>
                      {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, "0")}分</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 出生时间 — 农历模式 */}
            {calendarType === "lunar" && (
              <div>
                <label className="heading-font text-sm text-ink mb-3 block">
                  出生时间（农历）
                </label>
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <select className="ink-input w-full" value={lunarYear} onChange={(e) => handleLunarYearChange(e.target.value)}>
                      {Array.from({ length: currentYear - 1900 + 1 }, (_, i) => {
                        const y = currentYear - i;
                        return <option key={y} value={y}>{y}年</option>;
                      })}
                    </select>
                  </div>
                  <div>
                    <select className="ink-input w-full" value={lunarMonth} onChange={(e) => handleLunarMonthChange(e.target.value)}>
                      {lunarMonths.filter(m => !m.isLeap).map((m) => (
                        <option key={m.month} value={m.month}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    {leapMonth === parseInt(lunarMonth) ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsLeapMonth(!isLeapMonth);
                          const y = parseInt(lunarYear);
                          const m = parseInt(lunarMonth);
                          const days = getLunarMonthDays(y, m, !isLeapMonth);
                          if (parseInt(lunarDay) > days) setLunarDay(String(days));
                        }}
                        className={`w-full rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                          isLeapMonth ? "border-vermilion bg-vermilion text-white" : "border-border bg-card text-ink-light hover:bg-paper-dark"
                        }`}
                      >
                        {isLeapMonth ? "闰月 ✓" : "闰月"}
                      </button>
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-ink-lightest border border-dashed border-border rounded-lg">
                        {leapMonth > 0 ? `闰${leapMonth}月` : "无闰月"}
                      </div>
                    )}
                  </div>
                  <div>
                    <select className="ink-input w-full" value={lunarDay} onChange={(e) => setLunarDay(e.target.value)}>
                      {Array.from({ length: lunarMonthDayCount }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}日</option>)}
                    </select>
                  </div>
                  <div>
                    <select className="ink-input w-full" value={hour} onChange={(e) => setHour(e.target.value)}>
                      {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, "0")}时</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-2">
                  <select className="ink-input w-32" value={minute} onChange={(e) => setMinute(e.target.value)}>
                    {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, "0")}分</option>)}
                  </select>
                </div>
                {isLeapMonth && (
                  <p className="mt-1.5 text-xs text-vermilion">已选闰月 · {lunarMonthDayCount}天</p>
                )}
              </div>
            )}

            {/* 性别 */}
            <div>
              <label className="heading-font text-sm text-ink mb-3 block">性别</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGender("男")}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                    gender === "男" ? "border-vermilion bg-vermilion text-white shadow-md" : "border-border bg-card text-ink-light hover:bg-paper-dark hover:border-ink-lightest"
                  }`}
                >
                  男
                </button>
                <button
                  type="button"
                  onClick={() => setGender("女")}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                    gender === "女" ? "border-vermilion bg-vermilion text-white shadow-md" : "border-border bg-card text-ink-light hover:bg-paper-dark hover:border-ink-lightest"
                  }`}
                >
                  女
                </button>
              </div>
            </div>

            {/* 出生地 */}
            <div>
              <label className="heading-font text-sm text-ink mb-3 block">出生地</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <select className="ink-input w-full" value={city} onChange={(e) => handleCityChange(e.target.value)}>
                    {regionOrder.map((region) => {
                      const cities = citiesByRegion[region];
                      if (!cities || cities.length === 0) return null;
                      return (
                        <optgroup key={region} label={REGION_LABELS[region]}>
                          {cities.map((c) => (
                            <option key={c} value={c}>
                              {c}（UTC{CITIES[c].timezone >= 0 ? '+' : ''}{CITIES[c].timezone}）
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                    <option value="自定义">自定义经度/时区</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.01"
                    className="ink-input w-full"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="经度"
                  />
                  <input
                    type="number"
                    step="0.5"
                    className="ink-input w-full"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="UTC偏移"
                  />
                </div>
              </div>
              <p className="mt-1.5 text-xs text-ink-lightest">
                经度用于真太阳时校正（4分钟×(经度−{parseFloat(timezone) > 0 ? timezone : `(${timezone})`}×15°)）· UTC{parseFloat(timezone) >= 0 ? '+' : ''}{timezone} · 选择城市自动填入，也可手动输入
              </p>
            </div>

            {/* 夜子时选项 */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableNightZi}
                  onChange={(e) => setEnableNightZi(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-vermilion focus:ring-vermilion"
                />
                <div>
                  <span className="text-sm font-medium text-ink">启用夜子时/子正区分</span>
                  <p className="text-xs text-ink-lightest">
                    23:00-00:00为夜子时（日柱用当日，时柱用次日干遁）；默认启用
                  </p>
                </div>
              </label>
            </div>

            {/* 提交按钮 */}
            <MagneticButton strength={0.15} className="w-full block">
              <button type="submit" className="vermilion-btn w-full py-3.5 text-base">
                开始排盘
              </button>
            </MagneticButton>
          </form>
        </ScrollReveal>

        <ScrollReveal direction="fade" delay={0.3} duration={0.6}>
          <div className="mt-6 text-center">
            <p className="text-xs text-ink-lightest">
              排盘引擎全部纯客户端计算，无需联网，零网络延迟
            </p>
          </div>
        </ScrollReveal>
      </section>

    </div>
  );
}
