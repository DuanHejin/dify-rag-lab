# Chat Assistant API 验证记录

> 目标：记录 Dify Chat Assistant 从页面编排到 API 调用、日志观测、监测指标的完整验证过程，并和 Super Agent Console 做概念对照。

## 1. 应用信息

- 应用类型：Chat Assistant
- 应用名称：简单的求职聊天助手
- 模型供应商：豆包
- 模型名称：`doubao-seed-2-0-lite-260428`
- API Base URL：`http://localhost:8080/v1`
- API Key：不写真实值，文档中统一使用 `DIFY_APP_API_KEY`
- 测试用户：`abc-123`

## 2. 编排配置

### 2.1 Prompt V1

```text
你是一个求职准备助手，请根据用户输入，用中文给出清晰、可执行的建议。
```

详细提示词实验记录见：

```text
dify-rag-lab/experiments/prompts/chat-assistant-prompts.md
```

### 2.2 已验证能力

- [x] 配置提示词
- [x] 配置变量
- [x] 调试与预览
- [x] 单轮聊天
- [x] 多轮聊天
- [ ] 发布更新生效验证
- [ ] 知识库
- [ ] 元数据过滤
- [ ] 视觉输入
- [ ] 模型参数对比

## 3. API 鉴权

请求头：

```http
Authorization: Bearer DIFY_APP_API_KEY
Content-Type: application/json
```

Apifox 实际请求中还包含 `User-Agent`、`Accept`、`Host`、`Connection` 等常规 HTTP 头；核心必需头是 `Authorization` 和 `Content-Type`。

## 4. 发送对话消息

### 4.1 Blocking

```bash
curl -X POST 'http://localhost:8080/v1/chat-messages' \
  --header 'Authorization: Bearer DIFY_APP_API_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "inputs": {
      "job_type": "前端开发"
    },
    "query": "我准备面试前端开发岗位，只有 3 天时间，应该怎么准备？",
    "response_mode": "blocking",
    "conversation_id": "",
    "user": "abc-123"
  }'
```

Apifox 实际请求：

```bash
curl --location --request POST 'http://localhost:8080/v1/chat-messages' \
  --header 'Authorization: Bearer DIFY_APP_API_KEY' \
  --header 'User-Agent: Apifox/1.0.0 (https://apifox.com)' \
  --header 'Content-Type: application/json' \
  --header 'Accept: */*' \
  --header 'Host: localhost:8080' \
  --header 'Connection: keep-alive' \
  --data-raw '{
    "inputs": {
      "job_type": "前端开发"
    },
    "query": "我主要薄弱在项目表达和算法，这两块怎么安排？",
    "response_mode": "blocking",
    "conversation_id": "3fc391a0-8a53-418c-b3eb-074e7948451a",
    "user": "abc-123"
  }'
```

关键响应字段：

- `event`: `message`
- `task_id`: `92df018c-2ccf-4093-a2ca-bd5e72b66b48`
- `id`: `16990bdf-99ba-4d34-8da2-1384b5ed2889`
- `message_id`: `16990bdf-99ba-4d34-8da2-1384b5ed2889`
- `conversation_id`: `3fc391a0-8a53-418c-b3eb-074e7948451a`
- `mode`: `chat`
- `answer`: 针对“3 天准备前端面试”给出按天拆分的准备计划，包含前端基础、JS 高频点、算法手撕、框架、网络工程化、项目复盘和临考提醒。
- `metadata.retriever_resources`: `[]`，当前未接入知识库检索。
- `metadata.usage.prompt_tokens`: `79`
- `metadata.usage.completion_tokens`: `2406`
- `metadata.usage.total_tokens`: `2485`
- `metadata.usage.total_price`: `0.008709 RMB`
- `metadata.usage.latency`: `90.92604462500094`
- `metadata.usage.time_to_first_token`: `null`
- `metadata.usage.time_to_generate`: `null`

观察：

- 该响应可用于后续多轮对话，第二轮需要复用 `conversation_id`。
- 当前回复较长，`completion_tokens` 达到 `2406`，说明 Chat Assistant 默认可能会给出非常完整的建议；后续可通过提示词或最大生成长度控制回答长度。
- `retriever_resources` 为空，符合当前未启用知识库的状态。

### 4.2 Streaming

```bash
curl -N -X POST 'http://localhost:8080/v1/chat-messages' \
  --header 'Authorization: Bearer DIFY_APP_API_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "inputs": {
      "job_type": "前端开发"
    },
    "query": "我准备面试前端开发岗位，只有 3 天时间，应该怎么准备？",
    "response_mode": "streaming",
    "conversation_id": "",
    "user": "abc-123"
  }'
```

实际观察到的 event 类型：

- [x] `message`
- [x] `message_end`
- [ ] `error`
- [ ] 其他：未观察到

Streaming 关键响应字段：

- `conversation_id`: `3fc391a0-8a53-418c-b3eb-074e7948451a`
- `message_id`: `b5423a46-2189-4cfa-8b2f-29361d4e79a7`
- `task_id`: `be080dc3-f165-42cd-81f2-78307440abda`
- `event`: 多段 `message`，最后一段 `message_end`
- `metadata.retriever_resources`: `[]`
- `metadata.usage.prompt_tokens`: `2241`
- `metadata.usage.completion_tokens`: `1734`
- `metadata.usage.total_tokens`: `3975`
- `metadata.usage.total_price`: `0.007587 RMB`
- `metadata.usage.latency`: `50.67463995900471`

观察：

- streaming 模式下，每个 `message` 事件返回一小段增量文本，前几段分别出现了 `<think>\n3`、`天`、`面试`、`临时`。
- 同一次 streaming 响应里的多段事件共享同一个 `conversation_id`、`message_id` 和 `task_id`。
- `message_end` 事件不再返回 `answer` 增量，而是返回最终元数据，包括 token 用量、价格、延迟和检索资源。
- 当前模型会输出 `<think>` 标签内容，后续需要通过模型配置、提示词约束或输出后处理观察是否能避免这类内容暴露给最终用户。

### 4.3 Conversation 多轮

第二轮请求使用第一轮返回的 `conversation_id`：

```bash
curl -X POST 'http://localhost:8080/v1/chat-messages' \
  --header 'Authorization: Bearer DIFY_APP_API_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "inputs": {
      "job_type": "前端开发"
    },
    "query": "我主要薄弱在项目表达和算法，这两块怎么安排？",
    "response_mode": "blocking",
    "conversation_id": "第一轮返回的 conversation_id",
    "user": "abc-123"
  }'
```

验证结果：

- [x] 能承接第一轮上下文
- [x] 返回相同 `conversation_id`
- [x] 生成新的 `message_id`

第二轮关键响应字段：

- `event`: `message`
- `task_id`: `26b9c9fa-f579-4be1-ade0-acca30d73544`
- `id`: `fa924cd6-2c7f-48c3-93af-450eee3c2e5e`
- `message_id`: `fa924cd6-2c7f-48c3-93af-450eee3c2e5e`
- `conversation_id`: `3fc391a0-8a53-418c-b3eb-074e7948451a`
- `mode`: `chat`
- `answer`: 承接第一轮的 3 天前端面试准备计划，进一步围绕“项目表达”和“算法薄弱”给出专项补法，包括 12 道高频手撕题、不会写时的思路表达、项目表达的 `STAR+1优化` 模板和时间调整建议。
- `metadata.retriever_resources`: `[]`，当前未接入知识库检索。
- `metadata.usage.prompt_tokens`: `1240`
- `metadata.usage.completion_tokens`: `2164`
- `metadata.usage.total_tokens`: `3404`
- `metadata.usage.total_price`: `0.0085344 RMB`
- `metadata.usage.latency`: `93.45054125800016`

观察：

- 第二轮复用第一轮返回的 `conversation_id` 后，Dify 能正确承接上下文。
- 第二轮返回了新的 `message_id`，说明同一会话下每轮消息仍有独立消息标识。
- `prompt_tokens` 从第一轮的 `79` 增加到第二轮的 `1240`，说明 Dify 会把历史上下文拼入模型输入；多轮越长，输入 token 成本会逐步上升。

## 5. 会话记录接口

已调用接口：

- [x] 会话列表接口：`GET /conversations?user=abc-123&last_id=&limit=20`
- [x] 消息历史接口：`GET /messages?user=abc-123&conversation_id=3fc391a0-8a53-418c-b3eb-074e7948451a`

会话列表实际请求：

```bash
curl --location --request GET 'http://localhost:8080/v1/conversations?user=abc-123&last_id=&limit=20' \
  --header 'Authorization: Bearer DIFY_APP_API_KEY' \
  --header 'User-Agent: Apifox/1.0.0 (https://apifox.com)' \
  --header 'Accept: */*' \
  --header 'Host: localhost:8080' \
  --header 'Connection: keep-alive'
```

消息历史实际请求：

```bash
curl --location --request GET 'http://localhost:8080/v1/messages?user=abc-123&conversation_id=3fc391a0-8a53-418c-b3eb-074e7948451a' \
  --header 'Authorization: Bearer DIFY_APP_API_KEY' \
  --header 'User-Agent: Apifox/1.0.0 (https://apifox.com)' \
  --header 'Accept: */*' \
  --header 'Host: localhost:8080' \
  --header 'Connection: keep-alive'
```

观察结果：

- 会话能按 `user` 查询：已验证，`user=abc-123`
- 消息历史包含用户问题和助手回答：已验证，接口返回 `query`、`answer`、`inputs`、`created_at`、`status`、`retriever_resources` 等字段。
- 消息历史接口返回当前会话内 3 条消息，分别对应第一轮 blocking、第二轮 blocking 和第三轮 streaming。
- 每条消息都有独立 `id`，同时共享同一个 `conversation_id`。
- `inputs.job_type` 会被保存在历史消息里，说明 Dify 会记录应用变量输入。
- `retriever_resources` 均为空数组，符合当前未启用知识库的状态。
- `agent_thoughts`、`message_files`、`extra_contents` 当前均为空，符合普通 Chat Assistant 文本对话状态。
- 和页面日志记录是否一致：待补充

## 6. 发布机制验证

实验步骤：

1. 将提示词临时改为要求回答开头输出 `【求职助手V2】`。
2. 不发布，直接用 API 调用。
3. 点击发布更新。
4. 再次用 API 调用。

预期结论：

- 调试预览使用草稿配置。
- API 使用已发布配置。
- 修改提示词后，需要发布更新，API 才使用新提示词。

实际结果：

- 不发布，直接用 API 调用：返回中没有 `【求职助手V2】`。
- 点击发布更新后，再次用 API 调用：返回中出现 `【求职助手V2】`。

结论：

- Chat Assistant API 使用已发布版本配置。
- 编辑提示词后，调试预览可用于验证草稿效果；要让 API 生效，必须点击发布更新。

## 7. 模型参数实验

使用同一个问题分别测试：

```text
简单说说前端开发在ai盛行的背景下，未来的职业方向应该是什么。简单说说即可
```

| 实验 | temperature | top_p | 观察 |
| --- | --- | --- | --- |
| 稳定严谨 | 0 | 默认 | 输出非常稳定，结构清晰，给出 3 个方向：前端效能工程师、AI 交互前端工程师、端侧 WebAI 开发工程师。表达直接，变化少。 |
| 较稳定 | 0.2 | 默认 | 输出仍然稳定，但表述略更自然，方向变成 AI 前端效能专家、AI 交互场景前端工程师、垂直赛道 AI 前端方案专家。 |
| 发散创意 | 0.8 | 默认 | 输出更有表达张力，措辞更偏产品/职业规划语气，例如“低重叠、高增量”“职业生命周期更长”。内容仍围绕 3 个方向，但包装感更强。 |

实验请求：

```bash
curl --location --request POST 'http://localhost:8080/v1/chat-messages' \
  --header 'Authorization: Bearer DIFY_APP_API_KEY' \
  --header 'User-Agent: Apifox/1.0.0 (https://apifox.com)' \
  --header 'Content-Type: application/json' \
  --header 'Accept: */*' \
  --header 'Host: localhost:8080' \
  --header 'Connection: keep-alive' \
  --data-raw '{
    "inputs": {
      "job_type": "前端开发"
    },
    "query": "简单说说前端开发在ai盛行的背景下，未来的职业方向应该是什么。简单说说即可",
    "response_mode": "blocking",
    "conversation_id": "",
    "user": "abc-123。温度0"
  }'
```

实验结论：

- 模型参数属于 Dify 应用编排里的模型设置，不通过 `/chat-messages` 请求体临时传入。
- 每次修改 temperature 后，需要发布更新，再用相同 API 请求验证。
- 参数对比实验不应复用同一个 `conversation_id`，否则历史上下文会干扰结果。
- temperature 越低，回答越稳定、直接；temperature 越高，表达越发散、包装感更强。
- 本次实验中三个温度都保持了 Prompt V2 的发布效果，回答开头均出现 `【求职助手V2】`。

## 8. 日志与标注

页面观察：

- [x] 可以看到历史对话记录
- [ ] 可以看到用户输入
- [ ] 可以看到模型输出
- [ ] 可以看到 token 用量
- [ ] 可以看到耗时
- [ ] 可以标注/反馈

补充记录：待补充

## 9. 监测

已观察到：

- [x] 过去 7 天会话数
- [x] 活跃用户数
- [x] token 速度
- [x] token 消耗

补充记录：待补充

## 10. 错误场景

| 场景 | 预期 | 实际 |
| --- | --- | --- |
| API Key 错误 | 返回鉴权错误 | 待补充 |
| 缺少 `user` | 返回参数错误 | 待补充 |
| 错误 `conversation_id` | 返回错误或新会话行为 | 待补充 |
| JSON 格式错误 | 返回请求体解析错误 | 待补充 |

## 11. 和 Super Agent Console 对照

| Dify Chat Assistant | Super Agent Console |
| --- | --- |
| App 配置 | Agent 配置 / 运行配置 |
| System Prompt | Agent Prompt / Skill Prompt |
| API Key | Access Code / 服务端鉴权 |
| `conversation_id` | `conversationId` |
| `message_id` | `messageId` |
| `/chat-messages` | Agent Run 创建 / 消息发送接口 |
| streaming event | `AgentEvent` |
| 日志与标注 | Run Detail / Trace / Feedback |
| 监测 | CLS 日志 / token usage / metrics |

## 12. 阶段结论

Chat Assistant 阶段已经完成从页面编排到 API 调用的闭环验证：

- 页面侧验证了提示词、变量、调试预览、单轮和多轮对话。
- API 侧验证了 blocking、streaming、`conversation_id` 多轮、会话列表和消息历史。
- 日志与监测侧验证了对话记录、会话指标、活跃用户、token 速度和 token 消耗。
- 发布机制验证表明，API 使用已发布配置，修改提示词或模型参数后必须发布更新才会对外部 API 生效。
- 模型参数实验表明，temperature 会显著影响输出稳定性和表达发散度。
- 当前未接入知识库，因此 `retriever_resources` 为空；知识库、元数据过滤和视觉输入放到后续 RAG 阶段继续实验。
