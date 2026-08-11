"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Clock,
  Compass,
  Eye,
  Inbox,
  MapPin,
  Pencil,
  Plus,
  ScrollText,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteChart,
  getSavedCharts,
  renameChart,
  type SavedChart,
} from "@/lib/storage";

/** 根据已保存命盘构造排盘页 URL（与首页保持一致的参数） */
function buildChartUrl(chart: SavedChart): string {
  const params = new URLSearchParams({
    y: String(chart.input.year),
    m: String(chart.input.month),
    d: String(chart.input.day),
    h: String(chart.input.hour),
    min: String(chart.input.minute),
    g: chart.input.gender,
    lon: String(chart.input.longitude),
    tz: String(chart.input.timezone ?? 8),
    city: chart.input.birthPlace || "",
    nz: chart.input.enableNightZi ? "1" : "0",
  });
  return `/chart?${params.toString()}`;
}

/** 格式化存盘时间 */
function formatSavedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** 格式化出生时间 */
function formatBirth(chart: SavedChart): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${chart.input.year}年${chart.input.month}月${chart.input.day}日 ${pad(
    chart.input.hour
  )}:${pad(chart.input.minute)}`;
}

export default function SavedChartsPage() {
  const router = useRouter();

  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [loaded, setLoaded] = useState(false);

  // 内联重命名
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  // 删除二次确认
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // 客户端挂载后读取 localStorage（SSR 阶段不可用，须在 effect 中同步至 state）
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage 仅在客户端可用，
       首次挂载读取并同步至 state 是必要的 SSR 安全模式（避免水合不匹配） */
    setCharts(getSavedCharts());
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // 进入重命名模式后聚焦并选中已有名称
  useEffect(() => {
    if (editingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingId]);

  const refresh = () => setCharts(getSavedCharts());

  const handleStartRename = (chart: SavedChart) => {
    setEditingId(chart.id);
    setDraftName(chart.name);
    setConfirmingId(null);
  };

  const handleCommitRename = (id: string) => {
    const trimmed = draftName.trim();
    if (!trimmed) return;
    renameChart(id, trimmed);
    setEditingId(null);
    setDraftName("");
    refresh();
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setDraftName("");
  };

  const handleDelete = (id: string) => {
    deleteChart(id);
    setConfirmingId(null);
    refresh();
  };

  const handleView = (chart: SavedChart) => {
    router.push(buildChartUrl(chart));
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* 标题区 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mb-8 text-center"
      >
        <div className="mb-3 flex justify-center">
          <span className="seal-tag bg-vermilion text-white">墨韵存盘</span>
        </div>
        <h1 className="heading-font text-4xl text-ink mb-2">我的命盘</h1>
        <p className="text-sm text-ink-lighter">
          所有命盘仅存于本机浏览器，私密不外传 · 可随时查阅与管理
        </p>
      </motion.div>

      {/* 加载中（避免 SSR 闪烁空状态） */}
      {!loaded && (
        <div className="ink-card flex items-center justify-center px-6 py-16 text-sm text-ink-lightest">
          正在翻阅命簿……
        </div>
      )}

      {/* 空状态 */}
      {loaded && charts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="ink-card flex flex-col items-center gap-4 px-6 py-16 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-paper-dark text-ink-lightest">
            <Inbox size={32} strokeWidth={1.5} />
          </div>
          <div>
            <p className="heading-font text-lg text-ink mb-1">尚未存盘</p>
            <p className="text-sm text-ink-lighter">
              排盘之后点击「存盘」即可在此处查阅全部命盘
            </p>
          </div>
          <Link
            href="/"
            className="vermilion-btn mt-1 inline-flex items-center gap-1.5 px-5 py-2.5 text-sm"
          >
            <Plus size={16} />
            开始排盘
          </Link>
        </motion.div>
      )}

      {/* 命盘列表 */}
      {loaded && charts.length > 0 && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs text-ink-lightest">
              共 {charts.length} 盘
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-ink-lighter transition-colors hover:text-vermilion"
            >
              <Plus size={13} />
              新建命盘
            </Link>
          </div>

          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {charts.map((chart, index) => {
                const isEditing = editingId === chart.id;
                const isConfirming = confirmingId === chart.id;

                return (
                  <motion.article
                    key={chart.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.4,
                        delay: index * 0.05,
                        ease: "easeOut",
                      },
                    }}
                    exit={{
                      opacity: 0,
                      y: -8,
                      transition: { duration: 0.2, ease: "easeIn" },
                    }}
                    className="ink-card p-5"
                  >
                    {/* 顶部：名称 + 存盘时间 */}
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleCommitRename(chart.id);
                            }}
                            className="flex items-center gap-2"
                          >
                            <input
                              ref={renameInputRef}
                              value={draftName}
                              onChange={(e) => setDraftName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") handleCancelRename();
                              }}
                              maxLength={30}
                              placeholder="命盘名称"
                              className="ink-input heading-font w-full max-w-xs text-lg"
                            />
                            <button
                              type="submit"
                              disabled={!draftName.trim()}
                              aria-label="确认重命名"
                              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-vermilion px-2.5 py-2 text-white transition-colors hover:bg-vermilion-light disabled:cursor-not-allowed disabled:bg-ink-lightest"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelRename}
                              aria-label="取消重命名"
                              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-card px-2.5 py-2 text-ink-light transition-colors hover:bg-paper-dark hover:text-ink"
                            >
                              <X size={16} />
                            </button>
                          </form>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h2 className="heading-font truncate text-xl text-ink">
                              {chart.name}
                            </h2>
                            <span
                              className={`seal-tag shrink-0 text-white ${
                                chart.input.gender === "男"
                                  ? "bg-jade"
                                  : "bg-vermilion"
                              }`}
                            >
                              {chart.input.gender}
                            </span>
                            {chart.input.enableNightZi && (
                              <span className="seal-tag shrink-0 bg-indigo-deep text-white">
                                夜子时
                              </span>
                            )}
                          </div>
                        )}
                        <p className="mt-1 text-xs text-ink-lightest">
                          存盘于 {formatSavedAt(chart.savedAt)}
                        </p>
                      </div>
                      <ScrollText
                        className="mt-0.5 shrink-0 text-ink-lightest"
                        size={20}
                        strokeWidth={1.5}
                      />
                    </div>

                    <div className="ink-divider mb-4" />

                    {/* 出生信息 */}
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock
                          className="shrink-0 text-ink-lighter"
                          size={15}
                          strokeWidth={1.75}
                        />
                        <span className="text-ink-light">
                          {formatBirth(chart)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin
                          className="shrink-0 text-ink-lighter"
                          size={15}
                          strokeWidth={1.75}
                        />
                        <span className="truncate text-ink-light">
                          {chart.input.birthPlace || "未指定出生地"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Compass
                          className="shrink-0 text-ink-lighter"
                          size={15}
                          strokeWidth={1.75}
                        />
                        <span className="text-ink-light">
                          经度 {chart.input.longitude}°
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Eye
                          className="shrink-0 text-ink-lighter"
                          size={15}
                          strokeWidth={1.75}
                        />
                        <span className="text-ink-light">
                          {chart.input.enableNightZi
                            ? "夜子时/子正区分已启用"
                            : "夜子时未启用"}
                        </span>
                      </div>
                    </div>

                    {/* 操作区 */}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleView(chart)}
                          className="vermilion-btn inline-flex items-center gap-1.5 px-4 py-2 text-sm"
                        >
                          <Eye size={15} />
                          查看
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartRename(chart)}
                          disabled={isEditing}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-ink-light transition-colors hover:bg-paper-dark hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Pencil size={15} />
                          重命名
                        </button>
                      </div>

                      {isConfirming ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-ink-lighter">
                            确认删除此盘？
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDelete(chart.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-vermilion px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-vermilion-light"
                          >
                            <Trash2 size={13} />
                            确认删除
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            className="inline-flex items-center rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-ink-light transition-colors hover:bg-paper-dark"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingId(chart.id)}
                          disabled={isEditing}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-ink-light transition-colors hover:border-vermilion hover:bg-vermilion hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                          删除
                        </button>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
