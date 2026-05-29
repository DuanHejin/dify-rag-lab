# 做完 Workflow 后，我在 Dify 里接了一个 Agent Tool，终于看清工具调用链路

前面我已经在 Dify 里依次跑过 Chat Assistant、知识库 RAG、Chatflow 和 Workflow。

到这个阶段，再学 Agent + Tool，其实不是为了“再创建一种应用”。

我真正想验证的是：

```text
Dify 的 Agent 到底怎样判断工具、生成参数、执行工具，并把结果带回最终回答。
```

因为在我自己的 SuperAgentConsole 项目里，这部分是我手写的。

我自己实现了 Tool Router、Tool Handler，也把工具调用过程落到了 timeline 里。

所以学习 Dify Agent + Tool，本质上是在用成熟平台反过来校准我对 Agent Runtime 的理解。

## 为什么先做 mock Tool

我没有直接接真实业务接口。

而是先写了一个很小的本地 mock 服务：

```text
get_job_profile
```

它的作用是：

```text
根据岗位类型返回岗位画像、必备技能和面试重点。
```

比如输入：

```json
{
  "job_type": "后端开发"
}
```

返回：

```json
{
  "job_type": "后端开发",
  "market_summary": "后端开发岗位当前更重视接口设计、数据库建模、缓存、稳定性和服务部署能力。",
  "required_skills": ["接口设计", "数据库", "缓存", "消息队列", "服务部署"],
  "interview_focus": ["项目架构", "数据库设计", "高并发处理", "故障排查", "服务稳定性"]
}
```

之所以先用 mock，是因为这一阶段重点不是业务数据。

重点是观察链路：

```text
Agent 是否会选择工具
工具参数是否正确
工具返回是否进入最终回答
失败时 Agent 如何兜底
```

如果一开始就接复杂接口，很容易把问题混在鉴权、网络、数据结构里。

## Dify 自定义工具依赖 OpenAPI Schema

创建自定义工具时，Dify 需要填写 schema。

这个 schema 要符合 OpenAPI / Swagger 规范。

也就是说，Dify 需要知道：

```text
工具接口地址
请求方法
参数位置
参数类型
operationId
接口描述
```

这和我自研项目里的 Tool Schema 很像。

只不过 Dify 把它做成了平台配置。

自研项目里，我更多是用代码来定义。

但底层逻辑是一致的：

```text
给模型一份结构化工具说明，让模型根据说明决定是否调用工具，并生成符合 schema 的参数。
```

这一步让我重新确认了一点：

Agent 的工具调用不是“模型想调什么就调什么”。

它必须依赖一套清晰的工具描述和参数约束。

## Agent mode：Function calling 是什么

在 Agent 设置里，我看到当前模式是：

```text
Function calling
```

一开始我以为这是不是说明当前模型不能使用 tool call。

但从实验结果看，更合理的理解是：

Dify 当前用 function calling 的方式完成工具调用编排。

这里不用纠结名字。

真正要看的，是运行时是否完成了这几件事：

```text
模型选择工具
模型生成参数
Dify 执行工具
工具结果进入模型上下文
模型生成最终回答
```

本次实验里，这条链路是跑通的。

## Agent API 和 Chat Assistant 看起来一样，但行为不同

Dify Agent 仍然使用：

```text
POST /v1/chat-messages
```

这一点和 Chat Assistant、Chatflow 很像。

但 Agent 有一个明显差异：

```text
Agent Chat App 不支持 blocking mode
```

我用 blocking 请求时，返回的是：

```json
{
  "code": "invalid_param",
  "message": "Agent Chat App does not support blocking mode",
  "status": 400
}
```

所以 Agent 必须用 streaming。

这也合理。

因为 Agent 运行过程中可能包含：

```text
模型思考
工具选择
工具调用
工具返回
二次模型生成
```

这些中间过程本来就更适合用流式事件表达。

## 真正的工具调用信息在 agent_thought

Agent streaming 里，我观察到几个关键事件：

```text
agent_thought
agent_message
message_end
```

其中，工具调用信息不在最终回答里，也不在 `retriever_resources` 里。

它在：

```text
agent_thought
```

比如：

```json
{
  "event": "agent_thought",
  "tool": "get_job_profile",
  "tool_input": "{\"get_job_profile\": {\"job_type\": \"后端开发\"}}"
}
```

工具结果在：

```text
agent_thought.observation
```

这点和 RAG 很不一样。

RAG 的引用信息主要看：

```text
metadata.retriever_resources
```

Agent Tool 要看：

```text
agent_thought.tool
agent_thought.tool_input
agent_thought.observation
```

这也是我这次实验里最重要的 API 认知。

## 日志追踪可以看到 LLM -> Tool -> LLM

一开始我以为 Dify 日志里看不到工具执行过程。

因为“日志与标注”的列表里，主要展示的是最终回答。

但后来我发现，在预览页或日志详情里，有一个比较小的追踪入口。

点进去以后，可以看到执行链路：

```text
LLM
↓
get_job_profile
↓
LLM
```

工具节点里能看到 INPUT 和 OUTPUT。

这说明 Dify 并不是完全隐藏工具调用过程。

只是它的默认视角更偏最终结果。

如果想看执行过程，需要进入 trace。

这和我自研的 SuperAgentConsole 不太一样。

SuperAgentConsole 从一开始就把 timeline 当成一等公民。

我希望用户直接看到：

```text
tool_call_start
tool_call_result
final_answer
```

Dify 则是平台化产品逻辑：

默认让普通用户看到结果。

需要排查时，再看追踪。

## 工具失败时，模型会尝试兜底

我停掉本地 mock 服务后，又问了一次产品经理岗位画像。

这时工具实际不可用。

Agent 能感知到工具调用出现问题。

但最终没有直接中断，也没有明确告诉我“工具不可用”。

它基于模型自己的知识，继续生成了一份产品经理岗位准备建议。

这个现象说明两点。

第一，Agent 有一定兜底倾向。

第二，如果业务要求答案必须来自工具，就不能只依赖模型自觉。

需要在提示词里明确约束：

```text
当工具调用失败时，必须说明工具不可用。
不要基于模型常识继续生成岗位画像。
```

否则用户会得到一个看起来合理、但不一定来自工具数据的回答。

## 未命中数据不等于工具失败

另一个 case 是“测试开发”。

mock 工具里没有预置这个岗位。

但工具返回了兜底结果：

```text
测试开发岗位暂无预置画像，请结合岗位 JD、项目经历和目标公司要求做针对性准备。
```

所以 Agent 继续基于这个兜底结果回答。

这不是工具失败。

这是工具设计里的 fallback。

从业务设计角度看，最好给工具返回加一个字段：

```json
{
  "found": false
}
```

这样 Agent 可以更明确地区分：

```text
查到了岗位画像
没有查到，只返回兜底建议
```

否则模型只能从文本语义里判断，很容易变得不稳定。

## 和自研 Agent 的对照

做完这一轮以后，我把 Dify 和 SuperAgentConsole 对了一下。

大概可以这样理解：

```text
Dify Tool Schema ≈ 自研 Tool Schema
Dify tool description ≈ Tool Router 的选择依据
agent_thought.tool ≈ tool_call_start.tool
agent_thought.tool_input ≈ tool_call_start.arguments
agent_thought.observation ≈ tool_call_result
agent_message ≈ final answer streaming
message_end.usage ≈ run usage summary
```

Dify 的优势是：

```text
工具配置快
Agent 编排快
运行链路由平台托管
适合快速做应用验证
```

自研项目的优势是：

```text
过程完全可控
timeline 更显式
错误兜底可以强约束
Tool Router / Handler 可以按业务深度定制
```

这不是谁替代谁的问题。

更像是两个视角。

一个看平台能力。

一个看运行机制。

## 这一阶段的收获

这次 Agent + Tool 实验让我对 Dify 的理解补齐了一块。

之前的 Chatflow 和 Workflow 更像是“人编排流程”。

Agent + Tool 则更接近“模型运行时决定是否调用外部能力”。

但它并不神秘。

拆开以后，依然是很工程化的几步：

```text
工具描述
参数 schema
模型选择
参数生成
接口执行
结果观察
最终回答
错误兜底
日志追踪
```

这也是我现在越来越明确的一点：

Agent 不是一个抽象口号。

它是一套运行系统。

真正值得学习的，不是“它看起来很智能”。

而是它在工程上怎样组织模型、工具、状态、日志和异常。

从这个角度看，Dify 帮我看到了平台化 Agent 的样子。

而我自己的 SuperAgentConsole，则帮我看到了 Agent 内部那条更细的执行线。
