# 我开始用 Chatflow 重做 RAG 应用，才理解“对话流程”是什么

在把知识库接入 Chat Assistant 之后，我继续学习了 Dify 的 Chatflow。

这一步的价值不是“再做一个聊天助手”。

而是理解：

```text
一次对话请求，如何被拆成多个可观察、可编排的节点。
```

## 为什么 Chat Assistant 之后还要学 Chatflow

Chat Assistant 已经能完成很多事情。

例如：

- 配置提示词
- 接入模型
- 绑定知识库
- 支持多轮对话
- 通过 `/v1/chat-messages` 调用

如果只是做一个普通问答应用，Chat Assistant 足够了。

但它隐藏了很多内部过程。

比如：

```text
用户问题怎么进入模型？
知识库结果怎么进入模型？
最终回答从哪个节点输出？
如果后面要加判断分支，该放在哪里？
```

Chatflow 的意义就在这里。

它把聊天过程展开成了画布节点。

## 最小 Chatflow 长什么样

我先建了一个最小版本。

节点只有三个：

```text
开始
↓
LLM
↓
回复
```

LLM 节点配置系统提示词：

```text
你是一个求职准备助手，请根据用户输入，用中文给出清晰、可执行的建议。
每次回答开头都输出【求职助手-chatflow-V1】。
```

在调试预览里提问后，模型能正常返回。

这个最小链路验证了两件事：

1. Chatflow 可以从非常简单的流程开始。
2. LLM 节点和回复节点的职责是分开的。

LLM 节点负责生成内容。

回复节点负责把内容返回给用户。

## LLM 节点调试能看到什么

点开 LLM 节点后，可以看到真实的模型请求结构。

例如模型信息：

```json
{
  "model_provider": "langgenius/volcengine_maas/volcengine_maas",
  "model_name": "doubao-seed-2-0-lite-260428"
}
```

也能看到 prompts：

```json
[
  {
    "role": "system",
    "text": "你是一个求职准备助手..."
  },
  {
    "role": "user",
    "text": "我准备面试前端开发岗位，只有 3 天时间，应该怎么准备？"
  }
]
```

这点很重要。

因为很多低代码平台的问题在于：你只能看到配置，看不到中间过程。

但 Chatflow 的调试面板至少能让我确认：

```text
节点配置最终是如何变成模型请求的。
```

## 接入知识库时最容易误解的地方

接入知识库后，流程变成：

```text
用户输入
↓
知识检索
↓
LLM
↓
回复
```

但这里有一个关键点。

知识检索节点拿到结果，不代表 LLM 节点一定会使用结果。

LLM 节点需要在上下文中显式引用知识检索结果。

例如：

```text
用户问题：
{{query}}

知识库检索结果：
{{知识检索.result}}
```

否则就会出现一种情况：

```text
知识检索节点有结果
但 LLM 节点没有正确基于结果回答
```

这个细节让我意识到，RAG 的核心不是“图上连了知识库节点”。

而是：

```text
检索结果是否真正进入了模型上下文。
```

## Chatflow API 和 Chat Assistant 为什么一样

Chatflow 的 API 仍然是：

```text
POST /v1/chat-messages
```

这和 Chat Assistant 一样。

区别不在路径，而在应用的 API Key。

你使用哪个应用的 API Key，就调用哪个应用的配置。

Chatflow 的响应里可以看到：

```json
"mode": "advanced-chat"
```

普通 Chat Assistant 则是：

```json
"mode": "chat"
```

所以可以这样理解：

```text
Dify 对外统一聊天 API。
应用内部形态由应用配置决定。
```

## Streaming 事件能看到流程感

Chatflow streaming 中，我观察到了这些事件：

```text
workflow_started
node_started
node_finished
message
message_end
workflow_finished
```

其中：

- `message` 是增量回答
- `message_end` 是回答结束
- `node_started` / `node_finished` 是节点执行事件
- `workflow_finished` 是整个流程结束

这说明 Chatflow 虽然是聊天应用，但内部依然按工作流方式执行。

这也是它和普通 Chat Assistant 最大的区别之一。

## Chatflow 的定位

经过这轮实验，我对 Chatflow 的理解是：

```text
Chatflow = 对话入口 + 可视化流程 + 可选知识库 + 可扩展节点
```

它适合的场景不是简单问答。

而是需要这些能力的对话应用：

- 需要多轮对话
- 需要知识库
- 需要中间步骤
- 需要条件判断
- 需要把流程调试出来

如果只是一个简单助手，Chat Assistant 更轻。

如果要做对话式 RAG 或带分支的助手，Chatflow 更合适。

## 对自研 Agent 项目的启发

我之前在 SuperAgentConsole 里做过 Agent Run、SSE、AgentEvent、Run Detail。

Chatflow 给我的参照是：

```text
一次对话可以被拆成节点。
节点执行可以被追踪。
模型输出可以被流式返回。
知识库召回可以进入上下文。
```

这些能力在自研项目里需要自己设计。

而在 Dify 里，它们被包装成了可视化配置。

这一步让我更清楚地意识到：

学习 Dify 不是为了替代自研。

而是为了看到成熟平台如何抽象同一类问题。
