"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { paipan } from "@/lib/engine/index";
import type { BaziChart, BirthInput, FourPillars, PillarDetail } from "@/lib/engine/types";
import { ELEMENT_COLORS, TEN_GOD_COLORS, formatStartAge } from "@/lib/utils";
import { saveChart } from "@/lib/storage";
import ChartSection from "@/components/charts/chart-section";
import InterpretationPanel from "@/components/interpretation/interpretation-panel";
import { PillarEntrance, ElementRing, useDaYunScroll } from "@/components/animations/gsap-effects";

// ============================================================
// 工具函数
// ============================================================

function getStemColor(stem: string): string {
  const map: Record<string, string> = {
    甲: "text-emerald-600", 乙: "text-emerald-600",
    丙: "text-red-600", 丁: "text-red-600",
    戊: "text-amber-600", 己: "text-amber-600",
    庚: "text-slate-500", 辛: "text-slate-500",
    壬: "text-blue-600", 癸: "text-blue-600",
  };
  return map[stem] || "text-ink";
}

function getBranchColor(branch: string): string {
  const map: Record<string, string> = {
    子: "text-blue-600", 亥: "text-blue-600",
    寅: "text-emerald-600", 卯: "text-emerald-600",
    巳: "text-red-600", 午: "text-red-600",
    申: "text-slate-500", 酉: "text-slate-500",
    辰: "text-amber-600", 戌: "text-amber-600",
    丑: "text-amber-600", 未: "text-amber-600",
  };
  return map[branch] || "text-ink";
}

function getRelationColor(type: string): string {
  const map: Record<string, string> = {
    六合: "bg-jade text-white",
    三合: "bg-jade text-white",
    半三合: "bg-jade-light text-white",
    三会: "bg-indigo-deep text-white",
    六冲: "bg-vermilion text-white",
    三刑: "bg-vermilion text-white",
    六害: "bg-gold text-white",
    相破: "bg-gold text-white",
    天干五合: "bg-jade text-white",
    天干相冲: "bg-vermilion text-white",
  };
  return map[type] || "bg-ink-light text-white";
}

function formatTime(date: Date): string {
  return `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日 ${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

// ============================================================
// 主组件
// ============================================================

function ChartContent() {
  const searchParams = useSearchParams();
  const [saved, setSaved] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  const input: BirthInput = useMemo(() => {
    return {
      year: parseInt(searchParams.get("y") || "1990"),
      month: parseInt(searchParams.get("m") || "6"),
      day: parseInt(searchParams.get("d") || "15"),
      hour: parseInt(searchParams.get("h") || "10"),
      minute: parseInt(searchParams.get("min") || "30"),
      gender: (searchParams.get("g") || "男") as "男" | "女",
      longitude: parseFloat(searchParams.get("lon") || "116.41"),
      birthPlace: searchParams.get("city") || "北京",
      timezone: parseFloat(searchParams.get("tz") || "8"),
      enableNightZi: searchParams.get("nz") !== "0",
    };
  }, [searchParams]);

  const chart = useMemo(() => paipan(input), [input]);

  const handleSave = () => {
    if (!saveName.trim()) return;
    saveChart({
      id: chart.id,
      name: saveName.trim(),
      input,
      savedAt: new Date().toISOString(),
    });
    setSaved(true);
    setShowSaveInput(false);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* ========== 标题区 ========== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="heading-font text-3xl text-ink mb-2">命盘排演</h1>
        <p className="text-sm text-ink-lighter">
          {input.birthPlace} · {input.gender} · {input.year}年{input.month}月{input.day}日 {String(input.hour).padStart(2, "0")}:{String(input.minute).padStart(2, "0")}
        </p>
      </motion.div>

      {/* ========== 时间校正信息 ========== */}
      <TimeCorrectionInfo chart={chart} />

      {/* ========== 四柱主表 ========== */}
      <PillarEntrance>
        <FourPillarsTable chart={chart} />
      </PillarEntrance>

      {/* ========== 辅助宫位 ========== */}
      <AuxiliaryPalaces chart={chart} />

      {/* ========== 大运 ========== */}
      <DaYunSection chart={chart} />

      {/* ========== 流年 ========== */}
      <LiuNianSection chart={chart} />

      {/* ========== 小运 ========== */}
      <XiaoYunSection chart={chart} />

      {/* ========== 流月/流日/流时 ========== */}
      <LiuYueRiShiSection chart={chart} />

      {/* ========== 关系分析 ========== */}
      <RelationsSection chart={chart} />

      {/* ========== 旺衰格局 ========== */}
      <ProsperitySection chart={chart} />

      {/* ========== 人元司令分野 ========== */}
      <RenYuanSiLingSection chart={chart} />

      {/* ========== 可视化图表 ========== */}
      <ChartSection chart={chart} />

      {/* ========== 五行统计 ========== */}
      <ElementCountSection chart={chart} />

      {/* ========== 命局解读 ========== */}
      <InterpretationPanel chart={chart} />

      {/* ========== 保存命盘 ========== */}
      <SaveSection
        saved={saved}
        showSaveInput={showSaveInput}
        saveName={saveName}
        setSaveName={setSaveName}
        setShowSaveInput={setShowSaveInput}
        onSave={handleSave}
      />
    </div>
  );
}

// ============================================================
// 时间校正信息
// ============================================================

function TimeCorrectionInfo({ chart }: { chart: BaziChart }) {
  const tc = chart.timeCorrection;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="ink-card p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="seal-tag bg-indigo-deep text-white">时间校正</span>
        <span className="heading-font text-sm text-ink">真太阳时排盘</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-ink-lightest">钟表时间</span>
          <p className="text-ink font-medium mt-0.5">{formatTime(tc.clockTime)}</p>
        </div>
        <div>
          <span className="text-ink-lightest">夏令时还原</span>
          <p className="text-ink font-medium mt-0.5">
            {tc.dstApplied ? "是（-1h）" : "否"}
          </p>
        </div>
        <div>
          <span className="text-ink-lightest">经度差修正</span>
          <p className="text-ink font-medium mt-0.5">
            {tc.longitudeDiff >= 0 ? "+" : ""}{tc.longitudeDiff.toFixed(1)}分钟
          </p>
        </div>
        <div>
          <span className="text-ink-lightest">均时差修正</span>
          <p className="text-ink font-medium mt-0.5">
            {tc.equationOfTime >= 0 ? "+" : ""}{tc.equationOfTime.toFixed(1)}分钟
          </p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="seal-tag bg-vermilion text-white">真太阳时</span>
          <span className="text-sm text-ink font-medium">{formatTime(tc.trueSolarTime)}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// 四柱主表
// ============================================================

function FourPillarsTable({ chart }: { chart: BaziChart }) {
  const fp = chart.fourPillars;
  const pillars: { label: string; detail: PillarDetail; key: keyof FourPillars }[] = [
    { label: "年柱", detail: fp.year, key: "year" },
    { label: "月柱", detail: fp.month, key: "month" },
    { label: "日柱", detail: fp.day, key: "day" },
    { label: "时柱", detail: fp.hour, key: "hour" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="ink-card p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="seal-tag bg-vermilion text-white">四柱</span>
        <span className="heading-font text-base text-ink">八字主表</span>
      </div>

      {/* 四柱干支大字 */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {pillars.map(({ label, detail }) => (
          <div key={label} className="text-center">
            <div className="text-xs text-ink-lightest mb-2">{label}</div>
            {/* 天干 */}
            <div data-pillar-stem className={`ganzhi-text text-3xl mb-1 ${getStemColor(detail.stem)}`}>
              {detail.stem}
            </div>
            {/* 地支 */}
            <div data-pillar-branch className={`ganzhi-text text-3xl mb-2 ${getBranchColor(detail.branch)}`}>
              {detail.branch}
            </div>
            {/* 纳音 */}
            <div data-pillar-meta className="text-xs text-gold-dark mb-1">
              {detail.nayin}
              {label === "年柱" && (
                <span className="ml-0.5 text-[10px] text-indigo-deep/70">（古法）</span>
              )}
              {label === "日柱" && (
                <span className="ml-0.5 text-[10px] text-vermilion/70">（子平）</span>
              )}
            </div>
            {/* 十神 */}
            {label !== "日柱" ? (
              <div data-pillar-meta className={`text-xs font-medium ${TEN_GOD_COLORS[detail.tenGod] || "text-ink-light"}`}>
                {detail.tenGod}
              </div>
            ) : (
              <div data-pillar-meta className="text-xs font-medium text-vermilion">日主</div>
            )}
          </div>
        ))}
      </div>

      {/* 藏干 */}
      <div className="ink-divider mb-4" />
      <div className="grid grid-cols-4 gap-2 mb-4">
        {pillars.map(({ label }) => {
          const hidden = chart.hiddenStems[label.replace("柱", "") as keyof typeof chart.hiddenStems];
          return (
            <div key={label} className="text-center">
              <div className="text-xs text-ink-lightest mb-1">藏干</div>
              <div className="space-y-0.5">
                {hidden.map((h, i) => (
                  <div key={i} className="flex items-center justify-center gap-1">
                    <span className={`text-sm font-medium ${getStemColor(h.stem)}`}>{h.stem}</span>
                    <span className="text-xs text-ink-lightest">
                      {Math.round(h.ratio * 100)}%
                    </span>
                  </div>
                ))}
                {hidden.length === 0 && (
                  <span className="text-xs text-ink-lightest">—</span>
                )}
              </div>
              {/* 藏干十神 */}
              {label !== "日柱" && hidden.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {hidden.map((h, i) => (
                    <div key={i} className={`text-xs ${TEN_GOD_COLORS[chart.tenGods.hiddenStems[label.replace("柱", "") as keyof typeof chart.tenGods.hiddenStems][i]?.tenGod] || "text-ink-lightest"}`}>
                      {chart.tenGods.hiddenStems[label.replace("柱", "") as keyof typeof chart.tenGods.hiddenStems][i]?.tenGod}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 十二长生 */}
      <div className="ink-divider mb-4" />
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-xs text-ink-lightest text-center mb-1 col-span-4">十二长生</div>
        {pillars.map(({ label, key }) => {
          const stage = chart.lifeStages[key];
          return (
            <div key={label} className="text-center">
              <span className={`text-xs font-medium ${
                stage === "长生" || stage === "帝旺" || stage === "临官" ? "text-jade" :
                stage === "死" || stage === "墓" || stage === "绝" ? "text-vermilion" :
                "text-ink-lighter"
              }`}>
                {stage}
              </span>
            </div>
          );
        })}
      </div>

      {/* 纳音口径说明 */}
      <div className="mt-2 mb-1">
        <p className="text-[10px] text-ink-lightest text-center">
          纳音口径：古法以年柱纳音论命（《李虚中命书》），子平法以日柱为主（《子平真诠》），两者并存
        </p>
      </div>

      {/* 空亡 */}
      <div className="ink-divider mb-4" />
      <div className="flex items-center justify-center gap-4 text-xs">
        <span className="text-ink-lightest">空亡（日柱旬空）：</span>
        <span className="text-vermilion font-medium">
          {chart.kongWang.day.length > 0 ? chart.kongWang.day.join("、") : "无"}
        </span>
      </div>

      {/* 神煞 */}
      <div className="ink-divider mb-4" />
      <div className="grid grid-cols-4 gap-2">
        {(["year", "month", "day", "hour"] as const).map((key) => {
          const label = key === "year" ? "年柱" : key === "month" ? "月柱" : key === "day" ? "日柱" : "时柱";
          const shenSha = chart.shenSha[key] || [];
          return (
            <div key={key} className="text-center">
              <div className="text-xs text-ink-lightest mb-1">{label}神煞</div>
              <div className="flex flex-wrap justify-center gap-1">
                {shenSha.length > 0 ? (
                  shenSha.map((ss, i) => (
                    <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-gold/10 text-gold-dark">
                      {ss}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-ink-lightest">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ============================================================
// 辅助宫位
// ============================================================

function AuxiliaryPalaces({ chart }: { chart: BaziChart }) {
  const palaces = [
    { label: "胎元", pillar: chart.taiYuan, color: "bg-indigo-deep" },
    { label: "命宫", pillar: chart.mingGong, color: "bg-jade" },
    { label: "身宫", pillar: chart.shenGong, color: "bg-gold" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="ink-card p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="seal-tag bg-indigo-deep text-white">辅助宫位</span>
        <span className="heading-font text-base text-ink">胎元 · 命宫 · 身宫</span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {palaces.map(({ label, pillar, color }) => (
          <div key={label} className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className={`seal-tag ${color} text-white`}>{label}</span>
            </div>
            <div className="ganzhi-text text-2xl text-ink mb-1">
              <span className={getStemColor(pillar.stem)}>{pillar.stem}</span>
              <span className={getBranchColor(pillar.branch)}>{pillar.branch}</span>
            </div>
            <div className="text-xs text-gold-dark">{pillar.nayin}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================
// 大运
// ============================================================

function DaYunSection({ chart }: { chart: BaziChart }) {
  const dy = chart.daYun;
  const scrollRef = useRef<HTMLDivElement>(null);
  useDaYunScroll(scrollRef);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="ink-card p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="seal-tag bg-jade text-white">大运</span>
        <span className="heading-font text-base text-ink">
          {dy.direction}行 · 起运 {formatStartAge(dy.startAge, dy.startMonth, dy.startDay, dy.startHour)}
        </span>
      </div>
      <div ref={scrollRef} className="overflow-x-auto">
        <div className="flex gap-3 min-w-max">
          {dy.steps.map((step) => {
            const isCurrent = step.startAge <= 30 && step.startAge + 10 > 30;
            return (
              <div
                key={step.index}
                data-dayun-card
                className={`flex-shrink-0 w-20 text-center rounded-lg p-3 border transition-colors ${
                  isCurrent
                    ? "border-vermilion bg-vermilion/5"
                    : "border-border bg-card hover:bg-paper-dark"
                }`}
              >
                <div className="text-xs text-ink-lightest mb-1">
                  {step.startAge}岁起
                </div>
                <div className="ganzhi-text text-xl text-ink mb-1">
                  <span className={getStemColor(step.pillar.stem)}>{step.pillar.stem}</span>
                  <span className={getBranchColor(step.pillar.branch)}>{step.pillar.branch}</span>
                </div>
                <div className="text-xs text-gold-dark mb-1">{step.pillar.nayin}</div>
                <div className="text-xs text-ink-lighter">
                  {step.startYear}年
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// 流年
// ============================================================

function LiuNianSection({ chart }: { chart: BaziChart }) {
  const currentYear = new Date().getFullYear();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="ink-card p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="seal-tag bg-gold text-white">流年</span>
        <span className="heading-font text-base text-ink">前后十年流年</span>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {chart.liuNian.map((ln) => {
            const isCurrent = ln.year === currentYear;
            return (
              <div
                key={ln.year}
                className={`flex-shrink-0 w-16 text-center rounded-lg p-2 border ${
                  isCurrent
                    ? "border-vermilion bg-vermilion/5"
                    : "border-border bg-card"
                }`}
              >
                <div className={`text-xs mb-1 ${isCurrent ? "text-vermilion font-bold" : "text-ink-lightest"}`}>
                  {ln.year}
                </div>
                <div className="ganzhi-text text-base text-ink">
                  <span className={getStemColor(ln.pillar.stem)}>{ln.pillar.stem}</span>
                  <span className={getBranchColor(ln.pillar.branch)}>{ln.pillar.branch}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// 小运
// ============================================================

function XiaoYunSection({ chart }: { chart: BaziChart }) {
  const currentAge = new Date().getFullYear() - chart.input.year;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="ink-card p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="seal-tag bg-indigo-deep text-white">小运</span>
        <span className="heading-font text-base text-ink">虚岁逐年行运</span>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {chart.xiaoYun.map((xy) => {
            const isCurrent = xy.age === currentAge;
            return (
              <div
                key={xy.age}
                className={`flex-shrink-0 w-14 text-center rounded-lg p-2 border ${
                  isCurrent
                    ? "border-vermilion bg-vermilion/5"
                    : "border-border bg-card"
                }`}
              >
                <div className={`text-xs mb-1 ${isCurrent ? "text-vermilion font-bold" : "text-ink-lightest"}`}>
                  {xy.age}岁
                </div>
                <div className="ganzhi-text text-sm text-ink">
                  <span className={getStemColor(xy.pillar.stem)}>{xy.pillar.stem}</span>
                  <span className={getBranchColor(xy.pillar.branch)}>{xy.pillar.branch}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// 流月/流日/流时
// ============================================================

function LiuYueRiShiSection({ chart }: { chart: BaziChart }) {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentHour = now.getHours();

  // 当前时辰索引（子=0, 丑=1, ... 亥=11）
  const currentShiIdx = Math.floor(((currentHour + 1) % 24) / 2);

  // 当前流月地支
  const currentMonthBranch = chart.liuYue[currentMonth]?.monthBranch || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.52 }}
      className="ink-card p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="seal-tag bg-gold text-white">流运</span>
        <span className="heading-font text-base text-ink">流月 · 流日 · 流时</span>
      </div>

      {/* 流月 */}
      <div className="mb-4">
        <div className="text-xs text-ink-lighter mb-2">流月（{now.getFullYear()}年）</div>
        <div className="overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {chart.liuYue.map((ly, i) => {
              const isCurrent = ly.monthBranch === currentMonthBranch;
              return (
                <div
                  key={i}
                  className={`flex-shrink-0 w-16 text-center rounded-lg p-2 border ${
                    isCurrent
                      ? "border-vermilion bg-vermilion/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className={`text-xs mb-1 ${isCurrent ? "text-vermilion font-bold" : "text-ink-lightest"}`}>
                    {ly.monthBranch}月
                  </div>
                  <div className="ganzhi-text text-base text-ink">
                    <span className={getStemColor(ly.pillar.stem)}>{ly.pillar.stem}</span>
                    <span className={getBranchColor(ly.pillar.branch)}>{ly.pillar.branch}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 流日 + 流时 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 流日 */}
        <div className="rounded-lg border border-border bg-paper/30 p-3">
          <div className="text-xs text-ink-lighter mb-2">流日（今日）</div>
          <div className="text-center">
            <div className="text-xs text-ink-lightest mb-1">{chart.liuRi.date}</div>
            <div className="ganzhi-text text-2xl text-ink">
              <span className={getStemColor(chart.liuRi.pillar.stem)}>{chart.liuRi.pillar.stem}</span>
              <span className={getBranchColor(chart.liuRi.pillar.branch)}>{chart.liuRi.pillar.branch}</span>
            </div>
            <div className="text-xs text-gold-dark mt-1">{chart.liuRi.pillar.nayin}</div>
          </div>
        </div>

        {/* 流时 */}
        <div className="md:col-span-2 rounded-lg border border-border bg-paper/30 p-3">
          <div className="text-xs text-ink-lighter mb-2">流时（今日十二时辰）</div>
          <div className="grid grid-cols-6 gap-1.5">
            {chart.liuShi.map((ls, i) => {
              const isCurrent = i === currentShiIdx;
              return (
                <div
                  key={i}
                  className={`text-center rounded p-1.5 border ${
                    isCurrent
                      ? "border-vermilion bg-vermilion/5"
                      : "border-border bg-card"
                  }`}
                >
                  <div className={`text-xs ${isCurrent ? "text-vermilion font-bold" : "text-ink-lightest"}`}>
                    {ls.hourBranch}时
                  </div>
                  <div className="ganzhi-text text-sm text-ink mt-0.5">
                    <span className={getStemColor(ls.pillar.stem)}>{ls.pillar.stem}</span>
                    <span className={getBranchColor(ls.pillar.branch)}>{ls.pillar.branch}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// 人元司令分野
// ============================================================

function RenYuanSiLingSection({ chart }: { chart: BaziChart }) {
  const ry = chart.renYuanSiLing;
  if (!ry || !ry.segments || ry.segments.length === 0) return null;

  const currentStem = ry.currentSegment?.stem;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.62 }}
      className="ink-card p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="seal-tag bg-indigo-deep text-white">司令</span>
        <span className="heading-font text-base text-ink">
          人元司令分野 · 月支{ry.month}
        </span>
      </div>

      {/* 司令之气 */}
      {currentStem && (
        <div className="mb-4 p-3 rounded-lg bg-vermilion/5 border border-vermilion/30">
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-lighter">当令司令：</span>
            <span className={`ganzhi-text text-xl ${getStemColor(currentStem)}`}>{currentStem}</span>
            <span className="text-xs text-ink-lightest">
              {ry.currentSegment?.description || ""}
            </span>
          </div>
        </div>
      )}

      {/* 分野表 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 text-xs text-ink-lighter">藏干</th>
              <th className="text-center py-2 px-2 text-xs text-ink-lighter">用事日数</th>
              <th className="text-left py-2 px-2 text-xs text-ink-lighter">说明</th>
              <th className="text-center py-2 px-2 text-xs text-ink-lighter">状态</th>
            </tr>
          </thead>
          <tbody>
            {ry.segments.map((seg, i) => {
              const isCurrent = seg.stem === currentStem;
              return (
                <tr
                  key={i}
                  className={`border-b border-border/50 ${isCurrent ? "bg-vermilion/5" : ""}`}
                >
                  <td className="py-2 px-2">
                    <span className={`ganzhi-text text-base ${getStemColor(seg.stem)}`}>{seg.stem}</span>
                  </td>
                  <td className="text-center py-2 px-2 text-ink">{seg.days}日</td>
                  <td className="py-2 px-2 text-xs text-ink-lighter">{seg.description || "—"}</td>
                  <td className="text-center py-2 px-2">
                    {isCurrent ? (
                      <span className="text-xs text-vermilion font-bold">当令</span>
                    ) : (
                      <span className="text-xs text-ink-lightest">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-ink-lightest">
          人元司令分野：每月地支所藏天干各司用事之日数不同，出生时当令之干为司令之气，影响日主旺衰判断。
        </p>
        <p className="text-xs text-ink-lightest mt-1">
          出处：《三命通会》卷一·论人元司事
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================
// 关系分析
// ============================================================

function RelationsSection({ chart }: { chart: BaziChart }) {
  const hasRelations =
    chart.branchRelations.length > 0 ||
    chart.stemRelations.length > 0 ||
    chart.anHeRelations.length > 0 ||
    chart.gongJiaRelations.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="ink-card p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="seal-tag bg-vermilion text-white">关系分析</span>
        <span className="heading-font text-base text-ink">刑冲合害破 · 暗合 · 拱夹</span>
      </div>

      {!hasRelations && (
        <p className="text-sm text-ink-lightest text-center py-4">四柱无明显刑冲合害关系</p>
      )}

      {/* 地支关系 */}
      {chart.branchRelations.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-ink-lighter mb-2">地支关系</div>
          <div className="flex flex-wrap gap-2">
            {chart.branchRelations.map((rel, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className={`seal-tag ${getRelationColor(rel.type)}`}>
                  {rel.type}
                </span>
                <span className="text-sm text-ink">{rel.description}</span>
                {rel.transform && (
                  <span className="text-xs text-gold-dark">→{rel.transform}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 天干关系 */}
      {chart.stemRelations.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-ink-lighter mb-2">天干关系</div>
          <div className="flex flex-wrap gap-2">
            {chart.stemRelations.map((rel, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className={`seal-tag ${getRelationColor(rel.type)}`}>
                  {rel.type}
                </span>
                <span className="text-sm text-ink">{rel.stems}</span>
                {rel.transform && (
                  <span className="text-xs text-gold-dark">
                    →{rel.transform}
                    {rel.huaQiMet !== undefined && (
                      <span className={rel.huaQiMet ? "text-jade" : "text-vermilion"}>
                        ({rel.huaQiMet ? "化气成立" : "化气未成"})
                      </span>
                    )}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 暗合 */}
      {chart.anHeRelations.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-ink-lighter mb-2">暗合</div>
          <div className="flex flex-wrap gap-2">
            {chart.anHeRelations.map((rel, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className={`seal-tag ${rel.controversial ? "bg-gold text-white" : "bg-jade text-white"}`}>
                  暗合{rel.controversial ? "（争议）" : ""}
                </span>
                <span className="text-sm text-ink">{rel.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 拱夹虚邀 */}
      {chart.gongJiaRelations.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-ink-lighter mb-2">拱夹虚邀</div>
          <div className="flex flex-wrap gap-2">
            {chart.gongJiaRelations.map((rel, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className={`seal-tag ${rel.type === "拱" ? "bg-indigo-deep text-white" : "bg-gold text-white"}`}>
                  {rel.type}
                </span>
                <span className="text-sm text-ink">
                  {rel.branches} → 虚邀{rel.virtualBranch}（{rel.transform}）
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 羊刃三体系 */}
      {chart.prosperity && (
        <YangRenSection chart={chart} />
      )}
    </motion.div>
  );
}

// ============================================================
// 羊刃三体系
// ============================================================

function YangRenSection({ chart }: { chart: BaziChart }) {
  // 羊刃信息从关系分析中获取，但 BaziChart 没有 yangRen 字段
  // 我们从 prosperity 间接判断日主
  const dayStem = chart.dayMaster;
  const yangRenMap: Record<string, { system: string; branch: string }[]> = {
    甲: [
      { system: "禄前一位说", branch: "卯" },
      { system: "五阳干说", branch: "卯" },
      { system: "帝旺位说", branch: "卯" },
    ],
    乙: [
      { system: "禄前一位说", branch: "辰" },
      { system: "帝旺位说", branch: "寅" },
    ],
    丙: [
      { system: "禄前一位说", branch: "午" },
      { system: "五阳干说", branch: "午" },
      { system: "帝旺位说", branch: "午" },
    ],
    丁: [
      { system: "禄前一位说", branch: "未" },
      { system: "帝旺位说", branch: "巳" },
    ],
    戊: [
      { system: "禄前一位说", branch: "午" },
      { system: "五阳干说", branch: "午" },
      { system: "帝旺位说", branch: "午" },
    ],
    己: [
      { system: "禄前一位说", branch: "未" },
      { system: "帝旺位说", branch: "巳" },
    ],
    庚: [
      { system: "禄前一位说", branch: "酉" },
      { system: "五阳干说", branch: "酉" },
      { system: "帝旺位说", branch: "酉" },
    ],
    辛: [
      { system: "禄前一位说", branch: "戌" },
      { system: "帝旺位说", branch: "申" },
    ],
    壬: [
      { system: "禄前一位说", branch: "子" },
      { system: "五阳干说", branch: "子" },
      { system: "帝旺位说", branch: "子" },
    ],
    癸: [
      { system: "禄前一位说", branch: "丑" },
      { system: "帝旺位说", branch: "亥" },
    ],
  };

  const positions = yangRenMap[dayStem] || [];
  if (positions.length === 0) return null;

  const allSame = positions.every(p => p.branch === positions[0].branch);

  return (
    <div>
      <div className="text-xs text-ink-lighter mb-2">
        羊刃三体系（日主：{dayStem}）
        {!allSame && <span className="text-gold-dark ml-1">· 三说不一致</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {positions.map((pos, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-xs text-ink-lightest">{pos.system}</span>
            <span className={`text-sm font-medium ${getBranchColor(pos.branch)}`}>{pos.branch}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 旺衰格局
// ============================================================

function ProsperitySection({ chart }: { chart: BaziChart }) {
  const p = chart.prosperity;
  if (!p) return null;

  const strengthColor =
    p.dayMasterStrength === "旺" ? "text-vermilion" :
    p.dayMasterStrength === "偏旺" ? "text-vermilion-light" :
    p.dayMasterStrength === "中和" ? "text-jade" :
    p.dayMasterStrength === "偏弱" ? "text-blue-600" :
    "text-blue-700";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="ink-card p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="seal-tag bg-jade text-white">旺衰格局</span>
        <span className="heading-font text-base text-ink">日主旺衰 · 格局取用</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {/* 日主旺衰 */}
        <div className="text-center">
          <div className="text-xs text-ink-lightest mb-1">日主旺衰</div>
          <div className={`heading-font text-2xl ${strengthColor}`}>
            {p.dayMasterStrength}
          </div>
        </div>
        {/* 得令 */}
        <div className="text-center">
          <div className="text-xs text-ink-lightest mb-1">得令</div>
          <div className={`text-lg font-bold ${p.deLing ? "text-jade" : "text-ink-lightest"}`}>
            {p.deLing ? "✓" : "✗"}
          </div>
        </div>
        {/* 得地 */}
        <div className="text-center">
          <div className="text-xs text-ink-lightest mb-1">得地</div>
          <div className={`text-lg font-bold ${p.deDi ? "text-jade" : "text-ink-lightest"}`}>
            {p.deDi ? "✓" : "✗"}
          </div>
        </div>
        {/* 得势 */}
        <div className="text-center">
          <div className="text-xs text-ink-lightest mb-1">得势</div>
          <div className={`text-lg font-bold ${p.deShi ? "text-jade" : "text-ink-lightest"}`}>
            {p.deShi ? "✓" : "✗"}
          </div>
        </div>
      </div>

      {/* 格局 */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
        <span className="text-xs text-ink-lighter">格局</span>
        <span className="text-sm font-medium text-ink">{p.pattern}</span>
      </div>

      {/* 用神 */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-ink-lighter">用神</span>
        {p.yongShen ? (
          <>
            <span className={`text-sm font-bold ${ELEMENT_COLORS[p.yongShen]?.text || "text-ink"}`}>
              {p.yongShen}
            </span>
            <span className="text-xs text-ink-lightest">（{p.yongShenMethod}）</span>
          </>
        ) : (
          <span className="text-sm text-ink-lightest">待定</span>
        )}
      </div>

      {/* 五行力量分布 */}
      {p.elementStrengths && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs text-ink-lighter mb-2">五行力量分布</div>
          <div className="space-y-2">
            {p.elementStrengths.map((es) => {
              const colors = ELEMENT_COLORS[es.element];
              return (
                <div key={es.element} className="flex items-center gap-3">
                  <span className={`w-6 text-sm font-medium ${colors?.text || "text-ink"}`}>
                    {es.element}
                  </span>
                  <div className="flex-1 h-5 rounded-full bg-paper-dark overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${colors?.bg || "bg-ink-light"}`}
                      style={{ width: `${Math.max(es.ratio * 100, 2)}%` }}
                    />
                  </div>
                  <span className="text-xs text-ink-lighter w-16 text-right">
                    {es.count.toFixed(1)} · {es.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// 五行统计
// ============================================================

function ElementCountSection({ chart }: { chart: BaziChart }) {
  const counts = chart.elementCount;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const elements: { name: string; count: number; color: string }[] = [
    { name: "木", count: counts["木"] || 0, color: "#10b981" },
    { name: "火", count: counts["火"] || 0, color: "#ef4444" },
    { name: "土", count: counts["土"] || 0, color: "#f59e0b" },
    { name: "金", count: counts["金"] || 0, color: "#64748b" },
    { name: "水", count: counts["水"] || 0, color: "#3b82f6" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65 }}
      className="ink-card p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="seal-tag bg-gold text-white">五行统计</span>
        <span className="heading-font text-base text-ink">五行能量环 · 天干地支五行计数</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* 五行环充能动画 */}
        <div className="flex justify-center">
          <ElementRing chart={chart} size={200} />
        </div>

        {/* 柱状统计 */}
        <div className="flex items-end justify-around gap-4 h-32">
          {elements.map((el) => {
            const height = total > 0 ? (el.count / total) * 100 : 0;
            return (
              <div key={el.name} className="flex flex-col items-center gap-2 flex-1">
                <div className="text-xs text-ink-lighter">{el.count}</div>
                <div className="w-full flex items-end justify-center" style={{ height: "80px" }}>
                  <div
                    className="w-8 rounded-t-md transition-all duration-500"
                    style={{
                      height: `${Math.max(height, 5)}%`,
                      backgroundColor: el.color,
                    }}
                  />
                </div>
                <div className="text-sm font-medium" style={{ color: el.color }}>
                  {el.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center text-xs text-ink-lightest mt-2">
        共计 {total} 个五行要素（天干4 + 地支藏干）
      </div>
    </motion.div>
  );
}

// ============================================================
// 保存命盘
// ============================================================

function SaveSection({
  saved,
  showSaveInput,
  saveName,
  setSaveName,
  setShowSaveInput,
  onSave,
}: {
  saved: boolean;
  showSaveInput: boolean;
  saveName: string;
  setSaveName: (v: string) => void;
  setShowSaveInput: (v: boolean) => void;
  onSave: () => void;
}) {
  if (saved) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="ink-card p-4 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="seal-tag bg-jade text-white">已保存</span>
          <span className="text-sm text-ink">命盘已保存到本地</span>
        </div>
        <Link href="/saved" className="ink-link text-sm">
          查看我的命盘 →
        </Link>
      </motion.div>
    );
  }

  if (showSaveInput) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="ink-card p-4"
      >
        <div className="flex items-center gap-3">
          <input
            type="text"
            className="ink-input flex-1"
            placeholder="输入命盘名称（如：张三的命盘）"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave();
              if (e.key === "Escape") setShowSaveInput(false);
            }}
            autoFocus
          />
          <button
            onClick={onSave}
            className="vermilion-btn px-4 py-2 text-sm"
            disabled={!saveName.trim()}
          >
            确认保存
          </button>
          <button
            onClick={() => setShowSaveInput(false)}
            className="px-4 py-2 text-sm text-ink-light hover:text-ink border border-border rounded-lg"
          >
            取消
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="flex justify-center gap-3"
    >
      <button
        onClick={() => setShowSaveInput(true)}
        className="vermilion-btn px-6 py-2.5 text-sm"
      >
        保存命盘
      </button>
      <Link
        href="/"
        className="px-6 py-2.5 text-sm border border-border rounded-lg text-ink-light hover:bg-paper-dark hover:text-ink transition-colors"
      >
        重新排盘
      </Link>
    </motion.div>
  );
}

// ============================================================
// 页面导出（带 Suspense）
// ============================================================

export default function ChartPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="heading-font text-2xl text-ink mb-2">排演中…</div>
          <p className="text-sm text-ink-lightest">正在计算四柱八字</p>
        </div>
      }
    >
      <ChartContent />
    </Suspense>
  );
}
