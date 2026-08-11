"use client";

/**
 * 解读区组件
 *
 * Tab 切换「古法断语」/「AI 润色解读」
 * Tab 1：纯前端知识库，零臆造，每条标注出处
 * Tab 2：LLM 润色解读，需用户主动点击调用
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { BaziChart } from "@/lib/engine/types";
import { generateInterpretation, type InterpretationSection } from "@/lib/interpretation/knowledge-base";

interface InterpretationPanelProps {
  chart: BaziChart;
}

export default function InterpretationPanel({ chart }: InterpretationPanelProps) {
  const [activeTab, setActiveTab] = useState<"ancient" | "ai">("ancient");
  const [expanded, setExpanded] = useState(false);

  // 生成古法断语
  const sections = generateInterpretation(chart);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="ink-card p-6"
    >
      {/* 标题 + 展开折叠 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="seal-tag bg-indigo-deep text-white">解读</span>
          <span className="heading-font text-base text-ink">命局解读</span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-ink-lighter transition-colors hover:text-vermilion"
        >
          {expanded ? (
            <>
              收起 <ChevronUp size={14} />
            </>
          ) : (
            <>
              展开解读 <ChevronDown size={14} />
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {/* Tab 切换 */}
            <div className="flex gap-2 mb-5">
              <button
                type="button"
                onClick={() => setActiveTab("ancient")}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "ancient"
                    ? "bg-vermilion text-white"
                    : "border border-border bg-card text-ink-light hover:bg-paper-dark"
                }`}
              >
                <BookOpen size={15} />
                古法断语
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ai")}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "ai"
                    ? "bg-indigo-deep text-white"
                    : "border border-border bg-card text-ink-light hover:bg-paper-dark"
                }`}
              >
                <Sparkles size={15} />
                AI 润色解读
              </button>
            </div>

            {/* Tab 内容 */}
            <AnimatePresence mode="wait">
              {activeTab === "ancient" ? (
                <motion.div
                  key="ancient"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AncientTab sections={sections} />
                </motion.div>
              ) : (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AiTab chart={chart} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// Tab 1：古法断语
// ============================================================

function AncientTab({ sections }: { sections: InterpretationSection[] }) {
  return (
    <div className="space-y-6">
      {sections.map((section, sIdx) => (
        <div key={sIdx}>
          {/* 板块标题 */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`seal-tag ${section.tagColor} text-white`}>
              {section.name}
            </span>
            <div className="flex-1 ink-divider" />
          </div>

          {/* 断语条目 */}
          <div className="space-y-3">
            {section.entries.map((entry, eIdx) => (
              <div
                key={eIdx}
                className="rounded-lg border border-border bg-paper/30 p-4 transition-colors hover:bg-paper/50"
              >
                {/* 条目标题 */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="heading-font text-sm text-ink">{entry.title}</h4>
                </div>

                {/* 条目内容 */}
                <p className="text-sm leading-relaxed text-ink-light whitespace-pre-line">
                  {entry.content}
                </p>

                {/* 出处 */}
                <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-lightest">
                  <span className="inline-block w-1 h-1 rounded-full bg-gold" />
                  <span>{entry.source}</span>
                  <span>·</span>
                  <span>{entry.sourceChapter}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 声明 */}
      <div className="rounded-lg bg-vermilion/5 p-3 text-center">
        <p className="text-xs text-ink-lighter">
          以上断语全部出自古籍原典，零臆造。每条标注出处，可溯源核查。
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Tab 2：AI 润色解读
// ============================================================

function AiTab({ chart }: { chart: BaziChart }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult("");

    try {
      // 提取命局特征
      const features = {
        dayMaster: chart.dayMaster,
        dayMasterElement: chart.dayMasterElement,
        strength: chart.prosperity?.dayMasterStrength,
        pattern: chart.prosperity?.pattern,
        yongShen: chart.prosperity?.yongShen,
        fourPillars: {
          year: chart.fourPillars.year.ganzhi,
          month: chart.fourPillars.month.ganzhi,
          day: chart.fourPillars.day.ganzhi,
          hour: chart.fourPillars.hour.ganzhi,
        },
        branchRelations: chart.branchRelations,
        stemRelations: chart.stemRelations,
        shenSha: chart.shenSha,
      };

      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features }),
      });

      if (!response.ok) {
        throw new Error(`API 返回 ${response.status}`);
      }

      // 流式读取
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          setResult((prev) => prev + text);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "解读生成失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 说明 */}
      <div className="rounded-lg bg-indigo-deep/5 p-4">
        <p className="text-sm text-ink-lighter leading-relaxed">
          AI 润色解读基于古法规则库提取命局特征，交由大语言模型组织语言。
          <strong className="text-ink"> 仅润色语言，不引入规则库以外的新断语。</strong>
          风格沉稳文言白话相间。
        </p>
      </div>

      {/* 生成按钮 */}
      {!result && !loading && (
        <button
          type="button"
          onClick={handleGenerate}
          className="vermilion-btn w-full py-3 text-sm flex items-center justify-center gap-2"
        >
          <Sparkles size={16} />
          生成 AI 润色解读
        </button>
      )}

      {/* 加载中 */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink-lighter">
          <Loader2 size={16} className="animate-spin" />
          正在生成解读…
        </div>
      )}

      {/* 错误 */}
      {error && (
        <div className="rounded-lg bg-vermilion/10 p-4 text-sm text-vermilion">
          {error}
        </div>
      )}

      {/* 结果 */}
      {result && (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-paper/30 p-4">
            <p className="text-sm leading-relaxed text-ink whitespace-pre-line">
              {result}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-lightest">
            <span className="inline-block w-1 h-1 rounded-full bg-indigo-deep" />
            <span>本解读由 AI 基于古法规则库润色生成，仅供参考</span>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            className="text-xs text-ink-lighter transition-colors hover:text-vermilion"
          >
            重新生成 →
          </button>
        </div>
      )}
    </div>
  );
}
