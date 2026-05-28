# Workflow API 验证记录

> 目标：记录 Dify Workflow 的 API 调用方式、请求体、响应结构、节点执行结果和它与 Chatflow API 的差异。

## 1. 应用信息

- 应用类型：Workflow
- 应用主题：求职准备 Workflow
- 模型名称：`doubao-seed-2-0-lite-260428`
- API Base URL：`http://localhost:8080/v1`
- API Key：不写真实值，统一使用 `DIFY_WORKFLOW_API_KEY`
- 测试用户：`abc-123`

## 2. 当前 Workflow 节点

```text
开始（用户输入）
-> LLM：提取准备重点
-> LLM 2：生成准备计划
-> 输出
```

Start 输入变量：

```text
job_type：岗位类型，文本，必填
days：天数，数字，必填
weak_points：薄弱项目，文本，非必填
```

End 输出：

```text
answer = LLM 2 / text
```

## 3. Blocking 调用

请求：

```bash
curl --location --request POST 'http://localhost:8080/v1/workflows/run' \
  --header 'Authorization: Bearer DIFY_WORKFLOW_API_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "inputs": {
      "job_type": "前端开发",
      "days": "4",
      "weak_points": "css"
    },
    "response_mode": "blocking",
    "conversation_id": "",
    "user": "abc-123"
  }'
```

说明：

- Workflow 调用接口是 `/v1/workflows/run`。
- `inputs` 对应 Start 节点配置的输入变量。
- 当前请求里传了 `conversation_id`，但 Workflow 不像 Chatflow 一样强调多轮会话语义。
- 建议后续请求可以去掉 `conversation_id`，保留 `inputs`、`response_mode`、`user`。

## 4. Blocking 响应结构

关键响应字段：

```json
{
  "task_id": "27245efb-4bf7-40f9-92da-f011ee62afd9",
  "workflow_run_id": "269f5938-3eb3-43e8-845e-51cbaf7336c2",
  "data": {
    "id": "269f5938-3eb3-43e8-845e-51cbaf7336c2",
    "workflow_id": "ae6fe3c5-bc41-4c56-aba5-8ca82a3d764a",
    "status": "succeeded",
    "outputs": {
      "answer": "..."
    },
    "error": null,
    "elapsed_time": 78.028961,
    "total_tokens": 4136,
    "total_steps": 4,
    "created_at": 1779955010,
    "finished_at": 1779955088
  }
}
```

观察：

- Workflow 的最终结果在 `data.outputs.answer`。
- Chatflow blocking 的最终回答通常在顶层 `answer`。
- Workflow 返回 `workflow_run_id`，用于标识本次工作流运行。
- `total_steps = 4` 对应当前四个节点：开始、LLM、LLM 2、输出。
- `elapsed_time` 本次约 78 秒，主要由两个 LLM 节点耗时构成。

## 5. 当前输出效果

测试输入：

```text
job_type = 前端开发
days = 4
weak_points = css
```

输出摘要：

```text
生成了一份 4 天前端 CSS 面试突击准备计划。
内容按天拆分，重点包括：
- CSS 高频考点
- CSS 手写题 / 场景题
- 项目中 CSS 相关表达
- 总复盘和模拟面试
```

## 6. Think 标签观察

LLM 2 的 `text` 中可能包含多个 `<think>` 片段。

页面调试结果中，Dify 会把 `<think>` 片段展示为可折叠的“已深度思考”块。

当前观察：

```text
同一个 text 中有多个 <think> 片段时，页面会展示多个折叠块。
折叠块右侧时间显示为 0.0s。
这更像前端兼容展示逻辑的计时限制，不影响 Workflow 输出。
```

## 7. 和 Chatflow API 的第一轮差异

| 对比项 | Workflow | Chatflow |
| --- | --- | --- |
| API 路径 | `/v1/workflows/run` | `/v1/chat-messages` |
| 输入 | `inputs` 自定义变量 | `query` + `inputs` |
| 会话 | 不强调多轮会话 | 使用 `conversation_id` |
| 输出位置 | `data.outputs.answer` | 顶层 `answer` |
| 运行 ID | `workflow_run_id` | `conversation_id` / `message_id` / `task_id` |
| 典型场景 | 一次性任务、批处理、结构化流程 | 多轮聊天、追问、对话式 RAG |

## 8. 待验证

- [x] Streaming 调用
- [x] 记录 `workflow_started`
- [x] 记录 `node_started`
- [x] 记录 `node_finished`
- [x] 记录 `workflow_finished`
- [x] 确认 streaming 中是否存在 Chatflow 那样的 `message` 增量事件

## 9. Streaming 调用

请求：

```bash
curl --location --request POST 'http://localhost:8080/v1/workflows/run' \
  --header 'Authorization: Bearer DIFY_WORKFLOW_API_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "inputs": {
      "job_type": "前端开发",
      "days": "4",
      "weak_points": "nodejs"
    },
    "response_mode": "streaming",
    "conversation_id": "",
    "user": "abc-123"
  }'
```

关键标识：

```text
workflow_run_id：cd4eaf4c-b0f5-45d4-977d-59ce38f228b1
task_id：642a2a87-b96d-4cfd-a2a0-b27b18f84fe3
status：succeeded
total_steps：4
elapsed_time：68.469368
total_tokens：3993
```

## 10. Streaming 事件序列

实际观察到的事件：

```text
workflow_started
node_started
node_finished
node_started
node_finished
node_started
text_chunk
text_chunk
...
node_finished
node_started
node_finished
workflow_finished
```

按节点展开：

```text
workflow_started

start 用户输入:
- node_started
- node_finished

llm 提取准备重点:
- node_started
- node_finished

llm 生成准备计划:
- node_started
- text_chunk 多次增量输出
- node_finished

end 输出:
- node_started
- node_finished

workflow_finished
```

## 11. Streaming 关键字段

`workflow_started`：

```json
{
  "event": "workflow_started",
  "workflow_run_id": "cd4eaf4c-b0f5-45d4-977d-59ce38f228b1",
  "task_id": "642a2a87-b96d-4cfd-a2a0-b27b18f84fe3",
  "data": {
    "inputs": {
      "job_type": "前端开发",
      "days": 4,
      "weak_points": "nodejs",
      "sys.user_id": "abc-123",
      "sys.workflow_run_id": "cd4eaf4c-b0f5-45d4-977d-59ce38f228b1"
    }
  }
}
```

`text_chunk`：

```json
{
  "event": "text_chunk",
  "workflow_run_id": "cd4eaf4c-b0f5-45d4-977d-59ce38f228b1",
  "task_id": "642a2a87-b96d-4cfd-a2a0-b27b18f84fe3",
  "data": {
    "text": "<think>\\n我",
    "from_variable_selector": [
      "1779940257580",
      "text"
    ]
  }
}
```

`workflow_finished`：

```json
{
  "event": "workflow_finished",
  "workflow_run_id": "cd4eaf4c-b0f5-45d4-977d-59ce38f228b1",
  "task_id": "642a2a87-b96d-4cfd-a2a0-b27b18f84fe3",
  "data": {
    "status": "succeeded",
    "outputs": {
      "answer": "..."
    },
    "elapsed_time": 68.469368,
    "total_tokens": 3993,
    "total_steps": 4
  }
}
```

## 12. 和 Chatflow Streaming 的差异

| 对比项 | Workflow streaming | Chatflow streaming |
| --- | --- | --- |
| 增量文本事件 | `text_chunk` | `message` |
| 最终输出 | `workflow_finished.data.outputs` | `message_end` / `workflow_finished` |
| 会话字段 | 无核心 `conversation_id` 语义 | 有 `conversation_id` |
| 节点事件 | `node_started` / `node_finished` | 也有节点事件 |
| 适合场景 | 一次性任务流程 | 对话式流程 |

结论：

```text
Workflow streaming 更强调工作流节点执行过程。
当 LLM 节点产生可流式输出时，会通过 text_chunk 返回增量文本。
最终可用结果仍以 workflow_finished.data.outputs 为准。
```
