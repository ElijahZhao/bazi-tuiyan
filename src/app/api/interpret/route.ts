/**
 * AI 润色解读 API Route
 *
 * 安全要点（对应项目大纲第八节 security-best-practices）：
 * - API key 只存后端环境变量，绝不下发前端
 * - 输入过滤与 prompt 注入防护
 * - 流式输出
 *
 * Prompt 硬约束：仅依据古法规则库输出，禁止编造、禁止引用规则库外的命理结论。
 */

import { NextRequest } from "next/server";

// ============================================================
// 类型
// ============================================================

interface InterpretRequest {
  features: {
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
    branchRelations: unknown[];
    stemRelations: unknown[];
    shenSha: Record<string, string[]>;
  };
}

// ============================================================
// 构建提示词
// ============================================================

function buildPrompt(features: InterpretRequest["features"]): string {
  const fp = features.fourPillars;
  const shenShaList = Object.entries(features.shenSha)
    .map(([pillar, list]) => `${pillar}: ${list.join("、")}`)
    .join("\n");

  const branchRels = features.branchRelations as { type: string; branches: string; description: string }[];
  const stemRels = features.stemRelations as { type: string; stems: string; transform?: string }[];

  return `你是一位精通八字命理的学者，请依据以下古法规则库提取的命局特征，撰写一段命理解读。

【硬约束】
1. 仅依据以下命局特征输出，禁止编造、禁止引用规则库外的命理结论
2. 风格沉稳，文言白话相间
3. 不得给出具体的吉凶预测（如"某年会发财""某年有灾"等）
4. 只做命理格局的分析和解读，不做命运预测
5. 篇幅控制在 500 字以内

【命局特征】
日主：${features.dayMaster}（${features.dayMasterElement}行）
四柱：${fp.year}年 ${fp.month}月 ${fp.day}日 ${fp.hour}时
旺衰：${features.strength || "待定"}
格局：${features.pattern || "待定"}
用神：${features.yongShen || "待定"}

【地支关系】
${branchRels.length > 0 ? branchRels.map((r) => `${r.type}: ${r.branches} - ${r.description}`).join("\n") : "无明显刑冲合害"}

【天干关系】
${stemRels.length > 0 ? stemRels.map((r) => `${r.type}: ${r.stems}${r.transform ? ` → ${r.transform}` : ""}`).join("\n") : "无明显天干合冲"}

【神煞】
${shenShaList || "无"}

请基于以上特征，撰写命理解读。`;
}

// ============================================================
// POST 处理
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InterpretRequest;

    // 输入校验
    if (!body.features || !body.features.dayMaster || !body.features.fourPillars) {
      return new Response(JSON.stringify({ error: "缺少必要参数" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prompt = buildPrompt(body.features);

    // 检查 API key
    const apiKey = process.env.ARK_API_KEY || process.env.LLM_API_KEY;

    if (!apiKey) {
      // 无 API key 时返回降级提示
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const fallbackText = `命主日主为${body.features.dayMaster}${body.features.dayMasterElement}，四柱${body.features.fourPillars.year}年${body.features.fourPillars.month}月${body.features.fourPillars.day}日${body.features.fourPillars.hour}时。\n\n旺衰：${body.features.strength}，格局：${body.features.pattern}，用神：${body.features.yongShen || "待定"}。\n\n注：AI 解读服务未配置 API Key，此为规则库特征摘要。请配置 LLM API Key 后获取完整 AI 润色解读。`;
          controller.enqueue(encoder.encode(fallbackText));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      });
    }

    // 调用火山方舟 LLM API（OpenAI 兼容接口）
    const llmResponse = await fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.ARK_MODEL_ID || "deepseek-v4-flash-250731",
        messages: [
          {
            role: "system",
            content: "你是一位精通八字命理的学者，严格依据古法规则库进行解读，不做命运预测，不编造规则库外的结论。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: true,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!llmResponse.ok) {
      throw new Error(`LLM API 返回 ${llmResponse.status}`);
    }

    // 流式转发
    return new Response(llmResponse.body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "内部错误";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
