# 我开始用 Chatflow 重做 RAG 应用，才理解“对话流程”是什么

把知识库接进 Chat Assistant 之后，我一度觉得 RAG 这条链路已经差不多闭环了。

用户提问。

知识库召回。

模型基于召回结果回答。

API 返回 `retriever_resources`。

这些都已经验证过。

但继续往下看 Dify 的时候，我发现还有一个应用类型绕不开：

```text
Chatflow
```

一开始我对它的理解很简单。

我以为它只是“带流程图的 Chat Assistant”。

后来真正建了一个最小 Chatflow，我才意识到，它表达的东西其实不一样。

Chat Assistant 更像一个已经封装好的聊天应用。

Chatflow 则把一次对话拆成了几个可见的节点。

这一步让我从“调用一个聊天助手”，开始转向“观察一次对话是怎么被编排出来的”。

## 先做一个最小聊天流程

我一开始没有上来就接知识库。

先建了一个最简单的 Chatflow。

画布里只有三个节点：

```text
开始
↓
LLM
↓
回复
```

LLM 节点里配置了系统提示词：

```text
你是一个求职准备助手，请根据用户输入，用中文给出清晰、可执行的建议。
每次回答开头都输出【求职助手-chatflow-V1】。
```

然后在预览窗口问：

```text
我准备面试前端开发岗位，只有 3 天时间，应该怎么准备？
```

结果正常返回。

并且回答确实以：

```text
【求职助手-chatflow-V1】
```

开头。

这一步看起来很简单，但它很重要。

因为我确认了 Chatflow 不是必须一开始就很复杂。

它也可以先从一个最小对话链路开始。

## LLM 节点里能看到真正的 Prompt

调试时，我点开 LLM 节点，看到了它的输入和数据处理。

里面有模型信息：

```json
{
  "model_provider": "langgenius/volcengine_maas/volcengine_maas",
  "model_name": "doubao-seed-2-0-lite-260428"
}
```

也能看到 Dify 最终发给模型的 prompts：

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

这比只看最终回答更有价值。

因为它让我看到：

```text
页面里的节点配置
↓
Dify 组装成模型请求
↓
模型返回 text
↓
回复节点展示给用户
```

这和我自己做 SuperAgentConsole 时理解的 Agent Run 很接近。

只不过在自研项目里，我需要自己设计这些对象。

而在 Dify 里，它被画布节点和调试面板包起来了。

## 接入知识库后，Chatflow 才像一个 RAG 应用

最小链路跑通后，我开始接入知识库。

节点变成：

```text
用户输入
↓
知识检索
↓
LLM
↓
回复
```

这里我踩到一个很典型的小点。

知识检索节点可以拿到结果。

但是 LLM 节点不会自动“理解”这些结果。

我需要在 LLM 的上下文里，把知识检索节点的 `result` 加进去。

否则流程虽然看起来连上了，但模型节点拿不到检索内容。

于是我在 LLM Prompt 里补上了类似这样的内容：

```text
用户问题：
{{query}}

知识库检索结果：
{{知识检索.result}}
```

加完以后，再问：

```text
Dify 最小镜像升级流程是什么？
```

LLM 节点就能看到知识库内容。

最终回答也能展示引用文档。

这一刻，Chatflow 里的 RAG 才真的通了。

不是知识库节点存在就叫 RAG。

而是检索结果要真正进入模型上下文。

## API 还是 chat-messages，但 mode 不一样

后来我用 API 调 Chatflow。

接口路径和 Chat Assistant 一样：

```text
POST /v1/chat-messages
```

一开始我还疑惑：

既然接口一样，那怎么区分自己调用的是 Chat Assistant 还是 Chatflow？

后来我明白了。

区分点不在接口路径。

而在应用的 API Key。

你用哪个应用生成的 Key，就调用哪个应用。

Chatflow 的 blocking 响应里，`mode` 是：

```json
"mode": "advanced-chat"
```

而普通 Chat Assistant 是：

```json
"mode": "chat"
```

这也是一个很实用的观察。

Dify 对外把聊天类应用统一成同一个 API。

但应用内部到底是普通聊天助手，还是 Chatflow 编排，由应用配置决定。

## Streaming 里可以看到节点事件

Chatflow 的 streaming 返回比 blocking 更适合观察流程。

我看到的事件里有：

```text
workflow_started
node_started
node_finished
message
message_end
workflow_finished
```

其中 `message` 是模型回答的增量文本。

`node_started` 和 `node_finished` 则能看到节点开始和结束。

这让我第一次在 Dify API 层面看到：

```text
一次聊天请求
其实也可以是一段 workflow 执行
```

这和我之前在 SuperAgentConsole 里做的 `AgentEvent` 很像。

只不过 Dify 的事件名称和结构已经固定好了。

## 多轮会话仍然靠 conversation_id

Chatflow 仍然是聊天应用。

所以它支持多轮。

第一轮返回 `conversation_id`。

第二轮请求把这个值带回去。

例如：

```json
{
  "conversation_id": "56096ae1-27f4-4522-aaf4-2fa837828ad4",
  "query": "简单概括下第一天的事情"
}
```

模型就能基于上一轮回答继续总结。

这和 Workflow 很不一样。

Workflow 更像一次性任务。

Chatflow 更像一个带流程的对话。

## 这一阶段真正补上的理解

做完 Chatflow V1 后，我对 Dify 的应用形态有了一个更清楚的分层。

Chat Assistant 是最简单的聊天应用。

Knowledge 是可被应用引用的知识能力。

Chatflow 则把聊天过程展开成节点。

它既保留了对话能力，也能显式加入知识检索、条件分支、变量处理这些步骤。

从这个角度看，Chatflow 不是“更复杂的聊天助手”。

它更像是：

```text
对话入口 + 可视化流程 + 可选 RAG
```

这一步没有让我写更多代码。

但它让我更清楚地看到，一个 AI 应用的对话过程，其实可以被拆开、观察、调试和组合。

这对我理解自己的 Agent Runtime 很有帮助。

因为只有先看见流程，才谈得上设计流程。
