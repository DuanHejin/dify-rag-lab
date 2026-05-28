# Workflow API 和日志追踪：它和 Chatflow 到底有什么不同？

在页面里跑通 Workflow 后，我继续验证了它的 API 和日志。

这一步让我更清楚地看到，Workflow 和 Chatflow 不只是“界面不同”。

它们的运行模型、返回结构、streaming 事件和日志观察方式都不一样。

## API 路径不同

Chat Assistant 和 Chatflow 使用的是：

```text
POST /v1/chat-messages
```

Workflow 使用的是：

```text
POST /v1/workflows/run
```

这说明 Dify 在 API 层就把两类应用分开了。

Chatflow 属于聊天类应用。

Workflow 属于工作流运行。

## 请求体重点不同

Workflow 的请求重点是 `inputs`。

例如：

```json
{
  "inputs": {
    "job_type": "前端开发",
    "days": "4",
    "weak_points": "css"
  },
  "response_mode": "blocking",
  "user": "abc-123"
}
```

这些字段对应 Start 节点里配置的输入变量。

Chatflow 的请求重点则是：

```json
{
  "query": "用户问题",
  "conversation_id": "..."
}
```

所以可以这样理解：

```text
Workflow：参数驱动。
Chatflow：对话驱动。
```

## Blocking 响应结构不同

Workflow blocking 响应的关键结构是：

```json
{
  "task_id": "...",
  "workflow_run_id": "...",
  "data": {
    "status": "succeeded",
    "outputs": {
      "answer": "..."
    },
    "elapsed_time": 78.028961,
    "total_tokens": 4136,
    "total_steps": 4
  }
}
```

最终结果在：

```text
data.outputs.answer
```

Chatflow 的最终回答通常在顶层：

```text
answer
```

这个差异很重要。

因为它会直接影响前端或后端怎么接入 API。

如果按 Chatflow 的方式去取 Workflow 结果，就会取错字段。

## Workflow streaming 事件

Workflow streaming 中，我观察到的事件包括：

```text
workflow_started
node_started
node_finished
text_chunk
workflow_finished
```

完整顺序大致是：

```text
workflow_started

start 用户输入:
node_started
node_finished

llm 提取准备重点:
node_started
node_finished

llm 生成准备计划:
node_started
text_chunk
text_chunk
node_finished

end 输出:
node_started
node_finished

workflow_finished
```

其中 `text_chunk` 是 LLM 输出的增量文本。

Chatflow streaming 的增量事件通常是：

```text
message
```

这两个事件名称不同，反映的定位也不同。

Chatflow 在流式输出“消息”。

Workflow 在流式输出“某个节点变量的文本片段”。

## 最终结果仍然以 outputs 为准

在 streaming 模式下，`text_chunk` 可以用于实时展示。

但最终结果仍然应该以：

```text
workflow_finished.data.outputs.answer
```

为准。

原因是：

```text
text_chunk 是过程数据。
outputs 是 End 节点定义的最终返回值。
```

如果要做工程接入，可以分成三类处理：

```text
text_chunk：实时渲染
node_started / node_finished：展示执行过程
workflow_finished：确认最终结果和状态
```

## 日志后台的差异

我也对比了 Workflow 和 Chatflow 的日志。

Workflow 的单条记录里可以看到：

```text
结果
详情
追踪
```

其中：

- 结果：看最终输出
- 详情：看开始输入和最终输出
- 追踪：看每个节点的运行情况

追踪里可以看到：

```text
节点输入
节点输出
耗时
token 用量
执行状态
```

这非常适合排查变量传递和节点问题。

而 Chatflow 的日志更像对话记录。

它更关注：

```text
用户问了什么
AI 最终答了什么
有没有引用知识库
token 和耗时
```

所以我最后的理解是：

```text
Workflow 日志用于看执行过程。
Chatflow 日志用于看对话结果。
```

## 为什么这件事重要

AI 应用的问题通常不是只有“成功”和“失败”。

很多时候，它会表现为：

- 检索到了，但模型没用
- 上游节点输出了，但下游变量引用错了
- 模型回答不对，但真正问题出在 Prompt
- API 有输出，但前端取错字段
- streaming 有增量，但最终 outputs 才是可信结果

这些问题如果只看最终回答，很难定位。

Workflow 的日志追踪价值就在这里。

它让一次运行不再是黑盒。

## 对自研项目的启发

我之前在 SuperAgentConsole 里做 Run Detail 和 AgentEvent。

做完 Dify Workflow 后，我更确定这条路是对的。

对于 AI 应用来说，可观测性不只是打印错误。

而是要能回答：

```text
这次请求进入了哪个节点？
每个节点拿到了什么输入？
每个节点输出了什么？
哪里耗时最长？
最终结果从哪里产生？
```

如果这些看不到，系统就很容易变成黑盒。

所以 Workflow 这一阶段虽然没有做复杂业务。

但它让我更清楚地看到了成熟平台在“运行追踪”上的抽象方式。
