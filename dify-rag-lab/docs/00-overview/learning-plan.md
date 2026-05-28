# Dify / RAG 学习计划

> 目标：用 Dify 搭建一套最小可验证的 AI 应用流程，同时和自研 Super Agent Console 的 Agent Run、Tool Router、Skill Workflow、AgentEvent、Run Detail 做概念对照。
>
> 使用方式：每完成一步，就把对应复选框从 `[ ]` 改成 `[x]`。

## 当前环境进度

- [x] 创建独立学习目录：`/Users/duanhejin/personalProjects/dify-rag-lab`
- [x] 拉取 Dify 项目源码
- [x] 启动 Colima / Docker daemon
- [x] 安装 Docker Compose
- [x] 使用 Docker Compose 启动 Dify
- [x] Web 控制台可访问：`http://localhost:8080`
- [x] 完成管理员账号初始化
- [x] 在 Dify 设置页接入豆包模型

## 阶段 1：Chat Assistant

目标：先理解 Dify 最基础的多轮对话应用。

- [x] 创建一个 Chat Assistant 应用
- [x] 选择已经配置好的豆包模型
- [x] 配置简单 System Prompt，例如“你是一个前端面试辅导助手”
- [x] 在控制台验证单轮对话
- [x] 在控制台验证多轮对话
- [x] 生成该应用的 API Key
- [x] 用 curl 验证 blocking 返回
- [x] 用 curl 验证 streaming 返回
- [x] 用 curl 验证 `conversation_id` 多轮对话
- [x] 记录 API 路径、请求体、响应关键字段、streaming event 类型

和 Super Agent Console 对照：

- Dify Chat Assistant 对应一个可直接对话的应用形态
- Super Agent Console 中更接近：`Conversation + Message + AgentRun + SSE`
- Dify 内部封装了会话、上下文和模型调用；自研项目需要自己显式设计这些对象

建议产出：

- [x] `dify-rag-lab/docs/01-chat-assistant/api.md`

## 阶段 2：Text Generator

目标：理解一次性文本生成应用和 Chat Assistant 的区别。

- [ ] 创建一个 Text Generator 应用
- [ ] 配置输入变量，例如 `jd_text`、`candidate_profile`
- [ ] 编写 Prompt：根据 JD 生成面试准备计划
- [ ] 在控制台验证一次性生成结果
- [ ] 生成该应用的 API Key
- [ ] 用 curl 验证 blocking 返回
- [ ] 用 curl 验证 streaming 返回
- [ ] 记录 API 路径、请求体、响应关键字段、streaming event 类型

和 Super Agent Console 对照：

- Dify Text Generator 更像一次无上下文的模型调用任务
- Super Agent Console 中可对应一次简单 `AgentRun`
- 如果不需要多轮对话、工具调用、知识库，Text Generator 是更轻的形态

建议产出：

- [ ] `dify-rag-lab/docs/text-generator-api.md`

## 阶段 3：Knowledge / RAG

目标：理解 Dify 知识库、文档切片、向量检索和回答生成的完整链路。

- [x] 创建一个知识库
- [x] 准备 1-2 篇 Markdown 文档
- [x] 导入 Markdown 文档
- [x] 观察 Dify 的分段 / 切片配置
- [x] 观察索引方式、检索方式、召回参数
- [x] 验证知识库召回测试：全文检索、向量检索、混合检索 + Rerank
- [x] 将知识库绑定到 Chat Assistant 或 Chatflow
- [x] 在控制台提问，验证回答是否来自知识库内容
- [x] 用 curl 验证知识库检索回答
- [x] 记录知识库配置、召回效果、命中文档片段

和 Super Agent Console 对照：

- Dify Knowledge 对应知识库管理 + 文档切片 + 向量化 + 检索召回
- Super Agent Console 当前还没有 RAG，可作为后续扩展模块
- 未来自研项目可拆成：`KnowledgeBase + Document + Chunk + Embedding + Retriever + Context Builder`

建议产出：

- [x] `dify-rag-lab/docs/02-knowledge-rag/lab.md`
- [x] `dify-rag-lab/docs/02-knowledge-rag/plan.md`

## 阶段 4：Workflow

目标：理解 Dify 的低代码工作流如何编排多个节点。

- [x] 创建一个 Workflow 应用
- [x] 添加输入变量，例如 `job_type`、`days`、`weak_points`
- [x] 添加第一个 LLM 节点：提取准备重点
- [x] 添加第二个 LLM 节点：生成准备计划
- [x] 配置节点之间的变量引用
- [x] 配置 End 节点输出
- [x] 在控制台验证工作流执行
- [x] 生成该应用的 API Key
- [x] 用 curl 验证 blocking 返回
- [x] 用 curl 验证 streaming 返回
- [x] 记录 workflow 节点执行结果和 streaming event 类型

和 Super Agent Console 对照：

- Dify Workflow 对应可视化节点编排
- Super Agent Console 中对应 `Tool Workflow / Skill Workflow`
- Dify 的节点是平台配置；自研项目当前是 TypeScript 配置文件

建议产出：

- [x] `dify-rag-lab/docs/04-workflow/plan.md`
- [x] `dify-rag-lab/docs/04-workflow/api.md`

## 阶段 5：Chatflow

目标：理解带会话能力的可视化流程，以及它和 Workflow、Chat Assistant 的关系。

- [x] 创建一个 Chatflow 应用
- [x] 配置用户输入节点
- [x] 接入知识库检索节点
- [x] 接入 LLM 节点
- [x] 接入 Answer 节点
- [x] 在控制台验证单轮对话
- [x] 在控制台验证多轮对话
- [x] 生成该应用的 API Key
- [x] 用 curl 验证 blocking 返回
- [x] 用 curl 验证 streaming 返回
- [x] 用 curl 验证 `conversation_id` 多轮对话
- [x] 记录 Chatflow 的 API 路径、请求体、响应关键字段、streaming event 类型
- [x] 复制 Chatflow RAG 为 V2，验证结构化参数提取、IF/ELSE、信息补全、intent 分流和无关问题兜底
- [ ] Chatflow V2 后续增强：检索结果为空分支、结构化变量传入最终 LLM、API 分支验证；当前暂缓，先进入 Workflow 阶段

和 Super Agent Console 对照：

- Dify Chatflow = 对话入口 + 可视化流程 + 可选知识库
- Super Agent Console 中更接近：`Conversation + AgentRun + SkillWorkflow + Retrieval`
- Chatflow 比 Chat Assistant 更适合解释“每一步怎么被编排”

建议产出：

- [x] `dify-rag-lab/docs/03-chatflow/api.md`
- [x] `dify-rag-lab/docs/03-chatflow/plan.md`

## 阶段 6：Agent + Tool

目标：验证 Dify Agent 如何选择并调用工具。

- [ ] 创建一个 Agent 应用
- [ ] 选择豆包模型
- [ ] 注册一个简单 HTTP Tool 或 mock Tool
- [ ] 为 Tool 配置名称、描述、参数 schema
- [ ] 编写 Prompt，让模型在合适场景下调用 Tool
- [ ] 在控制台验证 Tool 调用
- [ ] 观察 Tool 输入、Tool 输出和最终回答
- [ ] 生成该应用的 API Key
- [ ] 用 curl 验证 blocking 返回
- [ ] 用 curl 验证 streaming 返回
- [ ] 用 curl 验证 agent tool 调用结果
- [ ] 记录 Agent 应用的 API 路径、请求体、响应关键字段、streaming event 类型

和 Super Agent Console 对照：

- Dify Tool 对应自研项目中的 `Tool Schema + Tool Router + Tool Handler`
- Dify Agent 的工具选择由平台和模型共同完成
- Super Agent Console 当前显式保留了 Tool 白名单、参数校验、Tool/Skill 编排过程

建议产出：

- [ ] `dify-rag-lab/docs/agent-tool-api.md`

## 阶段 7：API 汇总

目标：把所有应用的 API 调用方式整理成可复用手册。

- [ ] 汇总 Chat Assistant API
- [ ] 汇总 Text Generator API
- [ ] 汇总 Workflow API
- [ ] 汇总 Chatflow API
- [ ] 汇总 Agent API
- [ ] 汇总 blocking 请求示例
- [ ] 汇总 streaming 请求示例
- [ ] 汇总 `conversation_id` 多轮对话示例
- [ ] 汇总 workflow 节点事件
- [ ] 汇总 agent tool 调用事件
- [ ] 汇总知识库检索回答示例

建议产出：

- [ ] `dify-rag-lab/docs/dify-api-curl-cases.md`

## 阶段 8：Dify 与 Super Agent Console 对照

目标：把 Dify 的低代码平台能力翻译成自研 Agent 项目的工程概念。

- [ ] 对照 Dify App 与 Super Agent Console Agent Run
- [ ] 对照 Dify Chat Assistant 与 Conversation / Message / SSE
- [ ] 对照 Dify Workflow 与 Skill Workflow
- [ ] 对照 Dify Chatflow 与 Conversation + Workflow + RAG
- [ ] 对照 Dify Tool 与 Tool Schema / Tool Router
- [ ] 对照 Dify Knowledge 与未来 RAG 模块
- [ ] 对照 Dify streaming event 与 AgentEvent
- [ ] 对照 Dify 日志 / Trace 能力与 Run Detail
- [ ] 总结 Dify 适合解决什么问题
- [ ] 总结自研 Super Agent Console 适合展示什么能力

建议产出：

- [ ] `dify-rag-lab/docs/dify-vs-super-agent-console.md`

## 最终验收清单

- [x] 本地 Dify 可以稳定启动和访问
- [ ] 至少创建 5 类应用：Text Generator、Chat Assistant、Agent、Workflow、Chatflow
- [x] 至少创建 1 个知识库并完成 RAG 问答
- [ ] 至少注册 1 个 Tool 并完成 Agent 工具调用
- [ ] 每类应用都有 API Key
- [ ] 每类应用都有 curl 示例
- [ ] blocking、streaming、多轮 conversation、workflow 节点、agent tool、RAG 检索都完成验证
- [ ] 完成 Dify 与 Super Agent Console 的概念对照表
