"use client";

/**
 * 解读区组件
 *
 * Tab 切换「古法断语」/「AI 润色解读」
 * Tab 1：纯前端知识库，零臆造，每条标注出处
 * Tab 2：LLM 润色解读，对话式 UI，支持追问
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles, Loader2, ChevronDown, ChevronUp, Send } from "lucide-react";
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
                  <AiTab key={chart.id} chart={chart} />
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
// Tab 2：AI 润色解读（对话式，支持追问）
// ============================================================

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ============================================================
// 工具函数：清洗 AI 响应文本
// ============================================================

/** 移除 ***（内容审核占位符）及 Markdown 格式标记 */
function cleanAIText(text: string): string {
  return text
    .replace(/\*{2,}/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`{1,3}/g, "")
    .trim();
}

/** 根据命盘唯一 ID 生成对话存储 key，确保不同命盘对话完全隔离 */
function getChatStorageKey(chart: BaziChart): string {
  return `bazi-ai-chat-${chart.id}`;
}

function AiTab({ chart }: { chart: BaziChart }) {
  const storageKey = getChatStorageKey(chart);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 自动滚动对话容器到底部（仅影响内部容器，不滚动浏览器页面）
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, streamingText]);

  // 挂载时从 localStorage 恢复对话
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // 忽略解析错误
    }
    setHasLoaded(true);
  }, [storageKey]);

  // 对话变化时保存到 localStorage
  useEffect(() => {
    if (!hasLoaded) return;
    try {
      if (messages.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {
      // 忽略存储错误
    }
  }, [messages, storageKey, hasLoaded]);

  // 提取完整命局特征（包含命盘所有信息）
  const getFeatures = () => {
    const fp = chart.fourPillars;

    // 大运流年
    const daYunList = chart.daYun.steps.map((s) => `${s.startAge}岁(${s.startYear}年): ${s.pillar.ganzhi}`).join("、");
    const liuNianList = chart.liuNian.slice(0, 10).map((l) => `${l.year}年: ${l.pillar.ganzhi}`).join("、");
    const xiaoYunList = chart.xiaoYun.slice(0, 10).map((x) => `${x.age}岁: ${x.pillar.ganzhi}`).join("、");

    // 四柱详情
    const pillarDetail = (p: typeof fp.year) => {
      const hidden = p.hiddenStems.map((h) => `${h.stem}(${h.type})`).join("、");
      return `${p.ganzhi}（纳音:${p.nayin}，十神:${p.tenGod}，藏干:${hidden}，十二长生:${p.changSheng || "未定"}，旺衰:${p.wangShuai || "未定"}）`;
    };

    // 五行计数
    const elementCountStr = Object.entries(chart.elementCount).map(([el, cnt]) => `${el}:${cnt}`).join("、");

    // 流月流日流时
    const liuYueList = chart.liuYue.map((m) => `${m.monthBranch}月:${m.pillar.ganzhi}`).join("、");
    const liuRiStr = `${chart.liuRi.date}: ${chart.liuRi.pillar.ganzhi}`;
    const liuShiList = chart.liuShi.map((s) => `${s.hourBranch}时:${s.pillar.ganzhi}`).join("、");

    return {
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
      pillarDetails: {
        year: pillarDetail(fp.year),
        month: pillarDetail(fp.month),
        day: pillarDetail(fp.day),
        hour: pillarDetail(fp.hour),
      },
      branchRelations: chart.branchRelations,
      stemRelations: chart.stemRelations,
      shenSha: chart.shenSha,
      // 新增：大运流年
      daYun: {
        direction: chart.daYun.direction,
        startAge: chart.daYun.startAge,
        steps: daYunList,
      },
      liuNian: liuNianList,
      xiaoYun: xiaoYunList,
      // 新增：辅助宫位
      auxiliary: {
        taiYuan: chart.taiYuan.ganzhi,
        mingGong: chart.mingGong.ganzhi,
        shenGong: chart.shenGong.ganzhi,
      },
      // 新增：十神
      tenGods: {
        year: chart.tenGods.year,
        month: chart.tenGods.month,
        hour: chart.tenGods.hour,
      },
      // 新增：纳音
      nayin: chart.nayin,
      // 新增：十二长生
      lifeStages: chart.lifeStages,
      // 新增：空亡
      kongWang: {
        day: chart.kongWang.day.join("、"),
        year: chart.kongWang.year.join("、"),
      },
      // 新增：暗合关系
      anHeRelations: chart.anHeRelations.map((r) => `${r.branches}: ${r.description}`).join("、"),
      // 新增：拱夹虚邀
      gongJiaRelations: chart.gongJiaRelations.map((r) => `${r.type} ${r.branches}→虚${r.virtualBranch}(${r.transform})`).join("、"),
      // 新增：五行计数
      elementCount: elementCountStr,
      // 新增：人元司令分野
      renYuanSiLing: chart.renYuanSiLing.currentSegment
        ? `当月司令:${chart.renYuanSiLing.currentSegment.stem}（${chart.renYuanSiLing.currentSegment.description}）`
        : "未定",
      // 新增：流月流日流时
      liuYue: liuYueList,
      liuRi: liuRiStr,
      liuShi: liuShiList,
    };
  };

  // 流式读取（含文本清洗）
  const readStream = async (response: Response): Promise<string> => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let full = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        full += text;
        setStreamingText(cleanAIText(full));
      }
    }

    return cleanAIText(full);
  };

  // 生成初始解读
  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setStreamingText("");
    setMessages([]);

    try {
      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: getFeatures() }),
      });

      if (!response.ok) {
        throw new Error(`API 返回 ${response.status}`);
      }

      const full = await readStream(response);
      setMessages([{ role: "assistant", content: full }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "解读生成失败，请稍后重试");
    } finally {
      setLoading(false);
      setStreamingText("");
    }
  };

  // 追问
  const handleAsk = async () => {
    const q = question.trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = { role: "user", content: q };
    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    setQuestion("");
    setLoading(true);
    setError("");
    setStreamingText("");

    try {
      const response = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          question: q,
          features: getFeatures(),
        }),
      });

      if (!response.ok) {
        throw new Error(`API 返回 ${response.status}`);
      }

      const full = await readStream(response);
      setMessages([...newMessages, { role: "assistant", content: full }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "追问失败，请稍后重试");
    } finally {
      setLoading(false);
      setStreamingText("");
    }
  };

  // 键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="space-y-4">
      {/* 说明 */}
      <div className="rounded-lg bg-indigo-deep/5 p-4">
        <p className="text-sm text-ink-lighter leading-relaxed">
          AI 润色解读基于古法规则库提取命局特征，交由大语言模型组织语言。
          <strong className="text-ink"> 仅润色语言，不引入规则库以外的新断语。</strong>
          风格沉稳文言白话相间。生成后可追问。
        </p>
      </div>

      {/* 初始生成按钮 */}
      {messages.length === 0 && !loading && (
        <button
          type="button"
          onClick={handleGenerate}
          className="vermilion-btn w-full py-3 text-sm flex items-center justify-center gap-2"
        >
          <Sparkles size={16} />
          生成 AI 润色解读
        </button>
      )}

      {/* 对话区 */}
      {(messages.length > 0 || loading) && (
        <div className="space-y-3">
          {/* 消息列表 */}
          <div ref={chatContainerRef} className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {messages.map((msg, i) => (
              <ChatBubble key={i} message={msg} />
            ))}

            {/* 流式输出中 */}
            {loading && streamingText && (
              <ChatBubble
                message={{ role: "assistant", content: streamingText }}
                streaming
              />
            )}

            {/* 加载指示器（尚无内容时） */}
            {loading && !streamingText && (
              <div className="flex items-center gap-2 py-3 text-sm text-ink-lighter">
                <Loader2 size={16} className="animate-spin" />
                正在思考…
              </div>
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="rounded-lg bg-vermilion/10 p-3 text-sm text-vermilion">
              {error}
            </div>
          )}

          {/* 追问输入框 */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="追问命局细节…（如：这个格局对事业有什么影响？）"
              disabled={loading}
              className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-lightest outline-none px-2"
            />
            <button
              type="button"
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-deep text-white transition-colors hover:bg-indigo-deep/90 disabled:bg-ink-lightest disabled:cursor-not-allowed"
            >
              <Send size={15} />
            </button>
          </div>

          {/* 底部操作 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-ink-lightest">
              <span className="inline-block w-1 h-1 rounded-full bg-jade" />
              <span>对话已自动保存 · 刷新不丢失</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setError("");
                  try {
                    localStorage.removeItem(storageKey);
                  } catch {
                    // ignore
                  }
                }}
                disabled={loading}
                className="text-xs text-ink-lighter transition-colors hover:text-vermilion disabled:opacity-50"
              >
                清除记录
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="text-xs text-ink-lighter transition-colors hover:text-vermilion disabled:opacity-50"
              >
                重新生成 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 对话气泡
// ============================================================

function ChatBubble({
  message,
  streaming = false,
}: {
  message: ChatMessage;
  streaming?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-indigo-deep text-white rounded-tr-sm"
            : "bg-paper/60 text-ink rounded-tl-sm border border-border"
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={12} className="text-indigo-deep" />
            <span className="text-xs font-medium text-indigo-deep">AI 解读</span>
          </div>
        )}
        <p className={`text-sm leading-relaxed whitespace-pre-line ${isUser ? "text-white" : "text-ink"}`}>
          {message.content}
          {streaming && <span className="inline-block w-0.5 h-4 ml-0.5 bg-current animate-pulse align-middle" />}
        </p>
      </div>
    </motion.div>
  );
}
