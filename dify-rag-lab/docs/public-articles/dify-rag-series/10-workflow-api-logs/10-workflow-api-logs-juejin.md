# Dify RAG 学习实战 10：Workflow API、Streaming 事件和日志追踪

上一篇跑通了 Workflow 页面编排。

这一篇记录 API 和日志。

核心对比对象是 Chatflow。

## 1. Workflow API 路径

Workflow 调用接口：

```text
POST /v1/workflows/run
```

Chatflow / Chat Assistant 调用接口：

```text
POST /v1/chat-messages
```

这说明 Workflow 在 API 层就是另一类运行模型。

## 2. Blocking 请求

请求示例：

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

```text
inputs 对应 Start 节点的输入变量。
conversation_id 对 Workflow 没有 Chatflow 那样的多轮会话意义。
后续可保留 inputs、response_mode、user 即可。
```

## 3. Blocking 响应结构

关键响应：

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
    "total_steps": 4
  }
}
```

最终答案字段：

```text
data.outputs.answer
```

和 Chatflow 的差异：

```text
Chatflow blocking：顶层 answer
Workflow blocking：data.outputs.answer
```

## 4. Streaming 请求

请求示例：

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

## 5. Streaming 事件序列

实际事件：

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

## 6. text_chunk

Workflow 的增量文本事件是：

```json
{
  "event": "text_chunk",
  "workflow_run_id": "...",
  "task_id": "...",
  "data": {
    "text": "<think>\\n我",
    "from_variable_selector": [
      "1779940257580",
      "text"
    ]
  }
}
```

注意：

```text
Chatflow 增量事件通常是 message。
Workflow 增量事件是 text_chunk。
```

`from_variable_selector` 表示这段文本来自哪个节点变量。

## 7. workflow_finished

最终事件：

```json
{
  "event": "workflow_finished",
  "workflow_run_id": "...",
  "task_id": "...",
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

接入时建议：

```text
实时展示：使用 text_chunk
最终结果：使用 workflow_finished.data.outputs.answer
执行过程：使用 node_started / node_finished
```

## 8. Workflow 日志

Workflow 日志点开一条记录后，可以看到：

```text
结果
详情
追踪
```

其中追踪 tab 可以看到：

```text
每个节点的运行状态
节点输入
节点输出
耗时
token 用量
```

这对排查很有用。

例如：

```text
Start 输入是否传入
LLM 1 是否输出准备重点
LLM 2 是否拿到 LLM 1 的 text
End 输出是否绑定 answer
哪个节点耗时最长
```

## 9. Chatflow 日志差异

Chatflow 日志更像对话结果记录。

它重点看：

```text
用户问题
最终回答
引用资源
token
耗时
```

不像 Workflow 日志那样完整展开每个节点的执行过程。

阶段结论：

```text
Workflow 日志用于看执行过程。
Chatflow 日志用于看对话结果。
```

## 10. 本阶段总结

Workflow API 的关键点：

```text
接口：POST /v1/workflows/run
输入：inputs
blocking 输出：data.outputs.answer
streaming 增量：text_chunk
最终事件：workflow_finished
运行标识：workflow_run_id
日志重点：节点追踪
```

和 Chatflow 对比：

```text
Chatflow 面向对话消息。
Workflow 面向任务执行。
```

如果要做真实工程接入，这个差异不能忽略。

否则很容易把 Workflow 当成 Chatflow 来接，最后在字段、事件和日志定位上踩坑。
