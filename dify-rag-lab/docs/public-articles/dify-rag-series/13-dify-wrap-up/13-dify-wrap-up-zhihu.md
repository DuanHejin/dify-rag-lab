# 学完 Dify 以后，为什么我准备继续研究 LangChain / LangGraph？

Dify 这条学习线，到这里基本可以收尾了。

我一开始学习 Dify，不是为了换一个平台做项目。

更不是为了否定自己前面做的 SuperAgentConsole。

恰恰相反。

正是因为我自己从零做过一个 Agent 项目，才更需要一个成熟平台作为参照。

SuperAgentConsole 让我从代码层理解了：

```text
Agent Run
Tool Router
Tool Handler
AgentEvent
Run Detail
SSE
模型调用
工具结果回填
```

但自己做项目有一个问题：

很容易只站在自己的设计里看问题。

所以我需要反过来看成熟平台：

```text
成熟 AI 应用平台会怎么组织这些能力？
```

Dify 正好提供了这个参照。

## 我这次到底学完了哪些内容？

这次不是浅浅体验一下 Dify。

我基本把 Dify 的 AI 应用主干跑了一遍：

```text
本地部署
模型接入
Chat Assistant
API 调用
Knowledge / RAG
文档分段
向量检索
全文检索
混合检索
Rerank
Chatflow
Workflow
Agent + Tool
MCP
日志与 Trace
```

这些能力看起来分散。

但串起来之后，其实就是一个成熟 AI 应用平台的主干能力。

Dify 不只是一个“聊天机器人搭建工具”。

它更像是把很多 AI 应用需要的基础设施都做成了平台能力：

```text
模型
Prompt
变量
会话
知识库
流程编排
工具调用
外部访问
日志追踪
发布形态
```

学完这条线以后，我对 AI 应用的理解比之前更完整。

## 本地部署阶段补了什么认知？

最开始，我是通过 Docker Compose 启动 Dify。

这个阶段最重要的认知不是“怎么启动一个服务”。

而是源码和镜像的区别。

我本地 clone 了 Dify 源码，但 Docker Compose 跑起来的是官方镜像。

所以：

```text
本地源码不等于当前运行代码
修改源码不等于修改正在运行的服务
```

如果只是升级本地 Dify，通常改镜像版本即可。

如果要做二开，才需要改源码、重新 build 自己的镜像。

另一个重要点是 `volumes`。

它保存了：

```text
数据库
上传文件
向量库
本地持久化数据
```

不能随便删。

这个阶段让我先把 Dify 当成一个真实运行系统，而不是一个单纯的开源代码仓库。

## Chat Assistant 让我理解了聊天应用的基础闭环

第一个应用是一个简单求职聊天助手。

我在里面验证了：

```text
提示词
变量
调试预览
多轮对话
blocking API
streaming API
conversation_id
发布更新
日志与标注
监测
```

这里有一个很容易忽略的点：

在页面里修改提示词，不发布更新，API 不一定使用最新配置。

这说明 Dify 的应用不是“页面草稿即线上版本”。

它有发布状态。

这很接近真实产品里的版本管理。

Chat Assistant 阶段让我确认：

```text
聊天应用不只是一个输入框。
```

它背后至少需要：

```text
Prompt 管理
变量系统
会话管理
流式输出
API 访问
日志记录
版本发布
```

## RAG 阶段让我意识到，知识库不是把文档丢进去

RAG 是这次学习里踩坑最多的一段。

我没有拿 Dify 源码做知识库。

而是用自己的学习文档。

因为我想验证的是：

```text
能不能根据我真实探索过程中的记录，查到真正有用的内容。
```

这一步遇到过很多问题：

```text
Embedding 模型接入
文档导入
文本分段
清洗规则
向量检索
全文检索
混合检索
Rerank
召回测试
Docker 代理
版本升级
```

其中最典型的是分段。

一开始用 `\n\n` 分段，chunk 太碎。

有些问题能命中标题，却拿不到完整答案。

后来调整切分规则，搜索准确性明显提高。

这让我意识到：

```text
RAG 效果不好，不一定是模型不好。
```

它可能是：

```text
文档结构问题
切片问题
Embedding 问题
向量入库问题
召回策略问题
Rerank 问题
Top K 或阈值问题
```

RAG 不是一个按钮。

它更像是一条检索工程链路。

## Chatflow 和 Workflow 补上了流程编排视角

Chatflow 让我看到对话式流程编排。

我从最小的：

```text
开始 -> LLM -> 回复
```

逐步加到：

```text
参数提取
structured_output
IF / ELIF / ELSE
知识检索
LLM
补充信息分支
无关问题兜底
```

这个过程让我确认一个判断：

```text
AI 应用不能什么都交给大模型。
```

有些事情适合让模型做。

比如从自然语言里提取岗位、准备天数、薄弱点。

有些事情应该由确定性节点做。

比如信息是否完整。

比如是否走知识检索。

比如无关问题是否直接兜底。

Workflow 则是一次性任务编排。

它更像：

```text
Start 输入变量
LLM 1 提取重点
LLM 2 生成计划
End 输出
```

Chatflow 更偏对话。

Workflow 更偏任务。

这两个东西和我自己项目里的 Skill Workflow 有明显对应关系。

区别在于：

```text
Dify 是可视化编排。
SuperAgentConsole 是代码编排。
```

## Agent + Tool 让我看到 Dify 如何处理工具调用

Agent 阶段，我做了一个最小工具：

```text
get_job_profile
```

输入岗位类型，返回岗位画像和准备重点。

Dify 自定义 Tool 需要 OpenAPI Schema。

这和我自己写 Tool Schema 本质上是一回事：

```text
把外部能力结构化描述给模型。
```

Agent 应用的 streaming API 里，我看到了：

```text
agent_thought
tool
tool_input
observation
agent_message
message_end
```

这和 SuperAgentConsole 里的概念基本能对上：

```text
Dify Tool
↔ Tool Schema / Tool Router / Tool Handler

Dify agent_thought
↔ AgentEvent
```

Dify 的平台封装更完整。

自研项目的内部结构更透明。

二者视角互补。

## MCP 让我理解了标准化能力入口

最后一个阶段是 MCP。

这一步我没有深入写外部 MCP Server。

而是先做了一个更小的实验：

```text
把 Dify Chatflow RAG V2 暴露成 MCP 服务
用 Codex 作为 MCP Client 调用它
```

调用成功后，我在 Dify 日志与标注里看到完整 Trace：

```text
用户输入
参数提取
IF/ELSE
知识检索
LLM
最终返回
```

这证明：

```text
MCP 调用没有绕过 Chatflow。
它只是从外部触发了原来的 Chatflow 编排。
```

也就是说：

```text
MCP：外部标准入口
Chatflow：内部业务编排
```

这个结论很重要。

MCP 不是新一套魔法。

它解决的是：

```text
外部 AI Client 如何标准化调用已有能力。
```

从软件工程角度看，它仍然是：

```text
抽象
封装
复用
边界
权限
可观察性
```

只是场景变成了 AI 应用。

## 为什么我觉得 Dify 可以收尾？

因为我学习 Dify 的目标不是穷尽所有功能。

我的目标是理解一个成熟 AI 应用平台的主干能力。

现在这些主干已经跑通：

```text
部署
模型
对话
RAG
流程
工具
MCP
日志
Trace
和自研项目对照
```

剩下当然还有一些功能可以继续补。

比如 Text Generator。

比如更复杂的插件。

比如外部 MCP Server。

比如更完整的企业部署。

但继续做下去，收益会下降。

容易变成“为了完整而完整”。

所以我决定在这里收尾。

## 下一步为什么是 LangChain / LangGraph？

学 Dify 是平台视角。

做 SuperAgentConsole 是自研 Runtime 视角。

下一步，我想看代码框架视角。

也就是 LangChain / LangGraph。

我不准备只研究“怎么调一次模型”。

那已经不是重点。

真正值得研究的是：

```text
状态如何流转
节点如何组织
条件分支如何实现
工具调用如何循环
RAG 如何接入
streaming 如何输出
Trace 如何观察
```

这些问题正好能和 Dify、SuperAgentConsole 对上。

我希望下一阶段形成三方对照：

```text
Dify：低代码平台怎么做
SuperAgentConsole：自己从零怎么做
LangChain / LangGraph：成熟代码框架怎么做
```

这比单独学一个框架更有价值。

因为工具会变。

框架会变。

平台也会变。

但工程问题一直都在。

## 总结

这次 Dify 学习最大的收获，不是会点哪个按钮。

而是把 AI 应用拆成了一组更清晰的工程模块：

```text
模型
Prompt
变量
会话
RAG
Workflow
Chatflow
Tool
Agent
MCP
Trace
API
部署
```

这些能力组合起来，才是一个 AI 应用平台。

Dify 让我看到成熟平台怎么做。

SuperAgentConsole 让我知道自己从零能拆到哪里。

接下来 LangChain / LangGraph，可以继续回答另一个问题：

```text
如果用代码框架来组织这些能力，应该怎么做？
```

所以 Dify 不是终点。

它是一个参照物。

它让我知道，下一步该往哪里看。
