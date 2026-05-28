# 用 Dify 做一个聊天助手后，我重新理解了 Prompt、发布和 API 的关系

本地 Dify 跑起来之后，我做的第一个应用是 Chat Assistant。

应用很简单：

```txt
简单的求职聊天助手
```

模型用的是豆包。

第一版提示词也很短：

```txt
你是一个求职准备助手，请根据用户输入，用中文给出清晰、可执行的建议。
```

这不是一个复杂实验。

但它适合用来验证 Dify 里一个聊天应用的基础链路：

```txt
Prompt
变量
调试预览
发布更新
多轮会话
blocking API
streaming API
日志与监测
模型参数
```

我这次关注的不是“模型能不能回答”。

而是：

一个聊天助手从页面配置到 API 调用，中间到底发生了什么。

## 1. 从最小 Prompt 开始

第一版 Prompt 很短：

```txt
你是一个求职准备助手，请根据用户输入，用中文给出清晰、可执行的建议。
```

我故意没有一开始写复杂 Prompt。

原因是想先验证平台链路。

如果一开始就写很多角色设定、输出格式和约束，很容易分不清：

```txt
是 Dify 配置生效了
还是 Prompt 本身太强
```

所以第一步只验证：

```txt
Prompt 是否生效
变量是否能传入
调试预览是否正常
API 是否能拿到同样效果
```

## 2. 调试预览验证基础效果

我在调试预览中问：

```txt
我准备面试前端开发岗位，只有 3 天时间，应该怎么准备？
```

同时传入变量：

```txt
job_type = 前端开发
```

模型返回了一份三天计划。

大概包括：

```txt
第 1 天：HTML / CSS / JS 高频基础
第 2 天：框架、算法、工程化
第 3 天：项目复盘、模拟面试、反问准备
```

从效果看，它已经像一个可用的求职助手。

但这里更重要的是：

调试预览能验证当前应用配置。

包括：

```txt
Prompt
变量
模型参数
多轮上下文
输出效果
```

这一步类似一个应用配置的本地调试环境。

## 3. 发布更新很关键

后面我改了一次 Prompt。

新增一句：

```txt
每次回答开头都输出【求职助手V2】。
```

然后我直接通过 API 调用。

结果返回里没有这个标记。

后来确认原因是：

```txt
修改 Prompt 后，需要点击发布更新。
```

不发布时，API 仍然使用旧配置。

发布以后，再调用 API，返回中才出现：

```txt
【求职助手V2】
```

这个机制很重要。

Dify 中至少存在两种状态：

```txt
草稿态：页面里调试和修改
发布态：API 和正式访问使用
```

这和普通 Web 项目里的部署逻辑类似：

```txt
改了代码，不代表线上立刻生效
需要一次明确发布
```

对 AI 应用来说，这个边界更重要。

因为 Prompt 改动会直接影响用户体验。

## 4. Blocking API 验证

页面调试通过后，我开始调用 API。

接口是：

```txt
POST /v1/chat-messages
```

blocking 请求大概是：

```json
{
  "inputs": {
    "job_type": "前端开发"
  },
  "query": "我主要薄弱在项目表达和算法，这两块怎么安排？",
  "response_mode": "blocking",
  "conversation_id": "上一轮 conversation_id",
  "user": "abc-123"
}
```

返回里比较重要的字段有：

```txt
answer
conversation_id
message_id
metadata.usage
metadata.retriever_resources
```

当时还没有接知识库，所以：

```txt
retriever_resources = []
```

这是符合预期的。

这也说明 `retriever_resources` 是知识库检索结果字段。

普通聊天助手阶段为空。

## 5. conversation_id 支持多轮对话

第一次请求可以不传 `conversation_id`。

Dify 会返回一个新的：

```txt
conversation_id
```

第二次请求把它带上。

模型就能接着上一轮继续回答。

这和自研项目里的：

```txt
Conversation
Message
```

概念可以对上。

区别是：

Dify 已经把多轮对话封装在应用 API 里。

使用者只需要维护 `conversation_id`。

## 6. Streaming API 验证

把请求中的：

```json
"response_mode": "blocking"
```

改成：

```json
"response_mode": "streaming"
```

接口就会持续返回事件。

普通事件类似：

```json
{
  "event": "message",
  "answer": "3"
}
```

最终会返回：

```json
{
  "event": "message_end",
  "metadata": {
    "usage": {}
  }
}
```

这和前端处理 SSE 的思路一致：

```txt
边接收
边渲染
最后收尾
```

对于我自己的 SuperAgentConsole 来说，这里也有一个对照：

```txt
Dify streaming event：偏用户回答流
SuperAgentConsole AgentEvent：偏执行过程流
```

两者都属于事件流。

只是关注点不同。

## 7. 模型参数实验

我还测试了温度参数。

同一个问题：

```txt
简单说说前端开发在 AI 盛行的背景下，未来的职业方向应该是什么。
```

分别使用：

```txt
temperature = 0
temperature = 0.2
temperature = 0.8
```

观察结果：

```txt
温度低：回答更稳定、更收敛
温度高：表达更发散、方向更多
```

这说明模型参数应该和应用目标绑定。

求职建议助手需要的是：

```txt
清晰
稳定
可执行
```

所以温度不宜太高。

如果是创意写作或脑暴应用，可以适当提高。

## 8. 日志和监测

调试几轮以后，可以在 Dify 的日志与标注里看到对话记录。

监测页面能看到：

```txt
会话数
活跃用户
token 消耗
token 速度
延迟
```

这说明一个 AI 应用不能只关注回答效果。

还要关注：

```txt
用户问了什么
模型答了什么
消耗多少 token
响应是否慢
是否需要标注和复盘
```

这和我之前在 SuperAgentConsole 中接 CLS 日志的原因类似。

能观察，才方便排查和迭代。

## 9. 本阶段结论

做完 Chat Assistant 后，我对 Dify 的聊天应用有了更清楚的理解。

它不是一个简单聊天框。

它至少包含：

```txt
Prompt 配置
输入变量
调试预览
发布更新
多轮 conversation
blocking API
streaming API
usage 统计
日志与监测
```

这些东西合在一起，才构成一个可运行的聊天应用。

对照自己的 SuperAgentConsole，可以得到一个结论：

```txt
Dify 更偏平台化配置
SuperAgentConsole 更偏 Agent Runtime 和执行过程解释
```

两者不是替代关系。

而是两个视角。

下一步，我开始看 Dify 的知识库，也就是 RAG。

因为聊天助手解决的是：

```txt
模型如何回答
```

而知识库要解决的是：

```txt
模型如何基于我自己的资料回答
```
