# Dify RAG 学习实战 11：Agent Tool、Function calling 和 streaming 事件

前面已经跑完：

```text
Chat Assistant
Knowledge / RAG
Chatflow
Workflow
```

这一篇记录 Agent + Tool。

目标不是做复杂业务。

目标是验证 Dify Agent 的最小工具调用链路：

```text
用户问题
↓
Agent 判断是否需要工具
↓
模型生成工具参数
↓
Tool 执行
↓
Tool 结果进入上下文
↓
Agent 生成最终回答
```

## 1. 应用信息

本次应用：

```text
应用名称：求职助手 Agent Tool
应用类型：Agent
模型：doubao-seed-2-0-lite-260428
Agent mode：Function calling
API Key：DIFY_AGENT_API_KEY
```

Agent mode 显示为 Function calling。

我的理解是：Dify 当前用 function calling 的方式组织工具调用。

它要验证的核心不是名字，而是：

```text
模型是否能选择工具
参数是否能生成正确
工具是否能执行
工具结果是否能进入最终回答
```

## 2. Mock Tool 设计

先做一个最小 HTTP Tool：

```text
get_job_profile
```

用途：

```text
根据岗位类型返回岗位画像、必备技能、面试重点。
```

输入：

```json
{
  "job_type": "前端开发"
}
```

输出示例：

```json
{
  "job_type": "前端开发",
  "market_summary": "前端开发岗位当前更重视工程化能力、复杂业务交付能力、AI 应用接入能力和项目表达能力。",
  "required_skills": ["JavaScript", "Vue 或 React", "工程化", "性能优化", "AI 应用交互"],
  "interview_focus": ["项目表达", "手写题", "浏览器原理", "工程化经验", "AI 产品接入经验"]
}
```

本地 mock 服务：

```text
dify-rag-lab/scripts/mock-job-profile-server.mjs
```

本机访问：

```text
http://localhost:8787
```

Dify 容器访问宿主机：

```text
http://host.docker.internal:8787
```

注意：

```text
Dify 在 Docker 容器里运行。
容器内 localhost 指向容器自身。
所以 Tool server 不能写 http://localhost:8787。
```

## 3. Dify 自定义工具 Schema

Dify 创建自定义工具时，需要填写 OpenAPI / Swagger schema。

最小结构包括：

```text
openapi
info
servers
paths
operationId
parameters
components
```

本质上，这就是 Tool Schema。

它告诉模型：

```text
这个工具叫什么
什么时候可以用
需要什么参数
参数是什么类型
接口怎么请求
```

这和自研 Agent 里的 Tool Schema / Tool Router 是同一类东西，只是 Dify 做成了平台配置。

## 4. Agent Prompt

Prompt 的核心约束：

```text
你是一个求职准备 Agent。
当用户需要查询岗位画像、岗位能力要求、岗位面试重点时，优先调用 get_job_profile。
当用户只是问通用备考建议时，可以直接回答。
如果岗位类型不明确，先追问用户补充岗位。
每次回答开头输出【求职助手-Agent-V1】。
```

实测：

```text
Q：帮我查一下这个岗位要准备什么。
A：请补充具体岗位类型，例如前端开发、后端开发、产品经理等。
```

说明参数不明确时，Agent 会追问。

## 5. Blocking API 限制

Agent 应用仍然使用：

```text
POST /v1/chat-messages
```

但 blocking 不支持。

请求：

```bash
curl --location --request POST 'http://localhost:8080/v1/chat-messages' \
  --header 'Authorization: Bearer DIFY_AGENT_API_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "inputs": {},
    "query": "查询一下后端开发岗位画像，然后告诉我应该重点准备什么。",
    "response_mode": "blocking",
    "conversation_id": "",
    "user": "abc-123"
  }'
```

响应：

```json
{
  "code": "invalid_param",
  "message": "Agent Chat App does not support blocking mode",
  "status": 400
}
```

结论：

```text
Agent Chat App 必须用 streaming。
```

## 6. Streaming API

请求：

```bash
curl --location --request POST 'http://localhost:8080/v1/chat-messages' \
  --header 'Authorization: Bearer DIFY_AGENT_API_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "inputs": {},
    "query": "查询一下后端开发岗位画像，然后告诉我应该重点准备什么。",
    "response_mode": "streaming",
    "conversation_id": "",
    "user": "abc-123"
  }'
```

主要事件：

```text
agent_thought
agent_message
message_end
```

含义：

```text
agent_thought：Agent 思考、工具选择、工具输入、工具返回观察结果
agent_message：最终回答的流式 token
message_end：结束事件和 usage
```

## 7. Tool Call 在 agent_thought 中

工具调用事件：

```json
{
  "event": "agent_thought",
  "tool": "get_job_profile",
  "tool_input": "{\"get_job_profile\": {\"job_type\": \"后端开发\"}}",
  "observation": ""
}
```

工具返回结果：

```json
{
  "event": "agent_thought",
  "tool": "get_job_profile",
  "tool_input": "{\"get_job_profile\": {\"job_type\": \"后端开发\"}}",
  "observation": "{\"get_job_profile\": \"{\\\"job_type\\\":\\\"后端开发\\\",\\\"market_summary\\\":\\\"后端开发岗位当前更重视接口设计、数据库建模、缓存、稳定性和服务部署能力。\\\"}\"}"
}
```

结论：

```text
Agent Tool 调用不看 retriever_resources。
RAG 才看 retriever_resources。
Agent Tool 要看 agent_thought.tool / tool_input / observation。
```

## 8. 最终回答在 agent_message 中流式输出

最终回答事件：

```json
{
  "event": "agent_message",
  "answer": "根据"
}
```

结束事件：

```json
{
  "event": "message_end",
  "metadata": {
    "retriever_resources": [],
    "usage": {
      "prompt_tokens": 1475,
      "completion_tokens": 585,
      "total_tokens": 2060,
      "latency": 12.704753082012758
    }
  }
}
```

这里 `retriever_resources=[]` 是正常的。

因为这次不是知识库检索。

这是工具调用。

## 9. 日志追踪

Dify 日志与标注列表里，主要看到最终回答。

但在预览页面或日志详情里有一个追踪入口。

进入追踪 tab 后，可以看到：

```text
LLM
↓
get_job_profile
↓
LLM
```

其中 `get_job_profile` 节点可以看到：

```text
INPUT
OUTPUT
```

这说明 Dify 能展示工具调用过程，但入口比自研 timeline 更隐蔽。

## 10. 工具失败实验

停掉本地 mock 服务后，再问：

```text
查询一下产品经理岗位画像，然后告诉我应该重点准备什么。
```

现象：

```text
Agent 能意识到工具调用出问题。
但最终仍然基于模型知识生成了一份产品经理准备建议。
```

结论：

```text
如果业务要求必须依赖工具结果，需要在 Prompt 中明确约束失败处理。
```

例如：

```text
当工具调用失败时，必须明确说明工具不可用。
不要基于模型常识继续生成岗位画像。
```

## 11. 未知岗位 fallback

问题：

```text
查询一下测试开发岗位画像，然后告诉我应该重点准备什么。
```

mock 没有预置“测试开发”。

但工具返回了 fallback：

```text
测试开发岗位暂无预置画像，请结合岗位 JD、项目经历和目标公司要求做针对性准备。
```

所以 Agent 继续回答。

这不是工具失败。

这是工具成功返回了兜底结果。

更好的设计是增加字段：

```json
{
  "found": false
}
```

这样 Agent 能明确区分：

```text
命中预置数据
未命中，仅返回兜底结果
```

## 12. 和 SuperAgentConsole 对照

| Dify | SuperAgentConsole |
| --- | --- |
| Tool Schema | Tool Schema |
| Tool 描述 | Tool Router 选择依据 |
| `agent_thought.tool` | `tool_call_start.tool` |
| `agent_thought.tool_input` | `tool_call_start.arguments` |
| `agent_thought.observation` | `tool_call_result` |
| `agent_message` | final answer streaming |
| `message_end.usage` | run usage summary |

Dify 更偏平台封装。

SuperAgentConsole 更偏过程显式化。

前者适合快速搭应用。

后者适合理解 Agent Runtime 的执行过程。

## 13. 本阶段总结

这次 Agent + Tool 实验跑通了以下内容：

```text
创建 Agent 应用
配置 Function calling 模式
创建 OpenAPI 自定义工具
本机 mock 服务通过 host.docker.internal 被 Dify 调用
Agent 在岗位画像问题中调用工具
streaming API 暴露 agent_thought
日志追踪能看到 LLM -> Tool -> LLM
blocking mode 不支持
工具失败和 fallback 行为需要 Prompt / Tool 返回结构约束
```

这一步最重要的收获是：

Agent 不是一个神秘黑盒。

拆开以后，它仍然是工程链路：

```text
工具描述
参数生成
接口调用
结果回填
错误兜底
过程追踪
```

看清这条链路以后，再回头看自研 Agent 项目，很多设计就有了参照。

Dify 把复杂度封装起来。

自研项目把复杂度展开。

两者放在一起看，才更容易理解 Agent 真正的工程形态。
