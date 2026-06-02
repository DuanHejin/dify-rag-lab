# LangChain / LangGraph 学习计划

> 用途：作为下一阶段新项目的起始计划，可复制到新的 Codex 对话中继续执行。
>
> 建议项目名：`langgraph-agent-lab`

## 1. 学习定位

前一阶段已经完成 Dify 学习主线：

```text
Dify：成熟平台视角
SuperAgentConsole：自研 Agent Runtime 视角
```

下一阶段学习 LangChain / LangGraph，重点不是重复做一个聊天 Demo，而是从代码框架角度重新理解：

```text
模型调用
Prompt
结构化输出
Tool Calling
RAG
状态流转
条件分支
多节点 Agent
Streaming
Trace / Observability
```

三方对照关系：

```text
Dify：低代码平台怎么组织 AI 应用
SuperAgentConsole：自己从零如何实现 Agent Runtime
LangChain / LangGraph：成熟代码框架如何抽象 Agent / Workflow
```

## 2. 当前已获得的技能和知识地图

进入 LangChain / LangGraph 阶段前，已经不再是从零理解 AI 应用。

当前已经有两条重要经验线：

```text
SuperAgentConsole：从代码层自己拆过 Agent Runtime。
Dify：从成熟平台层完整跑通过 AI 应用链路。
```

这意味着下一阶段学习 LangChain / LangGraph 时，不需要只停留在“怎么调用一次模型”，而是可以直接带着下面这些问题进入：

```text
成熟代码框架如何组织模型、工具、RAG、状态和事件？
它和 Dify 的可视化节点有什么对应关系？
它和自研 SuperAgentConsole 的 Runtime / Event / Tool Router 有什么对应关系？
哪些能力适合平台配置，哪些能力适合代码实现？
```

### 2.1 已掌握的 Dify 平台能力

已经在本地完成了 Dify 的一条完整学习主线：

```text
本地 Docker Compose 部署
模型供应商接入
Chat Assistant
知识库 / RAG
Chatflow
Workflow
Agent + Tool
MCP
API 调用
日志与 Trace
```

其中已经形成的关键理解：

- Dify App 是一个可发布、可 API 调用、可 Web App 访问、可暴露 MCP 服务的应用定义。
- Chat Assistant 适合普通多轮对话，重点是 `conversation_id`、Prompt、变量、API 和日志。
- Knowledge / RAG 不是单纯“上传文档”，而是文档清洗、分段、Embedding、向量库、检索、Rerank、上下文拼接和引用展示的完整链路。
- Chatflow 是“对话入口 + 流程编排”，适合做多轮问答、参数提取、IFELSE、知识检索和回答生成。
- Workflow 是“一次输入到一次输出”的任务流，适合批处理、报告生成、结构化任务和无多轮上下文的流程。
- Agent + Tool 体现的是模型根据任务决定是否调用外部工具，Dify 里通过 OpenAPI Schema 配置 Tool。
- MCP 可以把 Dify 应用暴露为标准化能力入口，让外部 MCP Client 复用这个应用。
- 日志与 Trace 很关键，不能只看最终回答，还要能看到节点执行、检索结果、工具调用和耗时。

### 2.2 已掌握的 RAG 经验

RAG 阶段已经验证过：

```text
导入真实学习文档
观察文本分段与清洗
调整 chunk 规则
接入 Embedding 模型
接入 Jina Rerank
测试向量检索、全文检索、混合检索
将知识库接入 Chat Assistant / Chatflow
通过 API 查看 retriever_resources
```

形成的关键结论：

- RAG 效果不好，不一定是模型问题。
- 文档结构、切分规则、chunk 大小、重叠长度、Embedding、Rerank、Top K、阈值都会影响召回。
- 用 `\n\n` 按段落切分 Markdown 时可能过碎，导致答案上下文不完整。
- 分段太碎或语义不完整时，应该重新分段，而不是只调 Top K。
- Rerank 可以明显提升相关性，但前提是候选召回里已经有相关内容。
- RAG 最小闭环应该是：

```text
query -> retrieve -> rerank -> context -> answer -> sources
```

下一阶段做 LangChain RAG 时，要优先复现这条链路，而不是一开始追求复杂向量库调优。

### 2.3 已掌握的 Chatflow / Workflow 经验

Chatflow 阶段已经跑通过：

```text
用户输入
参数提取
structured_output
IF / ELIF / ELSE
知识检索
LLM 回答
直接回复兜底
多轮对话
API 调用
Trace 观察
```

关键理解：

- 参数提取节点本质上是让模型输出结构化数据。
- IFELSE 节点适合把确定性逻辑从大模型里拿出来，用流程控制实现。
- “信息不完整时追问”可以通过分支和回复节点实现。
- 用户再次输入后，Chatflow 会重新从开始节点进入，不是从追问节点继续往后连线。
- Chatflow 的 API 和 Chat Assistant 同样使用 `/v1/chat-messages`，但返回里的 `mode` 是 `advanced-chat`。
- Chatflow streaming 会看到 `workflow_started`、`node_started`、`message`、`message_end`、`workflow_finished` 等事件。

Workflow 阶段已经跑通过：

```text
Start 输入字段
LLM 节点 1：提取准备重点
LLM 节点 2：生成准备计划
End 输出
blocking API
streaming API
日志 Trace
```

关键理解：

- Workflow 更接近“一次性任务管道”。
- Workflow API 是 `/v1/workflows/run`。
- Workflow 不依赖 `conversation_id` 做多轮上下文。
- 在 Trace 中能看到每个节点输入、输出、耗时和 token。
- 两个 LLM 串联时，前一个 LLM 的输出会作为后一个 LLM 的上下文，因此中间输出格式会直接影响后续质量。

下一阶段学习 LangGraph 时，可以把这些经验映射成：

```text
Dify Start -> LangGraph START / State 初始化
Dify LLM 节点 -> LangGraph node function + model call
Dify IFELSE -> conditional edge
Dify Knowledge -> retriever node
Dify End -> END / final state
Dify Trace -> LangSmith trace / 自定义 event log
```

### 2.4 已掌握的 Agent + Tool / MCP 经验

Agent + Tool 阶段已经验证：

```text
创建 Agent 应用
配置 Function Calling 模式
创建自定义 OpenAPI Tool
启动本地 mock 服务
让 Agent 调用 get_job_profile
观察 streaming API 中的 agent_thought
观察 tool_input / observation
验证工具异常时的兜底
验证普通问题可能过度调用工具
```

关键理解：

- Tool 不是普通函数名，而是“给模型看的能力说明 + 机器可执行的 Schema + 实际服务端接口”。
- Dify 自定义 Tool 通过 OpenAPI / Swagger Schema 描述。
- Agent 应用不支持 blocking mode，只支持 streaming。
- 工具调用过程在 API streaming 中比页面日志更容易观察。
- 工具结果需要结构清晰，否则模型会二次总结时产生重复或误读。
- 工具失败时，如果 Prompt 没有限制，模型可能会凭常识继续回答，因此需要明确工具失败兜底策略。

MCP 阶段已经验证：

```text
Dify Chatflow 可暴露为 MCP Server
Codex 可作为 MCP Client 调用 Dify Chatflow MCP
调用记录会进入 Dify 日志
Trace 中能看到 Chatflow 内部节点执行
MCP 服务适合做能力复用
```

形成的关键理解：

- MCP 的重点不是“又一种 HTTP API”，而是统一 AI Client 调用外部能力的协议。
- 它更像 AI 时代的能力复用接口。
- Dify 应用暴露为 MCP Server 后，可以被其他支持 MCP 的客户端复用。
- 这和传统软件工程里的 NPM 包、内部中台接口、微服务能力复用有相似性。

### 2.5 已掌握的自研 Agent Runtime 经验

SuperAgentConsole 阶段已经具备的工程经验：

```text
Agent Run
Tool Router
Tool Handler
Skill Workflow
AgentEvent
Run Detail / Timeline
SSE 流式响应
CLS 日志
GitHub Actions 自动部署
Docker / GHCR / K3S / MySQL / HTTPS
```

这条经验线的价值是：

- 已经知道一个自研 Agent Runtime 需要哪些底层对象。
- 已经知道为什么要记录事件，而不是只保存最终回答。
- 已经知道 Tool Call、Tool Result、Final Answer 应该被拆成可观察步骤。
- 已经踩过线上模型调用超时、服务器到模型平台链路不稳定的问题。
- 已经理解 AI 应用的工程问题不只在模型，也在部署、网络、日志、超时和可观测性。

下一阶段 LangGraph 学习要重点观察：

```text
LangGraph 是否天然提供类似 AgentEvent 的执行过程？
LangSmith 能否替代一部分 Run Detail / Timeline？
Tool Loop 的状态流转比自研 Tool Router 简化了什么？
什么时候应该用框架，什么时候应该保留自研控制权？
```

### 2.6 当前能力总结

当前已经具备的能力可以概括为：

```text
能用成熟平台搭建 AI 应用。
能理解 RAG 从文档到回答的完整链路。
能配置和调试 Chatflow / Workflow / Agent / Tool / MCP。
能通过 API 和 streaming event 理解应用运行过程。
能从自研 Runtime 视角理解 Tool、Event、Run、Trace。
能把低代码平台能力翻译成工程代码概念。
```

下一阶段要补齐的是：

```text
不用低代码页面，而是用代码框架实现同样的东西。
不用只看平台 Trace，而是自己理解状态图和事件流。
不用只配置 Tool，而是自己写 Tool Schema、Tool Executor 和 Tool Loop。
不用只上传知识库，而是自己写 Loader、Splitter、Retriever、Context Builder。
```

## 3. 当前官方体系理解

当前学习时建议把 LangChain 体系拆成三层：

```text
LangChain：模型、消息、Prompt、工具、RAG 等基础组件和预置 Agent。
LangGraph：有状态、多步骤、可持久化、可分支的 Agent / Workflow 编排。
LangSmith：Trace、调试、评估、观测和部署相关能力。
```

重点优先级：

```text
LangGraph > LangChain 基础组件 > LangSmith
```

原因：

- 已经通过 Dify 学过 Chatflow / Workflow / Agent。
- 真正需要继续深入的是代码层的状态图、节点、边、条件分支和工具调用。
- LangGraph 更适合对照 Dify Workflow / Chatflow 和 SuperAgentConsole 的 Skill Workflow / AgentEvent。

参考官方文档：

- LangGraph JS overview：https://docs.langchain.com/oss/javascript/langgraph
- LangGraph workflows and agents：https://docs.langchain.com/oss/javascript/langgraph/workflows-agents
- LangSmith observability：https://docs.langchain.com/langsmith/observability
- LangChain / LangGraph products overview：https://docs.langchain.com/oss/javascript/concepts/products

## 4. 项目目录建议

建议新项目目录：

```text
langgraph-agent-lab/
├── docs/
│   ├── 00-overview/
│   │   ├── learning-plan.md
│   │   └── thread-context.md
│   ├── 01-llm-basics/
│   ├── 02-structured-output/
│   ├── 03-tool-calling/
│   ├── 04-rag/
│   ├── 05-langgraph-basics/
│   ├── 06-branching/
│   ├── 07-agent-tool-loop/
│   ├── 08-streaming-events/
│   ├── 09-observability/
│   └── 10-comparison/
├── src/
└── README.md
```

每个模块仍然沿用 Dify 学习项目的文档角色：

```text
plan.md          学习计划和勾选清单
lab.md           实验记录、代码路径、关键结论
api.md           如果有 HTTP API 或事件流，再单独记录
config-notes.md  配置项复杂时再补
```

## 5. 阶段 1：最小 LLM 调用

目标：确认基础模型调用链路。

- [ ] 初始化项目
- [ ] 安装 LangChain / LangGraph 相关依赖
- [ ] 配置模型 API Key
- [ ] 完成一次最小 chat model 调用
- [ ] 记录输入消息和输出消息结构
- [ ] 对照 Dify Chat Assistant 的最小对话

建议实验：

```text
输入：我准备面试前端开发岗位，只有 3 天时间，应该怎么准备？
输出：中文结构化建议
```

关注点：

```text
Message 格式
System / Human / AI message
模型配置
错误处理
```

## 6. 阶段 2：Prompt 与结构化输出

目标：复现 Dify Chatflow 参数提取节点的能力。

- [ ] 写一个参数提取 Prompt
- [ ] 提取 `intent`
- [ ] 提取 `job_type`
- [ ] 提取 `days`
- [ ] 提取 `weak_points`
- [ ] 提取 `is_complete`
- [ ] 输出结构化 JSON
- [ ] 对照 Dify 参数提取节点的 `structured_output`

测试 Case：

```text
我想准备面试
前端开发，3 天，算法和项目表达比较弱
今天北京天气怎么样？
Dify 最小镜像升级流程是什么？
```

验收标准：

```text
能区分求职准备、Dify 学习问题和无关问题。
能判断信息是否完整。
输出 JSON 可被后续代码分支使用。
```

## 7. 阶段 3：Tool Calling

目标：用代码复现 Dify Agent + Tool 阶段的 `get_job_profile`。

- [ ] 定义 `get_job_profile` tool
- [ ] 输入参数：`job_type`
- [ ] 输出字段：`job_type` / `market_summary` / `required_skills` / `interview_focus`
- [ ] 让模型决定是否调用工具
- [ ] 记录 tool call 参数
- [ ] 记录 tool result
- [ ] 生成最终回答
- [ ] 对照 Dify `agent_thought.tool_input / observation`
- [ ] 对照 SuperAgentConsole 的 Tool Router / Tool Handler

测试 Case：

```text
查询一下后端开发岗位画像，然后告诉我应该重点准备什么。
帮我查一下这个岗位要准备什么。
今天北京天气怎么样？
```

验收标准：

```text
该调用工具时调用。
信息不足时追问。
无关问题不调用工具。
工具返回空或未知岗位时能兜底。
```

## 8. 阶段 4：RAG

目标：用代码复现 Dify Knowledge / RAG 的核心链路。

- [ ] 准备一组 Markdown 学习文档
- [ ] 实现文档加载
- [ ] 实现文本切分
- [ ] 接入 Embedding
- [ ] 接入向量库
- [ ] 实现向量检索
- [ ] 实现 Top K 控制
- [ ] 实现简单引用来源
- [ ] 可选：接入 Rerank
- [ ] 对照 Dify Knowledge 的分段、召回、`retriever_resources`

重点不要一开始追求复杂。

先跑通：

```text
query -> retrieve -> context -> answer -> sources
```

验收问题：

```text
Dify 最小镜像升级流程是什么？
Top K 设置为 3 代表什么？
MCP 服务在 Dify 里有什么作用？
```

## 9. 阶段 5：LangGraph 基础图

目标：理解 LangGraph 的 StateGraph、节点、边、状态流转。

- [ ] 定义最小 State
- [ ] 定义 Start 节点
- [ ] 定义 LLM 节点
- [ ] 定义 End
- [ ] 完成一次从输入到输出的图执行
- [ ] 观察每一步 state 如何变化
- [ ] 对照 Dify Workflow 的 Start / LLM / End

最小图：

```text
START
↓
analyze_input
↓
generate_answer
↓
END
```

关注点：

```text
State 是什么
节点函数输入输出是什么
边如何连接
图如何编译和执行
```

## 10. 阶段 6：条件分支

目标：用代码复现 Dify Chatflow 的 IF / ELIF / ELSE。

- [ ] 使用结构化输出识别 intent
- [ ] 根据 `is_complete` 判断是否继续
- [ ] 根据 `intent` 进入不同分支
- [ ] 完成求职准备分支
- [ ] 完成 Dify 学习 / RAG 分支
- [ ] 完成无关问题兜底分支
- [ ] 对照 Dify Chatflow RAG V2 的 IFELSE 节点

分支设计：

```text
if intent = job_prepare && is_complete = true:
  生成求职准备计划
elif intent = job_prepare && is_complete = false:
  追问补充信息
elif intent = dify_learning:
  走 RAG 检索回答
else:
  暂不支持
```

验收标准：

```text
代码分支稳定，不依赖 LLM 自行决定所有流程。
```

## 11. 阶段 7：Agent + Tool Loop

目标：用 LangGraph 实现一个可观察的 Agent Tool Loop。

- [ ] 定义 Agent 节点
- [ ] 定义 Tool 节点
- [ ] 判断是否存在 tool call
- [ ] 有 tool call 时进入 Tool 节点
- [ ] Tool result 回填给 Agent
- [ ] 无 tool call 时进入 END
- [ ] 对照 Dify Agent 的 LLM -> Tool -> LLM
- [ ] 对照 SuperAgentConsole 的 Tool Router

基本结构：

```text
Agent
↓
是否有 tool call？
├── 是：Tool -> Agent
└── 否：END
```

重点观察：

```text
循环如何停止
工具结果如何进入上下文
多次工具调用如何记录
错误如何处理
```

## 12. 阶段 8：Streaming 与事件

目标：建立自己的事件观察方式。

- [ ] 观察 LangChain / LangGraph streaming 输出
- [ ] 记录 token 流
- [ ] 记录节点开始 / 结束
- [ ] 记录工具调用开始 / 结束
- [ ] 设计类 AgentEvent 结构
- [ ] 对照 Dify `message` / `text_chunk` / `agent_thought`
- [ ] 对照 SuperAgentConsole AgentEvent

建议事件结构：

```text
run_started
node_started
model_call_started
model_token
tool_call_started
tool_call_finished
node_finished
run_finished
run_error
```

验收标准：

```text
不仅能看到最终回答，还能复盘执行过程。
```

## 13. 阶段 9：LangSmith / Observability

目标：理解 LangSmith 在调试、观测、评估上的作用。

- [ ] 接入 LangSmith tracing
- [ ] 查看一次 LLM 调用 trace
- [ ] 查看一次 Tool call trace
- [ ] 查看一次 LangGraph 多节点 trace
- [ ] 对照 Dify 日志与 Trace
- [ ] 对照 SuperAgentConsole Run Detail
- [ ] 初步了解 evaluation 能力

重点问题：

```text
LangSmith 能看到哪些信息？
Dify Trace 能看到哪些信息？
自研 Run Detail 还需要补哪些信息？
```

## 14. 阶段 10：三方对照总结

目标：把 Dify、SuperAgentConsole、LangGraph 放到一张工程地图里。

- [ ] 对照 Dify Workflow 与 LangGraph StateGraph
- [ ] 对照 Dify Chatflow IFELSE 与 LangGraph conditional edge
- [ ] 对照 Dify Agent Tool 与 LangChain / LangGraph Tool Calling
- [ ] 对照 Dify Knowledge 与 LangChain RAG
- [ ] 对照 Dify Logs / Trace 与 LangSmith
- [ ] 对照 SuperAgentConsole AgentEvent 与 LangGraph streaming
- [ ] 总结三者各自适合什么

预期结论方向：

```text
Dify：适合快速搭建和低代码产品化。
SuperAgentConsole：适合展示自研 Agent Runtime 能力。
LangChain / LangGraph：适合用代码框架实现可控 Agent / Workflow。
```

## 15. 不建议一开始做的事

暂时不要一上来做：

- 复杂多 Agent 协作。
- 生产级部署。
- 大规模评估。
- 复杂向量库调优。
- 外部 MCP / A2A 深入接入。
- 过早封装大量抽象。

先按最小实验走：

```text
一个节点
一个分支
一个工具
一个 RAG
一个图
一个事件流
```

每一步都能跑、能看、能记录，再继续扩展。

## 16. 新对话启动提示词

可以在新 Codex 对话中直接使用：

```text
我准备新建一个 langgraph-agent-lab 项目，用来学习 LangChain / LangGraph。

背景：
- 我已经完成了一个 SuperAgentConsole 自研 Agent 项目的第一阶段，里面有 Agent Run、Tool Router、Tool Handler、Skill Workflow、AgentEvent、Run Detail / Timeline、SSE、CLS 日志和部署链路。
- 我也完成了 Dify 学习项目，跑通过本地 Docker Compose 部署、模型接入、Chat Assistant、Knowledge / RAG、Chatflow、Workflow、Agent + Tool、MCP、API 调用和日志 Trace。
- 我已经理解 Dify 的低代码平台能力，也理解自研 Agent Runtime 的基本工程对象。
- 我现在想从代码框架角度，学习 LangChain / LangGraph 如何实现模型调用、结构化输出、Tool Calling、RAG、状态图、条件分支、Agent Tool Loop、Streaming 和 Trace。

我当前已经获得的关键经验：
- RAG 不是只上传文档，而是 Loader、Splitter、Embedding、Vector Store、Retriever、Rerank、Context Builder、Citation 的完整链路。
- Chatflow 的参数提取节点可以类比 structured output，IFELSE 节点可以类比代码里的条件分支。
- Workflow 可以类比一次性任务图，Start / LLM / End 可以映射到 LangGraph 的 START / node / END。
- Dify Agent + Tool 可以类比 LLM -> Tool Call -> Tool Result -> LLM final answer 的循环。
- MCP 可以理解为 AI 时代的标准化能力复用接口。
- 日志、Trace、Timeline 和事件流非常重要，不能只看最终回答。

请你按照以下方向帮我从零规划并实现：
1. 创建项目结构。
2. 先做最小 LLM 调用。
3. 再做 structured output。
4. 再做 tool calling。
5. 再做 RAG。
6. 再进入 LangGraph StateGraph、条件分支、Agent Tool Loop。
7. 每完成一步都记录到 docs 中。
8. 所有实验都要和 Dify / SuperAgentConsole 做概念对照。

请先读取本项目的学习计划，然后列出第一阶段要做什么。
```
