# 调完 Workflow API 后，我才看清它和 Chatflow 的真正区别

Workflow 页面调试跑通以后，我继续做 API 验证。

这一步看起来只是补一条 curl。

但实际做完后，我对 Workflow 和 Chatflow 的区别更清楚了。

因为它们不只是页面形态不同。

API 返回结构不同。

Streaming 事件不同。

日志后台能看的东西也不同。

这些差异，才真正决定它们适合什么场景。

## Workflow 的接口不是 chat-messages

Chat Assistant 和 Chatflow 都是：

```text
POST /v1/chat-messages
```

但 Workflow 不是。

Workflow 的接口是：

```text
POST /v1/workflows/run
```

请求体也不一样。

我这次的 blocking 请求大概是：

```json
{
  "inputs": {
    "job_type": "前端开发",
    "days": "4",
    "weak_points": "css"
  },
  "response_mode": "blocking",
  "conversation_id": "",
  "user": "abc-123"
}
```

这里真正重要的是 `inputs`。

它对应的是 Start 节点里的输入字段。

虽然请求里也带了 `conversation_id`，但 Workflow 不像 Chatflow 那样强调多轮会话。

后面再调用时，我其实可以把它去掉。

Workflow 更关心的是：

```text
这一轮任务的输入是什么
```

而不是：

```text
这一轮对话属于哪个会话
```

## Blocking 返回结果在 data.outputs

Chatflow 的 blocking 响应里，最终回答通常在顶层：

```text
answer
```

Workflow 不一样。

它返回的是：

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

这个结构和 Workflow 的本质是一致的。

它不是一个聊天消息。

它是一轮工作流运行。

所以它返回的是：

```text
workflow_run_id
status
outputs
total_steps
elapsed_time
total_tokens
```

这些字段都在强调“任务执行”。

而不是“对话消息”。

## Streaming 事件也不一样

接着我测了 streaming。

请求仍然是：

```text
POST /v1/workflows/run
```

只是把：

```json
"response_mode": "streaming"
```

传进去。

这次我看到的事件序列是：

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

按节点展开更清楚：

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

这里最明显的区别是：

Chatflow 的增量文本事件叫：

```text
message
```

Workflow 的增量文本事件叫：

```text
text_chunk
```

这也很符合它们的定位。

Chatflow 面向聊天消息。

Workflow 面向节点变量输出。

## 最终结果仍然看 workflow_finished

在 streaming 里，`text_chunk` 可以让前端实时展示 LLM 输出。

但最终可用结果，还是要看：

```text
workflow_finished.data.outputs.answer
```

这点和 blocking 是一致的。

`text_chunk` 是过程。

`outputs` 是结果。

如果做前端接入，我会这样理解：

```text
text_chunk：用于实时渲染
workflow_finished.data.outputs：用于最终落库或完成状态
node_started / node_finished：用于展示执行过程
```

这和我自己做 SuperAgentConsole 时设计 AgentEvent 的思路很接近。

前端不只是要拿到最终答案。

还要知道系统正在执行到哪一步。

## 日志后台里，Workflow 更像 Run Detail

API 验证完以后，我又看了日志后台。

Workflow 的日志点开一条记录后，可以看到三个 tab：

```text
结果
详情
追踪
```

详情里能看到：

```text
一开始输入
最终输出
```

追踪里能看到：

```text
每一个节点的运行情况
每个节点的输入
每个节点的输出
耗时
token 用量
```

这对排查问题很有价值。

如果某个节点没拿到变量，或者某个 LLM 耗时特别久，追踪里能直接看出来。

这和我自己的 Run Detail 很像。

它不是只看用户最后看到什么。

而是看整个执行过程。

## Chatflow 日志更像对话结果

相比之下，Chatflow 的日志更偏向对话记录。

它能看到：

```text
用户问了什么
AI 最终答了什么
有没有引用知识库
token 和耗时
```

但它不像 Workflow 那样，把每一个节点的执行过程完整展开给你看。

当然，在 Chatflow 的调试预览里，还是可以看节点运行情况。

只是日志后台的定位不一样。

所以我最后总结成一句话：

```text
Workflow 日志用于看执行过程。
Chatflow 日志用于看对话结果。
```

这句话很短。

但它基本概括了两个应用形态在日志侧的差异。

## 这一步让我重新理解“可观测性”

以前我做页面或者接口时，经常把日志理解成：

```text
请求成功了吗
报错了吗
耗时多久
```

但做 AI 应用后，这还不够。

因为一次 AI 应用请求，内部可能有很多步骤：

```text
输入解析
知识检索
参数提取
模型调用
工具调用
结果整合
最终回答
```

如果只看最终结果，很多问题是看不出来的。

比如：

```text
到底是检索没命中
还是 LLM 没使用检索结果
是上游变量没传对
还是下游 Prompt 写错了
```

Workflow 的日志追踪让我看到，一个成熟平台会把这些过程拆开给你看。

这对自研项目也很有启发。

SuperAgentConsole 里我一直在做 AgentEvent 和 Run Detail，本质上也是为了解决同一个问题：

```text
AI 不能黑盒执行。
```

用户最后看到答案。

但工程师必须看到过程。

Workflow 这一阶段，真正让我确认了这件事。

一个 AI 应用的调试能力，不只是能不能打印日志。

而是能不能把一次运行拆成可理解的步骤。
