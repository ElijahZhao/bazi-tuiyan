"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CITIES, REGION_LABELS, type CityRegion } from "@/lib/engine/constants";
import type { BirthInput } from "@/lib/engine/types";
import { getLunarMonths, getLunarMonthDays, getLeapMonth, lunarToSolar } from "@/lib/lunar-utils";

type CalendarType = "solar" | "lunar";

/* ============================================================
   功能特性数据
   ============================================================ */
const FEATURES = [
  {
    icon: "📜",
    title: "29条排盘规则",
    desc: "严格遵循《三命通会》《渊海子平》《子平真诠》等12部古籍原典，每条规则可溯源",
    color: "border-vermilion/30 bg-vermilion/5",
    span: "md:col-span-2",
  },
  {
    icon: "🔭",
    title: "天文级精度",
    desc: "VSOP87+DE440算法，节气偏差<30秒",
    color: "border-indigo-deep/30 bg-indigo-deep/5",
    span: "",
  },
  {
    icon: "📅",
    title: "公历/农历双历法",
    desc: "自由切换，支持闰月转换",
    color: "border-jade/30 bg-jade/5",
    span: "",
  },
  {
    icon: "🌍",
    title: "150+国际城市",
    desc: "覆盖六大洲，自动匹配经度与时区",
    color: "border-gold/30 bg-gold/5",
    span: "",
  },
  {
    icon: "☀️",
    title: "真太阳时校正",
    desc: "经度差 + 均时差 + 夏令时还原，四步精确校正",
    color: "border-vermilion/30 bg-vermilion/5",
    span: "md:col-span-2",
  },
];

const STATS = [
  { value: "150+", label: "国际城市" },
  { value: "346", label: "单元测试" },
  { value: "12", label: "古籍原典" },
  { value: "9", label: "层排盘引擎" },
];

export default function HomePage() {
  const router = useRouter();

  // 历法类型
  const [calendarType, setCalendarType] = useState<CalendarType>("solar");

  // 公历日期
  const [year, setYear] = useState("1990");
  const [month, setMonth] = useState("6");
  const [day, setDay] = useState("15");

  // 农历日期
  const [lunarYear, setLunarYear] = useState("1990");
  const [lunarMonth, setLunarMonth] = useState("5");
  const [lunarDay, setLunarDay] = useState("15");
  const [isLeapMonth, setIsLeapMonth] = useState(false);

  // 共用
  const [hour, setHour] = useState("10");
  const [minute, setMinute] = useState("30");
  const [gender, setGender] = useState<"男" | "女">("男");
  const [city, setCity] = useState("北京");
  const [longitude, setLongitude] = useState("116.41");
  const [timezone, setTimezone] = useState("8");
  const [enableNightZi, setEnableNightZi] = useState(true);

  // 按地区分组城市
  const citiesByRegion = Object.entries(CITIES).reduce(
    (acc, [name, info]) => {
      if (!acc[info.region]) acc[info.region] = [];
      acc[info.region].push(name);
      return acc;
    },
    {} as Record<CityRegion, string[]>
  );

  const regionOrder: CityRegion[] = ['china', 'asia', 'europe', 'america', 'oceania', 'africa'];

  // 农历月份列表
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
    <div>
      {/* ====================================================
          Hero 区域
          ==================================================== */}
      <section className="relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] opacity-[0.03] animate-slow-spin">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* 八卦罗盘装饰 */}
              <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="100" cy="100" r="75" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="100" cy="100" r="55" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="100" cy="100" r="35" fill="none" stroke="currentColor" strokeWidth="0.5" />
              {/* 太极图 */}
              <path d="M 100 5 A 95 95 0 0 1 100 195 A 47.5 47.5 0 0 1 100 100 A 47.5 47.5 0 0 0 100 5 Z" fill="currentColor" />
              {/* 八卦爻线 */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                const rad = (angle * Math.PI) / 180;
                const x1 = 100 + 55 * Math.cos(rad);
                const y1 = 100 + 55 * Math.sin(rad);
                const x2 = 100 + 75 * Math.cos(rad);
                const y2 = 100 + 75 * Math.sin(rad);
                return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1" />;
              })}
            </svg>
          </div>
        </div>

        <div className="relative mx-auto max-w-4xl px-4 pt-20 pb-12 text-center">
          {/* 徽章 */}
          <div className="mb-6 flex justify-center animate-fade-in-up">
            <span className="seal-tag bg-vermilion text-white">开源 · 纯客户端 · 零延迟</span>
          </div>

          {/* 标题 */}
          <h1 className="heading-font title-gradient text-5xl md:text-6xl mb-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            八字推演
          </h1>

          {/* 副标题 */}
          <p className="text-lg text-ink-lighter mb-2 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            严格遵循古籍原典 · 精确天文排盘 · 祖宗之法不可违
          </p>
          <p className="text-sm text-ink-lightest mb-8 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            Bazi Divination Engine — Ancient Wisdom, Astronomical Precision
          </p>

          {/* 特性标签 */}
          <div className="mb-8 flex flex-wrap justify-center gap-2 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <span className="seal-tag bg-vermilion text-white">立春界年柱</span>
            <span className="seal-tag bg-jade text-white">夜子时分柱</span>
            <span className="seal-tag bg-gold text-white">真太阳时校正</span>
            <span className="seal-tag bg-indigo-deep text-white">公历/农历</span>
            <span className="seal-tag bg-jade text-white">国际城市</span>
          </div>

          {/* CTA 按钮 */}
          <div className="flex flex-wrap justify-center gap-3 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            <button
              onClick={scrollToForm}
              className="vermilion-btn animate-cta-pulse px-8 py-3 text-base"
            >
              开始排盘
            </button>
            <a
              href="https://github.com/ElijahZhao/bazi-tuiyan"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-border bg-card px-8 py-3 text-base font-medium text-ink-light transition-colors hover:bg-paper-dark hover:text-ink"
            >
              GitHub 源码
            </a>
          </div>

          {/* 在线访问地址 */}
          <div className="mt-6 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
            <a
              href="https://bazi-tuiyan.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-indigo-deep hover:text-vermilion transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              bazi-tuiyan.vercel.app
            </a>
          </div>
        </div>
      </section>

      {/* ====================================================
          功能特性 Bento Grid
          ==================================================== */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 text-center">
          <h2 className="heading-font text-2xl text-ink mb-2">核心特性</h2>
          <p className="text-sm text-ink-lighter">九层排盘引擎，古籍为宗，天文为准</p>
          <div className="ink-divider mt-4" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className={`ink-card p-5 border-2 ${f.color} ${f.span} animate-fade-in-up`}
              style={{ animationDelay: `${0.1 * i}s` }}
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="heading-font text-base text-ink mb-1">{f.title}</h3>
              <p className="text-sm text-ink-lighter leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ====================================================
          统计数据
          ==================================================== */}
      <section className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <div key={i} className="text-center ink-card stat-card p-5">
              <div className="heading-font text-3xl text-vermilion mb-1">{s.value}</div>
              <div className="text-xs text-ink-lighter">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ====================================================
          排盘表单
          ==================================================== */}
      <section id="paipan" className="mx-auto max-w-2xl px-4 py-12 scroll-mt-20">
        <div className="mb-8 text-center">
          <span className="seal-tag bg-indigo-deep text-white mb-3 inline-flex">排盘入口</span>
          <h2 className="heading-font text-2xl text-ink mb-2">输入生辰，即刻排盘</h2>
          <p className="text-sm text-ink-lighter">支持公历/农历切换 · 全球城市 · 真太阳时校正</p>
          <div className="ink-divider mt-4" />
        </div>

        <form onSubmit={handleSubmit} className="ink-card p-6 space-y-6">
          {/* 历法切换 */}
          <div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCalendarType("solar")}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  calendarType === "solar"
                    ? "border-indigo-deep bg-indigo-deep text-white"
                    : "border-border bg-card text-ink-light hover:bg-paper-dark"
                }`}
              >
                公历
              </button>
              <button
                type="button"
                onClick={() => setCalendarType("lunar")}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  calendarType === "lunar"
                    ? "border-indigo-deep bg-indigo-deep text-white"
                    : "border-border bg-card text-ink-light hover:bg-paper-dark"
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
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  gender === "男" ? "border-vermilion bg-vermilion text-white" : "border-border bg-card text-ink-light hover:bg-paper-dark"
                }`}
              >
                男
              </button>
              <button
                type="button"
                onClick={() => setGender("女")}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  gender === "女" ? "border-vermilion bg-vermilion text-white" : "border-border bg-card text-ink-light hover:bg-paper-dark"
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
          <button type="submit" className="vermilion-btn w-full py-3 text-base">
            开始排盘
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-ink-lightest">
            排盘引擎全部纯客户端计算，无需联网，零网络延迟
          </p>
        </div>
      </section>

      {/* ====================================================
          底部 CTA
          ==================================================== */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="ink-card p-8 text-center">
          <h3 className="heading-font text-xl text-ink mb-2">祖宗之法，排盘有据</h3>
          <p className="mx-auto mb-5 max-w-xl text-sm text-ink-lighter">
            排盘引擎全部纯客户端计算，无需联网；每一条规则皆可溯源至古籍原典与权威天文数据。
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={scrollToForm} className="vermilion-btn px-6 py-2.5 text-sm">
              开始排盘
            </button>
            <a
              href="https://github.com/ElijahZhao/bazi-tuiyan"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-medium text-ink-light transition-colors hover:bg-paper-dark hover:text-ink"
            >
              查看源码
            </a>
            <a
              href="https://bazi-tuiyan.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-medium text-ink-light transition-colors hover:bg-paper-dark hover:text-ink"
            >
              在线访问
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
