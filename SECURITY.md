# 安全政策

## 支持范围

本项目为个人开源项目，仅对最新发布版本提供安全修复。

| 版本 | 是否支持 |
| --- | --- |
| 最新 main 分支 | ✅ |
| 历史版本 | ❌ |

## 报告漏洞

请勿通过公开 Issue 披露安全问题。请优先使用 GitHub 的
[私密漏洞报告](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
功能，或发送邮件至 `ElijahZhao@users.noreply.github.com`。

请在报告中尽量包含：

- 问题类型与影响范围
- 复现步骤（最小可复现示例）
- 受影响的版本或提交
- 如有可能，附上修复建议

我会在收到报告后尽快确认，并在修复完成后致谢（如你希望署名）。

## 安全设计说明

- **API 密钥**：大模型密钥仅通过服务端环境变量（`ARK_API_KEY`）读取，绝不下发到前端；
  仓库中仅保留 `.env.example` 占位示例，真实密钥不入库。
- **接口防护**：`/api/interpret` 设有同源校验与进程内限流，用于降低接口被外部站点盗用、
  恶意刷取额度的风险。
- **数据流向**：排盘计算全部在浏览器本地完成，命盘数据不上传服务器；仅在用户主动使用
  AI 解读时，才将命局特征发送至所配置的大模型服务。