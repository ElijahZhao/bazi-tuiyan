/**
 * AI 润色解读 API Route
 *
 * 功能：
 * - 初始解读：基于命局特征生成 AI 解读
 * - 追问对话：支持多轮对话，用户可追问
 *
 * 安全要点：
 * - API key 只存后端环境变量，绝不下发前端
 * - 输入过滤与 prompt 注入防护
 * - 流式输出，后端解析 SSE 后转发纯文本
 */

import { NextRequest } from "next/server";

// ============================================================
// 类型
// ============================================================

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface InterpretRequest {
  features?: {
    dayMaster: string;
    dayMasterElement: string;
    strength?: string;
    pattern?: string;
    yongShen?: string | null;
    fourPillars: {
      year: string;
      month: string;
      day: string;
      hour: string;
    };
    pillarDetails?: {
      year: string;
      month: string;
      day: string;
      hour: string;
    };
    branchRelations: unknown[];
    stemRelations: unknown[];
    shenSha: Record<string, string[]>;
    // 新增字段
    daYun?: {
      direction: string;
      startAge: number;
      steps: string;
    };
    liuNian?: string;
    xiaoYun?: string;
    auxiliary?: {
      taiYuan: string;
      mingGong: string;
      shenGong: string;
    };
    tenGods?: {
      year: string;
      month: string;
      hour: string;
    };
    nayin?: {
      year: string;
      month: string;
      day: string;
      hour: string;
    };
    lifeStages?: {
      year: string;
      month: string;
      day: string;
      hour: string;
    };
    kongWang?: {
      day: string;
      year: string;
    };
    anHeRelations?: string;
    gongJiaRelations?: string;
    elementCount?: string;
    renYuanSiLing?: string;
    liuYue?: string;
    liuRi?: string;
    liuShi?: string;
  };
  // 追问模式：传入完整对话历史
  messages?: ChatMessage[];
  // 用户的追问内容
  question?: string;
}

// ============================================================
// 构建初始提示词
// ============================================================

function buildInitialPrompt(features: NonNullable<InterpretRequest["features"]>): string {
  const fp = features.fourPillars;
  const shenShaList = Object.entries(features.shenSha)
    .map(([pillar, list]) => `${pillar}: ${list.join("、")}`)
    .join("\n");

  const branchRels = features.branchRelations as { type: string; branches: string; description: string }[];
  const stemRels = features.stemRelations as { type: string; stems: string; transform?: string }[];

  const pd = features.pillarDetails;
  const tg = features.tenGods;
  const ny = features.nayin;
  const ls = features.lifeStages;
  const kw = features.kongWang;
  const aux = features.auxiliary;
  const dy = features.daYun;

  return `你是一位传统文化研究者，请依据以下古法规则库提取的命局特征，撰写一段学术性的命理学分析。

【硬约束】
1. 仅依据以下命局特征输出，禁止编造、禁止引用规则库外的命理结论
2. 以学术研究的视角分析命理格局，使用"命理学""格局分析""传统文化研究"等学术用语
3. 不得给出具体的吉凶预测（如"某年会发财""某年有灾"等）
4. 只做命理格局的分析和解读，不做命运预测
5. 篇幅控制在 500 字以内
6. 输出纯文本，禁止使用任何星号（*）、Markdown 格式标记（如**加粗**、#标题等）
7. 如遇敏感词，请用同义的学术用语替换，不要输出星号或占位符
8. 以下数据即为该命盘的全部已知信息，用户追问时以此为准，不得声称"不知道"或"需要更多信息"

【命局基本特征】
日主：${features.dayMaster}（${features.dayMasterElement}行）
四柱：${fp.year}年 ${fp.month}月 ${fp.day}日 ${fp.hour}时
旺衰：${features.strength || "待定"}
格局：${features.pattern || "待定"}
用神：${features.yongShen || "待定"}

【四柱详情】
年柱：${pd?.year || fp.year}
月柱：${pd?.month || fp.month}
日柱：${pd?.day || fp.day}
时柱：${pd?.hour || fp.hour}

【十神分布】
年柱十神：${tg?.year || "未定"}　月柱十神：${tg?.month || "未定"}　时柱十神：${tg?.hour || "未定"}

【纳音】
年：${ny?.year || "未定"}　月：${ny?.month || "未定"}　日：${ny?.day || "未定"}　时：${ny?.hour || "未定"}

【十二长生】
年：${ls?.year || "未定"}　月：${ls?.month || "未定"}　日：${ls?.day || "未定"}　时：${ls?.hour || "未定"}

【五行计数】
${features.elementCount || "未定"}

【地支关系】
${branchRels.length > 0 ? branchRels.map((r) => `${r.type}: ${r.branches} - ${r.description}`).join("\n") : "无明显刑冲合害"}

【天干关系】
${stemRels.length > 0 ? stemRels.map((r) => `${r.type}: ${r.stems}${r.transform ? ` → ${r.transform}` : ""}`).join("\n") : "无明显天干合冲"}

【暗合关系】
${features.anHeRelations || "无"}

【拱夹虚邀】
${features.gongJiaRelations || "无"}

【神煞】
${shenShaList || "无"}

【空亡】
日空：${kw?.day || "未定"}　年空：${kw?.year || "未定"}

【辅助宫位】
胎元：${aux?.taiYuan || "未定"}　命宫：${aux?.mingGong || "未定"}　身宫：${aux?.shenGong || "未定"}

【人元司令分野】
${features.renYuanSiLing || "未定"}

【大运】
排法：${dy?.direction || "未定"}行，起运岁数：${dy?.startAge || "未定"}岁
大运序列：${dy?.steps || "未定"}

【流年（近十年）】
${features.liuNian || "未定"}

【小运（近十年）】
${features.xiaoYun || "未定"}

【流月】
${features.liuYue || "未定"}

【流日】
${features.liuRi || "未定"}

【流时】
${features.liuShi || "未定"}

请基于以上全部命局特征，撰写命理学分析。`;
}

// ============================================================
// SSE 流解析器：从 LLM 的 SSE 响应中提取纯文本
// ============================================================

async function parseSSEStream(
  llmResponse: Response,
  onText: (text: string) => void,
): Promise<void> {
  const reader = llmResponse.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // 按行处理 SSE
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;

      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta;
        if (!delta) continue;

        // 优先取 content，其次取 reasoning_content
        const text = delta.content || "";
        if (text) onText(text);
      } catch {
        // JSON 解析失败，跳过
      }
    }
  }
}

// ============================================================
// POST 处理
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InterpretRequest;

    // 检查 API key
    const apiKey = process.env.ARK_API_KEY || process.env.LLM_API_KEY;

    // ---------- 无 API key 降级 ----------
    if (!apiKey) {
      if (!body.features) {
        return new Response(JSON.stringify({ error: "缺少必要参数" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const fallbackText = `命主日主为${body.features!.dayMaster}${body.features!.dayMasterElement}，四柱${body.features!.fourPillars.year}年${body.features!.fourPillars.month}月${body.features!.fourPillars.day}日${body.features!.fourPillars.hour}时。\n\n旺衰：${body.features!.strength}，格局：${body.features!.pattern}，用神：${body.features!.yongShen || "待定"}。\n\n大运（${body.features!.daYun?.direction || "未定"}行，起运${body.features!.daYun?.startAge || "未定"}岁）：${body.features!.daYun?.steps || "未定"}\n\n流年：${body.features!.liuNian || "未定"}\n\n辅助宫位：胎元${body.features!.auxiliary?.taiYuan || "未定"}，命宫${body.features!.auxiliary?.mingGong || "未定"}，身宫${body.features!.auxiliary?.shenGong || "未定"}\n\n五行计数：${body.features!.elementCount || "未定"}\n\n注：AI 解读服务未配置 API Key，此为规则库特征摘要。请配置 LLM API Key 后获取完整 AI 润色解读。`;
          controller.enqueue(encoder.encode(fallbackText));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // ---------- 构建消息列表 ----------
    let messages: { role: string; content: string }[];
    const systemPrompt = "你是一位传统文化研究者，严格依据古法规则库进行命理学学术分析，不做命运预测，不编造规则库外的结论。回答风格沉稳，文言白话相间。输出纯文本，禁止使用任何星号（*）或 Markdown 格式标记。如遇敏感词，请用同义的学术用语替换，不要输出星号或占位符。用户追问时，必须基于已提供的命局特征回答，不得声称不知道或要求用户提供更多信息——所有命盘数据已在你手中。不得自行思考或引入规则库以外的新断语。";

    if (body.question && body.messages && body.messages.length > 0) {
      // 追问模式：注入命局特征 + 完整对话历史
      const featuresContext = body.features
        ? buildInitialPrompt(body.features)
        : "";

      messages = [
        { role: "system", content: systemPrompt },
        // 将命盘完整特征作为系统上下文注入
        ...(featuresContext ? [{ role: "system", content: `以下是该命盘的完整已知信息，追问时以此为准：\n\n${featuresContext}` }] : []),
        ...body.messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: body.question },
      ];
    } else if (body.features) {
      // 初始解读模式
      const prompt = buildInitialPrompt(body.features);
      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ];
    } else {
      return new Response(JSON.stringify({ error: "缺少必要参数" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ---------- 调用 LLM ----------
    const llmResponse = await fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.ARK_MODEL_ID || "deepseek-v4-flash-ga-260731",
        messages,
        stream: true,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!llmResponse.ok) {
      throw new Error(`LLM API 返回 ${llmResponse.status}`);
    }

    // ---------- 解析 SSE 流，转发纯文本 ----------
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await parseSSEStream(llmResponse, (text) => {
            controller.enqueue(encoder.encode(text));
          });
        } catch {
          controller.enqueue(encoder.encode("\n\n[流式传输中断]"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "内部错误";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
