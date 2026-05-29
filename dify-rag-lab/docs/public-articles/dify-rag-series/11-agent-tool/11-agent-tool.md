# 我给 Dify Agent 接了一个 Tool，终于看到它是怎么“动手”的

学完 Workflow 以后，我继续往下看 Agent。

前面已经跑过 Chat Assistant。

也跑过知识库 RAG。

还用 Chatflow 做了参数提取、IF/ELSE 分支和知识检索。

Workflow 里，我又试了一次从输入变量到两个 LLM 节点，再到最终输出的一次性任务编排。

这些东西都跑通之后，我其实已经能大概理解 Dify 的几种应用形态了。

但还有一个地方，我一直想看得更清楚：

Agent 到底是怎么调用工具的。

因为在我自己的 SuperAgentConsole 里，Tool 不是一个抽象概念。

我自己写过 Tool Router。

也写过 Tool Handler。

还把每一次 tool call、tool result、final answer 都落到了 timeline 里。

所以我很想知道，在 Dify 这种成熟平台里，这件事是怎么被封装起来的。

## 先做一个最小工具

这次我没有一上来接复杂业务接口。

我只做了一个很小的 mock 服务。

它叫：

```text
get_job_profile
```

作用也很简单：

```text
输入岗位类型
返回岗位画像、必备技能、面试重点
```

比如输入：

```json
{
  "job_type": "前端开发"
}
```

返回：

```json
{
  "job_type": "前端开发",
  "market_summary": "前端开发岗位当前更重视工程化能力、复杂业务交付能力、AI 应用接入能力和项目表达能力。",
  "required_skills": ["JavaScript", "Vue 或 React", "工程化", "性能优化", "AI 应用交互"],
  "interview_focus": ["项目表达", "手写题", "浏览器原理", "工程化经验", "AI 产品接入经验"]
}
```

这个工具不是为了模拟真实招聘市场。

它只是为了验证一件事：

```text
当用户问岗位画像时，Agent 会不会主动调用工具。
```

本地服务跑在：

```text
http://localhost:8787
```

但 Dify 是跑在 Docker 容器里的。

所以在 Dify 的 Tool 配置里，不能写 `localhost`。

要写：

```text
http://host.docker.internal:8787
```

这个细节之前在接 Jina API Key 的时候已经踩过一次。

容器里的 `localhost` 指向容器自己，不是我的宿主机。

## 自定义 Tool 不是随便填一个 URL

创建自定义工具的时候，我发现 Dify 不是让你随手填一个接口地址就完事。

它需要一个符合 OpenAPI / Swagger 规范的 schema。

也就是说，要把这个工具描述清楚：

```text
这个工具叫什么
它有什么接口
接口是什么 method
参数在哪里
参数类型是什么
这个接口是做什么的
```

这一步让我想起自己写 Tool Schema 的时候。

本质上都是同一件事：

不是让大模型凭感觉调用接口。

而是给它一份结构化的工具说明书。

Dify 把这件事做成了页面配置。

我自己的项目则是用代码和配置来写。

形式不同，但底层逻辑很接近。

## Agent mode 是 Function calling

我创建 Agent 应用后，看到 Agent 设置里显示：

```text
Agent mode：Function calling
```

一开始我有点疑惑。

这是不是说明豆包 Seed 这个模型只能使用 function call，不能使用 tool call？

后来理解下来，这个地方更像是 Dify 当前对工具调用能力的一种运行模式标识。

它说明 Dify 会用结构化函数调用的方式，让模型选择工具、生成参数，再执行工具。

对我这个实验来说，重点不是名字叫 function call 还是 tool call。

重点是：

```text
模型能不能基于工具描述决定调用工具
工具参数能不能生成对
工具结果能不能回到最终回答里
```

这些才是 Agent + Tool 真正要验证的东西。

## 页面里看不到，API 里看到了

第一次在预览窗口里问：

```text
查询一下后端开发岗位画像，然后告诉我应该重点准备什么。
```

页面返回了正常答案。

答案里也能看出来，它应该用了工具结果。

比如出现了：

```text
接口设计
数据库
缓存
消息队列
服务部署
```

但如果只看最终回答，其实只能猜。

真正让我确认工具调用发生的，是 streaming API。

Agent 应用虽然还是走：

```text
POST /v1/chat-messages
```

但它不支持 blocking。

blocking 请求会直接返回：

```json
{
  "code": "invalid_param",
  "message": "Agent Chat App does not support blocking mode",
  "status": 400
}
```

所以 Agent 要用 streaming。

而 streaming 里出现了一个新的事件：

```text
agent_thought
```

里面能看到：

```json
{
  "tool": "get_job_profile",
  "tool_input": "{\"get_job_profile\": {\"job_type\": \"后端开发\"}}"
}
```

工具返回结果在：

```text
agent_thought.observation
```

这一下就清楚了。

在 Dify 里，Agent 工具调用不是看 `retriever_resources`。

RAG 才看 `retriever_resources`。

Agent Tool 要看：

```text
agent_thought.tool
agent_thought.tool_input
agent_thought.observation
```

这个发现对我来说很关键。

因为它把 Dify 的 Agent 运行过程，从“看起来像调用了”，变成了“接口里确实有调用证据”。

## 日志里也有一个不太显眼的入口

一开始我以为 Dify 的日志与标注里看不到工具调用过程。

列表里主要是最终回答。

点进去也像是只看到内容。

后来我发现，在预览页面或者日志详情里，有一个比较小的追踪入口。

进去以后，可以看到类似这样的链路：

```text
LLM
↓
get_job_profile
↓
LLM
```

工具节点里还能看到 INPUT 和 OUTPUT。

这就比单纯看最终回答清楚很多。

不过从可观察性上说，它和我自己的 SuperAgentConsole 还是不一样。

Dify 是平台把过程藏起来，需要你去 trace 里看。

我的项目是从一开始就把 timeline 当作核心体验来设计。

比如：

```text
tool_call_start
tool_call_result
final_answer
```

每一步都是显式事件。

这不是说哪种一定更好。

而是它们面向的目标不一样。

Dify 更像是把复杂度封装起来，让用户能尽快搭出可用应用。

SuperAgentConsole 更像是把复杂度摊开，让我能理解 Agent 每一步到底发生了什么。

## 工具失败时，Agent 还是会想办法回答

我还做了一个失败实验。

把本机 mock 服务停掉，然后再问：

```text
查询一下产品经理岗位画像，然后告诉我应该重点准备什么。
```

这时工具肯定调不通。

Agent 的 `<think>` 里能看到它意识到工具调用出了问题。

但最终它没有直接告诉我“工具不可用”。

它还是基于模型自己的知识，整理了一份产品经理岗位准备建议。

这件事挺有意思。

从用户体验看，它没有让回答中断。

但从严谨性看，如果这是一个强依赖工具结果的业务场景，就有风险。

所以我在文档里记了一条：

如果业务要求所有岗位画像必须来自工具，就要在提示词里写得更严格：

```text
当工具调用失败时，必须明确说明工具不可用。
不要继续生成岗位画像。
```

这就是平台能力和业务约束之间的边界。

Dify 能帮你把工具调用跑起来。

但“失败时该不该兜底生成”，仍然需要你自己定义。

## 未预置岗位不是工具失败

还有一个 case 是“测试开发”。

我的 mock 里没有预置这个岗位。

但工具并没有报错。

它返回了一份兜底结果：

```text
测试开发岗位暂无预置画像，请结合岗位 JD、项目经历和目标公司要求做针对性准备。
```

所以 Agent 会继续基于这个兜底结果回答。

这不是编造。

也不是工具失败。

而是工具成功返回了一个 fallback。

这个小实验让我意识到，Tool 的返回设计也很重要。

最好显式加一个字段：

```json
{
  "found": false
}
```

这样 Agent 就能区分：

```text
查到了真实预置数据
还是只拿到了兜底说明
```

如果没有这个字段，模型只能从文本里猜。

## 这一步真正补上的认知

做完 Agent + Tool 之后，我对 Dify 的应用形态更完整了。

Chat Assistant 更像普通聊天。

Knowledge / RAG 解决“从已有资料里找答案”。

Chatflow 适合把对话过程拆成节点。

Workflow 适合一次性任务编排。

Agent + Tool 则更接近：

```text
用户提出任务
模型判断是否需要外部能力
模型生成工具参数
工具执行
模型基于工具结果回答
```

这一步让我重新看了自己做的 SuperAgentConsole。

当时我从零写 Tool Router、Tool Handler、AgentEvent，很多东西都显得有点笨。

但现在反过来看，那些“笨”的地方，其实让我真正看清了 Agent 的骨架。

Dify 把这些骨架封装成平台能力。

我自己的项目把这些骨架暴露成执行过程。

一个适合快速搭应用。

一个适合理解系统怎么跑。

这也是我学习 Dify 的意义。

不是为了证明自己从零写的东西更好。

也不是为了把所有东西都换成平台。

而是用成熟平台反过来校准自己的理解。

到这里，Dify 的 Agent + Tool 我算是跑通了第一圈。

下一步，才是真正进入更复杂的能力：

```text
MCP
外部工具生态
以及平台化 Agent 和自研 Agent 之间的边界
```

这一步没有让我觉得 Agent 更神秘。

反而让我觉得它更工程化了。

所谓智能体，并不是一个会魔法的聊天框。

它背后依然是：

```text
工具描述
参数生成
接口调用
结果回填
错误兜底
过程追踪
```

看清这些之后，Agent 才真正从概念，变成了工程。
