# Dify RAG 学习实战 07：用 Chatflow 重做一个对话式 RAG 应用

前面已经完成了 Chat Assistant + 知识库的验证。

也就是说，已经跑通：

```text
用户提问
↓
知识库召回
↓
LLM 基于召回内容回答
↓
API 返回 answer 和 retriever_resources
```

这一篇记录继续往下做 Chatflow。

目标不是再做一个聊天助手，而是验证 Dify 如何把一次对话拆成可编排节点。

## 1. 最小 Chatflow 结构

第一版没有直接接复杂逻辑。

先建了一个最小 Chatflow：

```text
开始
↓
LLM
↓
回复
```

LLM 节点配置：

```text
你是一个求职准备助手，请根据用户输入，用中文给出清晰、可执行的建议。
每次回答开头都输出【求职助手-chatflow-V1】。
```

调试问题：

```text
我准备面试前端开发岗位，只有 3 天时间，应该怎么准备？
```

返回结果符合预期，并且以：

```text
【求职助手-chatflow-V1】
```

开头。

## 2. LLM 节点的实际输入

调试 LLM 节点时，可以看到模型配置：

```json
{
  "model_provider": "langgenius/volcengine_maas/volcengine_maas",
  "model_name": "doubao-seed-2-0-lite-260428"
}
```

也可以看到 Dify 组装后的 prompts：

```json
{
  "model_mode": "chat",
  "prompts": [
    {
      "role": "system",
      "text": "你是一个求职准备助手..."
    },
    {
      "role": "user",
      "text": "我准备面试前端开发岗位，只有 3 天时间，应该怎么准备？"
    }
  ]
}
```

这个调试信息很有用。

它能确认节点配置最终如何变成模型请求。

## 3. 接入知识库检索节点

下一步接入知识库。

流程变成：

```text
用户输入
↓
知识检索
↓
LLM
↓
回复
```

这里有一个关键点：

知识检索节点拿到 `result` 后，需要在 LLM 节点上下文里显式引用。

否则 LLM 不一定会基于检索结果回答。

LLM Prompt 中需要包含类似内容：

```text
用户问题：
{{query}}

知识库检索结果：
{{知识检索.result}}
```

验证问题：

```text
Dify 最小镜像升级流程是什么？
```

结果：

- 知识检索能召回相关文档
- LLM 能基于召回内容回答
- 页面可以展示引用文档

## 4. Blocking API

Chatflow 的 API 路径和 Chat Assistant 一样：

```text
POST /v1/chat-messages
```

示例：

```bash
curl --location --request POST 'http://localhost:8080/v1/chat-messages' \
  --header 'Authorization: Bearer DIFY_CHATFLOW_API_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "inputs": {},
    "query": "Dify 最小镜像升级流程是什么？",
    "response_mode": "blocking",
    "conversation_id": "",
    "user": "abc-123"
  }'
```

Chatflow 响应中可以看到：

```json
{
  "mode": "advanced-chat",
  "answer": "...",
  "metadata": {
    "retriever_resources": []
  }
}
```

这里的 `mode = advanced-chat` 可以区分它不是普通 Chat Assistant。

但真正决定调用哪个应用的是 API Key。

## 5. Streaming API 事件

Chatflow streaming 中观察到的事件：

```text
workflow_started
node_started
node_finished
message
message_end
workflow_finished
```

其中 `message` 是回答增量：

```json
{
  "event": "message",
  "answer": "..."
}
```

`message_end` 中可以看到最终 metadata。

如果命中了知识库，最终会带上：

```json
{
  "metadata": {
    "retriever_resources": [
      {
        "dataset_name": "dify学习知识库",
        "document_name": "...",
        "content": "..."
      }
    ]
  }
}
```

## 6. 多轮会话

Chatflow 仍然是聊天应用，所以支持 `conversation_id`。

第一轮返回：

```text
conversation_id
```

第二轮带回：

```json
{
  "conversation_id": "56096ae1-27f4-4522-aaf4-2fa837828ad4",
  "query": "简单概括下第一天的事情"
}
```

模型可以基于历史回答继续总结。

这点和 Workflow 不同。

Workflow 更偏一次性任务。

Chatflow 是带流程编排的对话。

## 7. 本阶段结论

Chatflow V1 跑通后，可以得到几个结论：

```text
Chatflow API 仍然是 /v1/chat-messages
Chatflow 响应 mode 是 advanced-chat
知识检索 result 必须进入 LLM 上下文
streaming 中既有节点事件，也有 message 增量事件
conversation_id 仍然用于多轮对话
```

如果用一句话总结：

```text
Chat Assistant 是封装好的聊天助手。
Chatflow 是可以看见节点和流程的聊天助手。
```

这一步之后，才适合继续做参数提取、IF/ELSE 和确定性分支。
