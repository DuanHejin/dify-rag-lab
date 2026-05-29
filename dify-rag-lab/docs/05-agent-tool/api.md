# Agent + Tool API 验证记录

> 目标：记录 Dify Agent 应用的 API 调用方式、blocking 限制、streaming 事件、tool call 输入输出，以及它和 Chat Assistant / Chatflow / Workflow 的差异。

## 1. 应用信息

- 应用名称：求职助手 Agent Tool
- 应用类型：Agent
- Agent mode：Function calling
- 模型名称：`doubao-seed-2-0-lite-260428`
- API Base URL：`http://localhost:8080/v1`
- API Key：不写真实值，统一使用 `DIFY_AGENT_API_KEY`
- 测试用户：`abc-123`

## 2. Tool 信息

Tool 名称：

```text
get_job_profile
```

用途：

```text
根据岗位类型返回岗位画像、必备技能和面试重点。
```

Mock 服务：

```text
脚本：dify-rag-lab/scripts/mock-job-profile-server.mjs
本机地址：http://localhost:8787
Dify 容器访问地址：http://host.docker.internal:8787
接口：GET /job-profile?job_type=前端开发
```

输入参数：

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

当前验证：

```text
本机 curl 调用成功。
Dify 添加工具界面点击测试成功。
Agent 编排中已添加该工具。
```

## 3. Blocking 调用

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
当前 Dify Agent Chat App 不支持 blocking mode。
Agent 应用虽然仍然使用 /v1/chat-messages，但必须使用 streaming。
```

## 4. Streaming 调用

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

关键标识：

```text
conversation_id：83d21cba-38e8-4045-82ca-01d388c44bbc
message_id：7e0c7a1d-bedc-4a1d-ba83-f62d4cabb1f9
task_id：32fedd7b-de8c-488f-971e-74e9b8ff2cd9
```

## 5. Streaming 事件类型

本次主要观察到：

```text
agent_thought
agent_message
message_end
```

含义：

```text
agent_thought：Agent 思考、工具选择、工具输入、工具返回观察结果。
agent_message：最终回答的流式文本增量。
message_end：最终消息结束，包含 usage、retriever_resources 等 metadata。
```

## 6. Tool 调用事件

第一次 `agent_thought` 可能为空：

```json
{
  "event": "agent_thought",
  "thought": "",
  "observation": "",
  "tool": "",
  "tool_input": ""
}
```

随后出现工具调用信息：

```json
{
  "event": "agent_thought",
  "thought": "<think>\\n我将调用相关工具查询后端开发岗位的画像及备考重点。\\n</think>",
  "tool": "get_job_profile",
  "tool_labels": {
    "get_job_profile": {
      "en_US": "get_job_profile",
      "zh_Hans": "get_job_profile"
    }
  },
  "tool_input": "{\"get_job_profile\": {\"job_type\": \"后端开发\"}}",
  "observation": ""
}
```

这里可以确认：

```text
工具名：get_job_profile
参数：job_type = 后端开发
```

## 7. Tool 返回结果

工具返回结果出现在后续 `agent_thought.observation` 中：

```json
{
  "event": "agent_thought",
  "tool": "get_job_profile",
  "tool_input": "{\"get_job_profile\": {\"job_type\": \"后端开发\"}}",
  "observation": "{\"get_job_profile\": \"{\\\"job_type\\\":\\\"后端开发\\\",\\\"market_summary\\\":\\\"后端开发岗位当前更重视接口设计、数据库建模、缓存、稳定性和服务部署能力。\\\",\\\"required_skills\\\":[\\\"接口设计\\\",\\\"数据库\\\",\\\"缓存\\\",\\\"消息队列\\\",\\\"服务部署\\\"],\\\"interview_focus\\\":[\\\"项目架构\\\",\\\"数据库设计\\\",\\\"高并发处理\\\",\\\"故障排查\\\",\\\"服务稳定性\\\"]}\"}"
}
```

观察：

```text
observation 是字符串形式的工具结果。
其中包含 get_job_profile 的返回 JSON。
当前返回里出现了重复 JSON 拼接的现象，但模型仍然能提取有效信息并生成最终回答。
```

## 8. 最终回答事件

最终回答通过 `agent_message` 增量输出。

示例片段：

```json
{
  "event": "agent_message",
  "answer": "我"
}
```

后续 `agent_thought` 中也能看到整段最终回答：

```text
【求职助手-Agent-V1】
根据后端开发的岗位画像信息，你可以按照以下方向重点准备：
...
```

回答内容使用了 Tool 返回的信息：

```text
接口设计
数据库
缓存
消息队列
服务部署
项目架构
数据库设计
高并发处理
故障排查
服务稳定性
```

## 9. message_end

最终结束事件：

```json
{
  "event": "message_end",
  "metadata": {
    "retriever_resources": [],
    "usage": {
      "prompt_tokens": 1475,
      "completion_tokens": 585,
      "total_tokens": 2060,
      "total_price": "0.0029910",
      "currency": "RMB",
      "latency": 12.704753082012758
    }
  }
}
```

观察：

```text
Agent + Tool 不等于 RAG，因此 retriever_resources 为空是正常的。
工具调用信息不在 retriever_resources 中，而是在 agent_thought 的 tool / tool_input / observation 中。
```

## 10. 和其他应用 API 的差异

| 对比项 | Chat Assistant | Chatflow | Workflow | Agent + Tool |
| --- | --- | --- | --- | --- |
| API 路径 | `/v1/chat-messages` | `/v1/chat-messages` | `/v1/workflows/run` | `/v1/chat-messages` |
| blocking | 支持 | 支持 | 支持 | 不支持 |
| streaming 增量 | `message` | `message` | `text_chunk` | `agent_message` |
| 工具调用事件 | 无 | 通常无 | 无 | `agent_thought` |
| 最终回答 | `answer` | `answer` | `data.outputs.answer` | `agent_message` / `message_end` |
| RAG 引用 | `retriever_resources` | `retriever_resources` | 取决于节点 | 通常为空，除非同时接知识库 |

## 11. 阶段结论

```text
Agent + Tool 的关键观察点不在 blocking，而在 streaming。
blocking 会直接返回 Agent Chat App does not support blocking mode。
streaming 中 agent_thought 暴露了工具名、工具输入和工具返回。
agent_message 负责流式输出最终回答。
message_end 负责结束事件和 usage。
```

日志与标注观察：

```text
Dify 日志与标注列表中，主要看到最终内容。
内容中出现“我将调用相关工具”“岗位信息已获取”，只能间接推断工具已调用。

但在预览 / 日志详情的小入口里进入“追踪”tab，可以看到 Agent 的执行过程：
- LLM
- get_job_profile
- 最终处理 LLM

其中 get_job_profile 能看到 INPUT 和 OUTPUT。

接口层明确的工具调用过程仍然要看 streaming API 的 agent_thought：
- tool
- tool_input
- observation
```

未知岗位兜底观察：

```text
问题：查询一下测试开发岗位画像，然后告诉我应该重点准备什么。
工具输入：{"job_type": "测试开发"}
工具返回：mock 服务没有预置“测试开发”，返回兜底岗位画像。

注意：
这不是工具调用失败，而是工具成功返回了兜底结果。
因此 Agent 会基于兜底结果继续回答。
```

工具 OUTPUT 重复 JSON 现象：

```text
追踪 tab 中 get_job_profile 的 OUTPUT 出现两段 JSON 拼接：
一段紧凑 JSON + 一段带空格的 JSON。

本机 curl 调用 mock 服务只返回一份 JSON，因此重复大概率不是 mock 服务直接返回两份。
初步判断：重复发生在 Dify 自定义工具的响应包装 / 展示层，可能同时保留了原始响应文本和解析后的 JSON 文本。

后续可验证方向：
1. 在 OpenAPI schema 中补充 responses.content.application/json.schema。
2. 让 mock 服务返回 found 字段，明确区分“查到预置画像”和“兜底画像”。
3. 如果业务要求未命中不继续回答，可让 mock 服务对未知岗位返回 404 或 found=false。
```

和自研 Super Agent Console 对照：

```text
agent_thought.tool ≈ tool_call_start 的 tool name
agent_thought.tool_input ≈ tool_call_start 的 arguments
agent_thought.observation ≈ tool_call_result
agent_message ≈ final answer streaming
message_end.usage ≈ run usage / cost summary
```
