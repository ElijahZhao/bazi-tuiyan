"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CITIES, REGION_LABELS, type CityRegion } from "@/lib/engine/constants";
import type { BirthInput } from "@/lib/engine/types";

export default function HomePage() {
  const router = useRouter();

  const [year, setYear] = useState("1990");
  const [month, setMonth] = useState("6");
  const [day, setDay] = useState("15");
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

    const input: BirthInput = {
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      hour: parseInt(hour),
      minute: parseInt(minute),
      gender,
      longitude: parseFloat(longitude),
      birthPlace: city,
      timezone: parseFloat(timezone),
      enableNightZi,
    };

    // 编码到 URL 参数
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* 标题区 */}
      <div className="mb-10 text-center">
        <h1 className="heading-font text-4xl text-ink mb-3">八字推演</h1>
        <p className="text-ink-lighter text-sm">
          严格遵循古籍原典 · 精确天文排盘 · 祖宗之法不可违
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <span className="seal-tag bg-vermilion text-white">立春界年柱</span>
          <span className="seal-tag bg-jade text-white">夜子时分柱</span>
          <span className="seal-tag bg-gold text-white">真太阳时校正</span>
          <span className="seal-tag bg-indigo-deep text-white">29条规则</span>
        </div>
      </div>

      {/* 排盘表单 */}
      <form onSubmit={handleSubmit} className="ink-card p-6 space-y-6">
        {/* 出生时间 */}
        <div>
          <label className="heading-font text-sm text-ink mb-3 block">
            出生时间（公历）
          </label>
          <div className="grid grid-cols-5 gap-2">
            <div>
              <select
                className="ink-input w-full"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                {Array.from({ length: currentYear - 1900 + 1 }, (_, i) => {
                  const y = currentYear - i;
                  return (
                    <option key={y} value={y}>
                      {y}年
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <select
                className="ink-input w-full"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}月
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                className="ink-input w-full"
                value={day}
                onChange={(e) => setDay(e.target.value)}
              >
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}日
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                className="ink-input w-full"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, "0")}时
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                className="ink-input w-full"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, "0")}分
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 性别 */}
        <div>
          <label className="heading-font text-sm text-ink mb-3 block">性别</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setGender("男")}
              className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                gender === "男"
                  ? "border-vermilion bg-vermilion text-white"
                  : "border-border bg-card text-ink-light hover:bg-paper-dark"
              }`}
            >
              男
            </button>
            <button
              type="button"
              onClick={() => setGender("女")}
              className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                gender === "女"
                  ? "border-vermilion bg-vermilion text-white"
                  : "border-border bg-card text-ink-light hover:bg-paper-dark"
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
              <select
                className="ink-input w-full"
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
              >
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
        <button
          type="submit"
          className="vermilion-btn w-full py-3 text-base"
        >
          开始排盘
        </button>
      </form>

      {/* 说明 */}
      <div className="mt-6 text-center">
        <p className="text-xs text-ink-lightest">
          排盘引擎全部纯客户端计算，无需联网，零网络延迟
        </p>
      </div>
    </div>
  );
}
