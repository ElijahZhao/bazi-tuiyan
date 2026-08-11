/**
 * 免责声明组件
 *
 * 提供两种模式：
 * - brief: 精简单行，用于页脚、表单下方等
 * - full:  详细声明卡片，用于命盘结果页、关于页等
 */

type DisclaimerProps = {
  variant?: "brief" | "full";
  className?: string;
};

/** 详细条款 */
const FULL_CLAUSES = [
  {
    title: "文化研究性质",
    text: "本站排盘与解读内容基于中国传统命理学古籍（如《三命通会》《渊海子平》等）所载算法，属于传统文化学术研究领域，不代表现代科学验证结论。",
  },
  {
    title: "不构成决策建议",
    text: "排盘结果及 AI 润色解读仅供文化参考与学术交流，不构成任何形式的医疗、法律、财务、婚恋、就业等决策建议。用户据此采取的任何行为均由本人自行承担后果。",
  },
  {
    title: "AI 解读局限性",
    text: "「古法断语 · AI 润色」模块由人工智能模型基于命理学知识库生成，可能存在偏差、不准确或不完整之处。AI 生成内容不得作为专业命理咨询的替代。",
  },
  {
    title: "排盘精度说明",
    text: "排盘引擎天文数据以中国科学院紫金山天文台为校准基准，算法严格遵循古籍原典。但不同流派在某些规则（如夜子时、羊刃取法等）上存在争议，本站采用的主流口径不代表唯一正确答案。",
  },
  {
    title: "隐私与数据",
    text: "排盘引擎全部纯客户端计算，出生信息不上传服务器，AI 对话仅发送命盘干支数据用于生成解读。用户可随时清除本地存储的命盘数据。",
  },
];

export function Disclaimer({ variant = "brief", className = "" }: DisclaimerProps) {
  if (variant === "brief") {
    return (
      <p className={`text-xs text-ink-lightest leading-relaxed ${className}`}>
        本站内容基于传统命理学古籍算法，仅供文化研究与学术参考，不构成任何决策建议。请理性看待，勿用于迷信活动。
      </p>
    );
  }

  return (
    <div className={`ink-card p-6 ${className}`}>
      {/* 标题 */}
      <div className="mb-4 flex items-center gap-2">
        <svg
          className="h-5 w-5 text-vermilion"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <circle cx="12" cy="16" r="0.5" fill="currentColor" />
        </svg>
        <span className="seal-tag bg-vermilion text-white">免责声明</span>
        <span className="heading-font text-sm text-ink">请阅读以下条款</span>
      </div>

      {/* 条款列表 */}
      <div className="space-y-3">
        {FULL_CLAUSES.map((clause, i) => (
          <div key={i} className="flex gap-3">
            <span className="heading-font mt-0.5 shrink-0 text-xs text-vermilion">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="text-sm font-medium text-ink">{clause.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-lighter">
                {clause.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 底部强调 */}
      <div className="mt-4 border-t border-border pt-3">
        <p className="text-xs text-ink-lightest">
          使用本站即表示您已阅读、理解并同意以上全部条款。如有疑问请勿继续使用。
        </p>
      </div>
    </div>
  );
}
