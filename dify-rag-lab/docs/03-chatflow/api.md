# Chatflow API 验证记录

> 目标：记录 Dify Chatflow 从最小链路、RAG 节点编排到 API 调用、流式事件、多轮会话和日志观测的验证过程，并和 Chat Assistant、自研 Super Agent Console 做概念对照。

## 1. 应用信息

- 应用类型：Chatflow / Advanced Chat
- 应用名称：求职助手Chatflow RAG
- 模型供应商：火山方舟 / 豆包
- 模型名称：`doubao-seed-2-0-lite-260428`
- 知识库名称：`dify学习知识库`
- Rerank 模型：`Jina reranker-v3`
- API Base URL：`http://localhost:8080/v1`
- API Key：不写真实值，文档中统一使用 `DIFY_CHATFLOW_API_KEY`
- 测试用户：`abc-123`

## 2. 编排结构

当前 Chatflow 已验证的主链路：

```text
用户输入 / Start
↓
知识检索 / Knowledge Retrieval
↓
LLM
↓
直接回复 / Answer
```

最小链路阶段先验证：

```text
Start → LLM → Answer
```

RAG 阶段增加知识检索节点后，关键点是：

- 知识检索节点输入要选择用户问题变量。
- 当前验证中查询变量来自 `query` / `sys.query`。
- 知识检索节点输出变量为 `result`，类型为 `Array[Object]`。
- LLM 节点不会因为连线就自动使用检索结果。
- 必须在 LLM 节点的“上下文”里添加 `知识检索.result`。
- 添加后，LLM 输入中会出现 `#context#`。

## 3. Prompt 配置

LLM 节点 System Prompt：

```text
你是一个 Dify / RAG 学习助手。
请优先根据知识库检索结果回答用户问题。
如果知识库检索结果为空或明显无关，请明确说明“知识库中没有找到相关资料”，不要编造。
回答使用中文，结构清晰、可执行。

每次回答开头都输出【Chatflow-RAG-V1】。

用户问题：
{{query}}

知识库检索结果：
{{#context#}}
```

实际变量不要手写，优先通过 Dify 页面变量选择器和 LLM 上下文配置插入。

## 4. API 鉴权

请求头：

```http
Authorization: Bearer DIFY_CHATFLOW_API_KEY
Content-Type: application/json
```

Chatflow 和 Chat Assistant 使用同一个 API 入口：

```text
POST /v1/chat-messages
GET  /v1/conversations
GET  /v1/messages
```

区分具体调用哪个应用，不靠 URL，而靠 API Key 属于哪个 Dify 应用。

Chatflow 响应中可辅助识别：

```json
{
  "mode": "advanced-chat"
}
```

## 5. Blocking API

### 5.1 RAG 相关问题

请求：

```bash
curl --location --request POST 'http://localhost:8080/v1/chat-messages' \
  --header 'Authorization: Bearer DIFY_CHATFLOW_API_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "inputs": {},
    "query": "dify最小升级流程是什么",
    "response_mode": "blocking",
    "conversation_id": "",
    "user": "abc-123"
  }'
```

关键响应字段：

- `event`: `message`
- `mode`: `advanced-chat`
- `conversation_id`: `90f64d9e-cf39-4d35-b1f4-b33844b125da`
- `answer`: 基于知识库回答 Dify 最小升级流程。
- `metadata.retriever_resources[0].dataset_name`: `dify学习知识库`
- `metadata.retriever_resources[0].document_name`: `dify-thread-context.md`
- `metadata.retriever_resources[0].retriever_from`: `workflow`
- `metadata.retriever_resources[0].score`: `0.64143115`
- `metadata.retriever_resources[0].hit_count`: `8`
- `metadata.usage.total_tokens`: `2323`
- `metadata.usage.total_price`: `0.0057318 RMB`

注意：`document_name` 是 Dify 知识库导入时保存的原始文件名。即使本地学习文档后续整理到模块目录，已导入知识库里的文档名也不会自动变化。

命中文档片段：

```text
4.4 Dify 最小镜像升级流程
当前本地 Dify 运行方式是 Docker Compose 拉取并启动官方镜像...
```

结论：

- API 层能拿到 Chatflow RAG 的引用来源。
- `retriever_from=workflow` 表明该检索来自 Chatflow 工作流节点，而不是 Chat Assistant 黑盒知识库配置。
- `mode=advanced-chat` 表明当前应用类型是 Chatflow。

### 5.2 无关问题

请求：

```bash
curl --location --request POST 'http://localhost:8080/v1/chat-messages' \
  --header 'Authorization: Bearer DIFY_CHATFLOW_API_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "inputs": {},
    "query": "今天北京天气怎么样？",
    "response_mode": "blocking",
    "conversation_id": "",
    "user": "abc-123"
  }'
```

关键响应：

```json
{
  "mode": "advanced-chat",
  "answer": "<think>...</think>【Chatflow-RAG-V1】\n知识库中没有找到相关资料，无法为你查询今日北京的天气相关信息，建议你通过官方正规的气象服务平台获取准确的实时天气情况。",
  "metadata": {
    "retriever_resources": []
  }
}
```

结论：

- 无关问题下 `retriever_resources=[]`。
- LLM 按 Prompt 规则说明知识库中没有找到相关资料。
- 未编造实时天气信息。

## 6. Streaming API

请求体只需把 `response_mode` 改为 `streaming`：

```bash
curl -N --location --request POST 'http://localhost:8080/v1/chat-messages' \
  --header 'Authorization: Bearer DIFY_CHATFLOW_API_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "inputs": {},
    "query": "我准备面试前端开发岗位，只有 2 天时间，应该怎么准备？",
    "response_mode": "streaming",
    "conversation_id": "",
    "user": "abc-123"
  }'
```

Chatflow streaming 事件顺序：

```text
workflow_started
↓
node_started: start
↓
node_finished: start
↓
node_started: llm
↓
message
↓
node_started: answer
↓
node_finished: answer
↓
message_end
↓
workflow_finished
```

### 6.1 workflow_started

示例字段：

```json
{
  "event": "workflow_started",
  "workflow_run_id": "e3e088ec-9241-436c-8243-ade44945a61c",
  "data": {
    "workflow_id": "f9f9d26e-acb5-4d64-aeb2-c58f53a8b4a2",
    "inputs": {
      "sys.query": "我准备面试前端开发岗位，只有 2 天时间，应该怎么准备？",
      "sys.user_id": "abc-123",
      "sys.dialogue_count": 1,
      "sys.app_id": "3976400c-e5ee-4895-8e56-12fca79c82c7",
      "sys.workflow_id": "f9f9d26e-acb5-4d64-aeb2-c58f53a8b4a2",
      "sys.workflow_run_id": "e3e088ec-9241-436c-8243-ade44945a61c"
    }
  }
}
```

观察：

- `workflow_run_id` 标识一次 Chatflow 流程运行。
- `sys.query` 是用户问题。
- `sys.dialogue_count` 可用于观察当前会话轮次。

### 6.2 node_started / node_finished

Start 节点示例：

```json
{
  "event": "node_started",
  "data": {
    "node_type": "start",
    "title": "用户输入"
  }
}
```

Answer 节点完成示例：

```json
{
  "event": "node_finished",
  "data": {
    "node_type": "answer",
    "title": "直接回复",
    "status": "succeeded",
    "outputs": {
      "answer": "..."
    }
  }
}
```

观察：

- Chatflow streaming 会暴露节点级事件。
- 这比 Chat Assistant streaming 更适合做运行过程可视化。

### 6.3 message

示例：

```json
{
  "event": "message",
  "answer": "<think>\n2",
  "from_variable_selector": [
    "llm",
    "text"
  ]
}
```

观察：

- `message` 事件返回增量文本。
- `from_variable_selector=["llm","text"]` 表示文本来自 LLM 节点的 `text` 输出。
- 当前豆包模型会把 `<think>` 内容原样放到 API 流中。

### 6.4 message_end

示例字段：

```json
{
  "event": "message_end",
  "metadata": {
    "retriever_resources": [],
    "usage": {
      "prompt_tokens": 113,
      "completion_tokens": 1962,
      "total_tokens": 2075,
      "total_price": "0.007131",
      "currency": "RMB",
      "latency": 39.154,
      "time_to_first_token": 2.152,
      "time_to_generate": 37.486
    }
  }
}
```

观察：

- `usage` 在 `message_end` 中出现。
- RAG 场景下，`retriever_resources` 也应重点看 `message_end`。

### 6.5 workflow_finished

示例字段：

```json
{
  "event": "workflow_finished",
  "data": {
    "status": "succeeded",
    "outputs": {
      "answer": "..."
    },
    "elapsed_time": 39.299287,
    "total_tokens": 2075,
    "total_steps": 3,
    "exceptions_count": 0
  }
}
```

观察：

- `workflow_finished` 能看到流程级汇总。
- `total_steps` 对应本次执行经过的节点数量。

## 7. 多轮会话

第二轮请求复用上一轮 `conversation_id`：

```bash
curl --location --request POST 'http://localhost:8080/v1/chat-messages' \
  --header 'Authorization: Bearer DIFY_CHATFLOW_API_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "inputs": {},
    "query": "简单概括下第一天的事情",
    "response_mode": "blocking",
    "conversation_id": "56096ae1-27f4-4522-aaf4-2fa837828ad4",
    "user": "abc-123"
  }'
```

关键响应：

```json
{
  "conversation_id": "56096ae1-27f4-4522-aaf4-2fa837828ad4",
  "mode": "advanced-chat",
  "answer": "【求职助手-chatflow-V1】\n第一天用8小时集中完成核心考点突击..."
}
```

观察：

- 第二轮问题没有重复说明“第一天”来自哪个计划。
- 模型仍能概括上一轮回答中的第一天安排。
- `prompt_tokens` 从首轮的一百多增长到 `1027`，说明 Dify 将历史上下文拼入了模型输入。

## 8. 调试预览与日志记录

实际观察：

- Chatflow 调试预览中的调用不会出现在“日志与标注”里。
- 调试预览更适合在当前编排页面查看节点输入、输出、上下文和 trace。
- 通过 WebApp 正式访问或 `/v1/chat-messages` API 调用，会进入“日志与标注”。

结论：

```text
调试预览 = 草稿调试，不污染正式运行日志
API 调用 = 已发布应用的真实外部调用，会生成正式 conversation / message
```

## 9. `<think>` 输出观察

当前豆包模型返回中会包含：

```text
<think>...</think>
```

已验证现象：

- LLM 节点原始输出中包含 `<think>`。
- Chatflow 预览 UI 会把 `<think>` 渲染成可折叠块。
- API blocking 的 `answer` 中会原样包含 `<think>`。
- API streaming 的 `message` 事件会逐段推送 `<think>`。

后续自研项目接入时可选策略：

- 保留 `<think>` 并渲染成可折叠思考块。
- 在服务端或前端过滤 `<think>...</think>`，只展示最终答案。

## 10. 和其他形态对照

| Dify Chatflow | Chat Assistant | Super Agent Console |
| --- | --- | --- |
| `mode=advanced-chat` | `mode=chat` | App / Agent 类型 |
| `workflow_run_id` | 无明显流程运行 ID | `AgentRun.id` |
| `workflow_started` | 无 | `agent_run_started` |
| `node_started` / `node_finished` | 无 | `AgentEvent` |
| Knowledge Retrieval 节点 | 应用级知识库配置 | Retrieval Step |
| LLM 节点 | 内置模型调用 | `model_call` |
| Answer 节点 | 内置回复生成 | `final_answer` |
| `retriever_from=workflow` | `retriever_from=api` 或应用侧检索 | 检索来源 |
| 日志与标注 | 日志与标注 | Run Detail / Message History |

阶段结论：

- Chat Assistant 适合快速配置一个聊天助手，链路更黑盒。
- Chatflow 适合把对话、知识检索、LLM、回复拆成可观察节点。
- Chatflow streaming 的节点级事件很适合对照自研项目中的 `AgentEvent` 和 `Run Detail`。
