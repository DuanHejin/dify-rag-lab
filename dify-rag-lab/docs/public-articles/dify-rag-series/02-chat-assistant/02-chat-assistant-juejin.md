# Dify RAG 学习实战 02：Chat Assistant 从页面调试到 API 调用

本地 Dify 跑起来后，第一步先创建一个 Chat Assistant 应用。

应用名称：

```txt
简单的求职聊天助手
```

模型使用豆包。

第一版 Prompt：

```txt
你是一个求职准备助手，请根据用户输入，用中文给出清晰、可执行的建议。
```

这个实验目标不是做一个复杂助手。

而是验证 Dify Chat Assistant 的基础链路：

```txt
Prompt
变量
调试预览
发布更新
blocking API
streaming API
conversation_id
日志与监测
模型参数
```

## 1. 创建 Chat Assistant

在 Dify 控制台创建 Chat Assistant 应用。

配置模型：

```txt
供应商：豆包
模型：doubao-seed-2-0-lite-260428
```

配置 Prompt：

```txt
你是一个求职准备助手，请根据用户输入，用中文给出清晰、可执行的建议。
```

这个 Prompt 很短。

原因是先验证平台链路，不希望一开始引入太多 Prompt 变量。

## 2. 配置输入变量

应用里配置了一个变量：

```txt
job_type = 前端开发
```

后续 API 请求中传入：

```json
{
  "inputs": {
    "job_type": "前端开发"
  }
}
```

这个变量可以用于让同一个助手适配不同岗位。

例如：

```txt
前端开发
后端开发
产品经理
测试工程师
```

## 3. 调试预览

在调试预览中输入：

```txt
我准备面试前端开发岗位，只有 3 天时间，应该怎么准备？
```

返回结果可以正常按天拆解计划。

大概包括：

```txt
第 1 天：HTML / CSS / JS 基础
第 2 天：算法、框架、工程化
第 3 天：项目复盘、模拟面试、反问准备
```

调试预览用于验证：

```txt
Prompt 是否生效
变量是否生效
模型参数是否合适
回答格式是否符合预期
多轮上下文是否正常
```

## 4. 发布更新机制

后续修改 Prompt：

```txt
每次回答开头都输出【求职助手V2】。
```

如果不点击发布更新，API 调用不会使用最新 Prompt。

发布前调用：

```txt
返回中没有【求职助手V2】
```

发布后调用：

```txt
返回中包含【求职助手V2】
```

结论：

```txt
调试配置 ≠ API 发布配置
修改 Prompt / 知识库 / 检索配置后，需要发布更新
```

这个机制避免了配置随手修改后直接影响线上调用。

## 5. Blocking API

Chat Assistant API 使用：

```txt
POST /v1/chat-messages
```

blocking 请求示例：

```bash
curl --location --request POST 'http://localhost:8080/v1/chat-messages' \
  --header 'Authorization: Bearer DIFY_APP_API_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "inputs": {
      "job_type": "前端开发"
    },
    "query": "我主要薄弱在项目表达和算法，这两块怎么安排？",
    "response_mode": "blocking",
    "conversation_id": "",
    "user": "abc-123"
  }'
```

关键返回字段：

```txt
answer
conversation_id
message_id
metadata.usage
metadata.retriever_resources
```

当未接入知识库时：

```txt
metadata.retriever_resources = []
```

这是正常结果。

## 6. conversation_id 多轮对话

第一次请求：

```json
"conversation_id": ""
```

Dify 返回：

```txt
conversation_id: xxx
```

第二次请求带上同一个 `conversation_id`：

```json
"conversation_id": "xxx"
```

模型会基于同一会话上下文继续回答。

这说明 Dify 的多轮对话由 `conversation_id` 串起来。

对照自研项目，可以理解为：

```txt
Dify conversation_id ≈ Conversation ID
Dify message_id ≈ Message ID
```

## 7. Streaming API

将请求参数改成：

```json
"response_mode": "streaming"
```

接口会返回多个事件。

普通 message 事件：

```json
{
  "event": "message",
  "answer": "3"
}
```

结束事件：

```json
{
  "event": "message_end",
  "metadata": {
    "usage": {}
  }
}
```

前端处理时需要：

```txt
监听 message 事件
拼接 answer
遇到 message_end 后收尾
处理错误事件
记录 conversation_id / message_id
```

这和 SSE 流式响应解析逻辑一致。

## 8. 模型参数测试

测试问题：

```txt
简单说说前端开发在 AI 盛行的背景下，未来的职业方向应该是什么。
```

分别测试：

```txt
temperature = 0
temperature = 0.2
temperature = 0.8
```

观察：

```txt
温度低：回答稳定、收敛
温度高：回答发散、表达更丰富
```

应用建议：

```txt
求职建议助手：低温度更合适
创意写作助手：可以适当提高温度
```

模型参数应服务具体应用目标。

## 9. 日志与监测

Dify 的日志与标注可以看到历史对话。

监测页面可以看到：

```txt
会话数
活跃用户
token 消耗
token 速度
延迟
```

这说明 Chat Assistant 不只是回答接口。

它还包含运行观测能力。

一个 AI 应用如果要长期使用，需要关注：

```txt
用户问题
模型回答
token 成本
响应延迟
异常情况
标注反馈
```

## 10. 本阶段结论

完成 Chat Assistant 后，已经验证：

```txt
页面调试可用
Prompt 生效
变量可传入
发布更新影响 API 配置
blocking API 可用
streaming API 可用
conversation_id 支持多轮
日志与监测可观察
```

对照 SuperAgentConsole：

```txt
Dify Chat Assistant：
平台配置 + App API + 基础监测

SuperAgentConsole：
Agent Runtime + Tool Router + AgentEvent + Run Detail
```

下一步进入 Knowledge / RAG。

目标是验证：

```txt
模型如何基于自己的 Markdown 学习文档回答问题
```
