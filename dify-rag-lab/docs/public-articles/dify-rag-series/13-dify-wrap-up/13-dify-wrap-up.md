# 学完 Dify 后，我准备换一个角度继续理解 Agent

到这里，Dify 这条学习线基本可以收尾了。

我一开始学 Dify，并不是为了换一个平台做项目。

更不是为了把自己前面做的 SuperAgentConsole 推翻。

那时候我自己的 Agent 项目已经跑通了第一阶段。

能登录。

能调用模型。

能做 Agent Run。

能展示 Tool Router。

能记录 AgentEvent。

也能在 Run Detail 里看到一次执行过程。

但正因为自己从零做过一遍，我反而更想知道：

```text
成熟平台会怎么组织这些能力？
```

所以我开始学习 Dify。

这段时间不是简单点点页面。

而是把它当成一个成熟 AI 应用平台来拆。

## 我先从部署开始

最开始，我只是把 Dify clone 到本地。

然后通过 Docker Compose 跑起来。

接着创建管理员账号，接入豆包模型。

那时我遇到的第一个认知点，是源码和镜像的区别。

我本地虽然 clone 了 Dify 源码。

但 Docker Compose 真正跑起来的，是官方镜像。

也就是说：

```text
本地源码不等于当前运行代码
修改源码不等于修改线上服务
```

如果只是升级运行中的 Dify，改的是镜像版本。

如果要二开，才需要改源码、重新 build 自己的镜像。

这个点看起来简单。

但对后面理解部署、升级、数据持久化都很重要。

尤其是 `volumes`。

它保存着本地数据库、上传文件、向量库等数据。

不能随便删。

这一步让我先把 Dify 从“一个开源项目”理解成了“一个完整运行系统”。

## 然后是 Chat Assistant

第一个应用，我做的是一个简单求职聊天助手。

配置提示词。

配置变量。

调试预览。

多轮对话。

API 调用。

blocking。

streaming。

`conversation_id`。

发布更新。

日志与标注。

监测。

这些都跑了一遍以后，我对 Dify 的聊天应用有了比较明确的认识。

它不是只有一个输入框。

背后其实至少包含：

```text
Prompt
变量
模型配置
会话
消息
流式输出
日志
API
发布状态
```

尤其是发布更新。

如果只在编排页面改了提示词，不发布，API 不一定按最新版本走。

这个细节很像真实产品里的版本管理。

不是你在草稿里改了，用户就立刻看到。

## RAG 是最容易低估的一段

Chat Assistant 跑通以后，我开始接知识库。

我没有拿 Dify 源码做知识库。

而是用自己的学习文档。

因为我想验证的是：

```text
能不能根据我真实探索过程中的记录，查到真正有用的内容。
```

这一步比我想象中复杂。

Embedding 模型要接。

文档要导入。

分段要调。

清洗规则要看。

向量检索、全文检索、混合检索都要测。

Top K、Score 阈值、Rerank 也要理解。

我还遇到过页面显示文档可用，但召回不正常的情况。

后来升级 Dify 版本，又排查向量库、全文检索、页面渲染问题。

Jina API Key 一开始也添加失败。

最后发现是 Dify 容器没有走宿主机代理。

这些问题让我意识到：

```text
RAG 不只是把文档丢进去。
```

它是一个完整链路：

```text
文档
↓
清洗
↓
分段
↓
Embedding
↓
向量库
↓
召回
↓
Rerank
↓
上下文
↓
模型回答
```

任何一环不对，最终效果都会变差。

比如我一开始用 `\n\n` 分段。

结果 chunk 太碎。

有些问题能命中标题，却拿不到完整答案。

后来换切分规则以后，搜索准确性明显提高。

这一步让我对 RAG 的理解从“知识库问答”变成了“检索工程”。

## Chatflow 让我看到流程控制

接着我开始学 Chatflow。

先做了最小版本：

```text
开始
LLM
回复
```

后来接入知识检索节点。

我才发现，LLM 节点里不是自动就知道知识检索结果。

需要把知识检索节点的 `result` 放进 LLM 上下文。

这时它才能基于召回内容回答。

再往后，我复制出 Chatflow RAG V2。

加入参数提取节点。

加入结构化输出。

加入 IF / ELIF / ELSE。

判断用户是不是求职准备问题。

信息是否完整。

是不是 Dify / RAG 学习相关问题。

是不是天气这类不支持的问题。

这一步很关键。

它让我重新确认了一件事：

```text
AI 应用不能什么都交给大模型判断。
```

有些事情应该由模型判断。

比如从自然语言里提取岗位、天数、薄弱点。

有些事情应该由确定性节点判断。

比如 `is_complete=true` 才走知识检索。

比如无关问题直接走兜底。

这和写代码其实很像。

不是所有逻辑都塞进一个大模型提示词里。

该抽象的抽象。

该分支的分支。

该兜底的兜底。

## Workflow 让我看到一次性任务编排

学完 Chatflow 后，我又做了 Workflow。

Workflow 和 Chatflow 很像。

但它更偏一次性任务。

我做了一个简单流程：

```text
Start 输入 job_type / days / weak_points
↓
LLM 1 提取准备重点
↓
LLM 2 生成准备计划
↓
End 输出
```

Workflow 的 API 是：

```text
POST /v1/workflows/run
```

它不像 Chatflow 那样围绕多轮对话。

更适合：

```text
一次输入
多节点处理
一次输出
```

比如生成报告、做信息提取、做固定流程自动化。

这里我最关注的是日志。

Workflow 的日志里，点开某一次运行，可以看到：

```text
结果
详情
追踪
```

追踪里能看到每个节点的输入和输出。

这和我自己项目里的 Run Detail 很接近。

它们都在解决同一个问题：

```text
一次 AI 执行过程，不能只看最终答案。
```

必须能看到中间发生了什么。

## Agent + Tool 让我看到 Dify 怎么“动手”

后面我开始看 Agent。

我做了一个最小工具：

```text
get_job_profile
```

输入岗位类型，返回岗位画像、必备技能和面试重点。

在 Dify 里，自定义 Tool 不是随便填一个 URL。

它需要 OpenAPI Schema。

这和我自己写 Tool Schema 的感受很接近。

本质上都是：

```text
把外部能力结构化描述给模型
```

Dify Agent 应用里，豆包模型显示的是：

```text
Agent mode：Function calling
```

我在 streaming API 里看到了：

```text
agent_thought
tool
tool_input
observation
agent_message
message_end
```

这时我就能把它和 SuperAgentConsole 对起来：

```text
Dify Tool
↔
Tool Schema / Tool Router / Tool Handler / AgentEvent
```

Dify 把很多东西封装到了平台里。

而我自己的项目把这些过程拆开写在代码里。

视角不同。

但问题是同一个问题。

## MCP 是最后一个拼图

最后我看了 MCP。

一开始我以为 MCP 可能又是一套很新的东西。

后来发现，它并不神秘。

在 Dify 里，我看到了两个入口。

一个是：

```text
Dify 作为 MCP Client，连接外部 MCP Server
```

另一个是：

```text
Dify 把已有 Chatflow / Workflow 暴露成 MCP Server
```

我先做了第二种。

把 Chatflow RAG V2 暴露成 MCP 服务。

再用 Codex 作为 MCP Client 调用它。

中间还踩了一个权限问题。

Codex 在自动审查模式下，MCP 调用卡在审批那里。

换成默认权限以后，弹出确认，允许后正常调用。

真正让我确认链路的是 Dify 的日志与 Trace。

那里能看到：

```text
用户输入
参数提取
IF/ELSE
知识检索
LLM
最终返回
```

也就是说：

```text
Codex 调 MCP
↓
Dify 收到 MCP 调用
↓
仍然执行原来的 Chatflow
```

MCP 没有替代 Chatflow。

它只是把已有应用能力暴露给外部系统调用。

这一步让我把 MCP 理解成了：

```text
AI 应用时代的标准化能力入口
```

还是软件工程里的老问题：

```text
抽象
封装
复用
边界
权限
可观察性
```

只是现在调用方变成了 Agent 或 AI Client。

## 最后我做了一份对照总结

学完这些后，我又做了一份 Dify 和 SuperAgentConsole 的概念对照。

大概是这样：

```text
Dify App
↔ Agent 应用配置 / Agent Run 上层定义

Chat Assistant
↔ Conversation / Message / SSE

Workflow
↔ Skill Workflow

Chatflow
↔ Conversation + Workflow + RAG

Tool
↔ Tool Schema / Tool Router / Tool Handler

Knowledge
↔ RAG 模块

Streaming Event
↔ AgentEvent

Logs / Trace
↔ Run Detail

MCP
↔ 标准化能力入口 / Tool Provider
```

这份对照对我很重要。

因为它让我确认：

我不是在孤立地学一个平台。

我是在用成熟平台校准自己对 AI 应用工程的理解。

## Dify 这条线可以收尾了

现在回头看，Dify 这条线已经跑过了主干：

```text
本地部署
模型接入
Chat Assistant
API 调用
知识库 RAG
分段 / 召回 / Rerank
Chatflow
Workflow
Agent + Tool
MCP
日志与 Trace
和自研项目对照
```

当然，Dify 还有很多功能没有完全展开。

比如 Text Generator。

比如更复杂的插件。

比如外部 MCP Server。

比如更深入的企业部署。

但我不准备继续在这条线上无限扩展。

因为我这次学习 Dify 的目的不是做一份功能清单。

而是搞清楚：

```text
一个成熟 AI 应用平台，到底把哪些能力组织到了一起。
```

这个目标已经达到了。

## 下一步，我准备看 LangChain / LangGraph

Dify 是平台视角。

SuperAgentConsole 是自研项目视角。

接下来我想看代码框架视角。

所以我准备新起一个项目，研究 LangChain / LangGraph。

现在我更倾向于把重点放在 LangGraph。

因为我真正想研究的不是“怎么调一次模型”。

而是：

```text
状态怎么流转
节点怎么组织
工具怎么调用
分支怎么控制
事件怎么输出
Trace 怎么观察
多步骤 Agent 怎么稳定运行
```

这些问题，正好和前面学过的 Dify Chatflow、Workflow、Agent，以及我自己的 SuperAgentConsole 对上。

我希望下一阶段能形成三方对照：

```text
Dify：低代码平台怎么做
SuperAgentConsole：自己从零怎么做
LangChain / LangGraph：成熟代码框架怎么做
```

这可能比单独学某一个工具更有价值。

因为工具会变。

框架会变。

平台也会变。

但底层问题不会变。

一次 Agent 执行怎么开始。

状态怎么保存。

工具怎么调用。

失败怎么兜底。

过程怎么展示。

结果怎么复盘。

这些才是我真正想补齐的能力。

这段 Dify 学习没有让我立刻做出一个新产品。

但它让我知道，接下来该怎么继续学。

它像一个参照物。

帮我把前面自己写过的东西，和成熟平台里的概念对上。

接下来，就该换一个角度。

用代码框架再走一遍。

不是为了追新。

而是为了把 Agent 这件事，看得更清楚。
