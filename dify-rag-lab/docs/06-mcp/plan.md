# MCP 学习计划

> 目标：在已经跑通 Agent + Tool 的基础上，理解 MCP 和普通 Tool / API Tool 的区别，观察 Dify 中 MCP 能力的入口和运行方式，并用一个最小实验判断 MCP 在当前学习阶段是否值得继续深入。
>
> 使用方式：每完成一步，就把对应复选框从 `[ ]` 改成 `[x]`。

## 1. 阶段定位

已经完成：

- [x] Chat Assistant：普通聊天、多轮、API
- [x] Knowledge / RAG：知识库、切片、召回、Rerank、RAG API
- [x] Chatflow：对话式流程、知识检索、参数提取、IF/ELSE
- [x] Workflow：一次性任务编排、输入变量、节点传递、API、日志追踪
- [x] Agent + Tool：自定义 OpenAPI Tool、Function calling、`agent_thought`、工具输入输出

本阶段重点：

```text
不是再做一个普通 HTTP Tool
而是搞清楚 MCP 这种“工具协议”到底解决什么问题
```

和前面阶段的关系：

```text
普通 Tool：Dify 直接根据 OpenAPI schema 调一个 HTTP 接口
MCP Client 入口：Dify 连接外部 MCP Server，使用外部工具 / 资源 / Prompt
MCP Server 入口：Dify 把已有 Chatflow / Workflow 等应用暴露成 MCP 服务
Agent：运行时根据任务决定是否使用外部能力
```

## 2. 学习目标

- [x] 理解 MCP 是什么
- [x] 理解 MCP Server / MCP Client 的关系
- [ ] 理解 MCP Tool、Resource、Prompt 的区别
- [ ] 区分 MCP 和 Dify 自定义 API Tool
- [x] 区分 MCP 和 Chatflow / Workflow 节点
- [x] 区分 MCP 和后端业务 API
- [x] 判断 Dify 当前提供的是 MCP Server 能力、MCP Client 能力，还是两者都有
- [x] 跑通一个最小 MCP 实验
- [x] 观察 MCP 调用在 Dify 日志 / Trace 中如何体现
- [ ] 对照 Super Agent Console 的 Tool Router / Tool Handler / AgentEvent

## 3. 先回答的核心问题

开始实操前，先把下面几个问题搞清楚。

- [x] MCP 是协议、平台功能，还是一种工具类型？
- [x] MCP Server 负责暴露什么能力？
- [x] MCP Client 负责连接谁、调用谁？
- [ ] MCP Tool 和 Dify 自定义 Tool 的区别是什么？
- [ ] MCP Resource 和知识库 RAG 的区别是什么？
- [ ] MCP Prompt 和 Dify Prompt / Prompt 模板的区别是什么？
- [x] Dify 里 MCP 服务入口到底对应哪一侧？（当前看到两类入口：外部 MCP Client 接入 + 应用级 MCP Server 暴露）
- [x] 当前本地 Dify 是否需要额外启动 MCP Server？
- [x] MCP 调用是否仍然表现为 Agent Tool 调用？

阶段结论要能用一句话回答：

```text
MCP 是把外部工具、资源和 Prompt 用标准协议暴露给 Agent / Client 的方式，不只是一个普通 HTTP API。
```

## 4. Dify MCP 页面观察

目标：先看清 Dify 页面中 MCP 能配置什么，不急着写代码。

- [x] 找到 Dify 中 MCP 相关入口
- [x] 截图或记录入口位置
- [x] 记录页面名称和说明文案
- [x] 观察是否需要配置 MCP Server 地址
- [x] 观察是否需要配置鉴权
- [ ] 观察是否能看到 Tools 列表
- [ ] 观察是否能看到 Resources 列表
- [ ] 观察是否能看到 Prompts 列表
- [ ] 观察是否能测试连接
- [x] 记录已看到的配置项含义

需要记录的问题：

```text
不同 MCP 入口分别更像 MCP Client，还是更像 MCP Server？
配置完成后，MCP 能力会被哪个应用使用？
Agent 应用能不能直接选择 MCP 工具？
Chatflow / Workflow 能不能使用 MCP 工具？
```

建议产出：

- [x] `dify-rag-lab/docs/06-mcp/config-notes.md`

## 5. 最小 MCP 实验设计

目标：先用最小成本验证 MCP。当前优先测试“应用级 MCP 服务”，再测试“外部 MCP Server 接入”。

### 5.1 优先实验：把 Chatflow RAG V2 暴露成 MCP Server

当前已经在 Chatflow / Workflow 应用配置栏中看到：

```text
MCP 服务
状态：已停用
服务端点 URL：**********
```

开启时需要填写：

```text
描述：解释此工具的功能以及 LLM 应如何使用它
```

优先原因：

- [x] 不需要先写外部 MCP Server
- [x] 可以直接复用已经跑通的 Chatflow RAG V2
- [x] 可以验证 Dify 应用是否能作为 MCP Server 对外暴露
- [x] 可以观察 Chatflow 的输入 / 输出如何映射成 MCP 工具

建议描述：

```text
这是一个 Dify / RAG 学习助手工具。它可以根据用户问题检索 dify学习知识库，并用中文回答与 Dify、RAG、Chatflow、Workflow、Agent Tool 学习记录相关的问题。当用户询问 Dify 学习过程、配置项、API 调用、知识库召回、镜像升级、Agent Tool 等内容时，应调用此工具。不要用它回答天气、闲聊或与 Dify 学习无关的问题。
```

需要测试：

- [x] 开启 Chatflow RAG V2 的 MCP 服务
- [x] 填写 MCP 服务描述
- [ ] 观察是否要求应用先发布
- [x] 记录生成的服务端点 URL
- [x] 用本机 curl 验证 MCP 服务端点可达（GET 返回 405，说明 endpoint 存在但不接受 GET）
- [ ] 观察是否展示参数配置
- [ ] 记录参数描述如何填写
- [x] 找一个 MCP Client 调用该服务端点
- [x] 验证它是否能返回 Chatflow 的回答
- [x] 查看 Dify 日志中是否记录 MCP 调用
- [x] 确认 MCP 调用会进入原 Chatflow 的 Trace 链路

实际调用结论：

```text
Codex 可以作为 MCP Client 调用 dify-chatflow-rag-v2。
但 Codex 会话需要使用“默认权限”模式。
如果选择“自动审查”模式，MCP 调用会卡在权限审批处，无法正常允许。
Dify 日志与标注中会记录这次外部 MCP 调用。
Trace 中可以看到用户输入、参数提取、IF/ELSE、知识检索、LLM 和最终回复节点。
这说明应用级 MCP Server 暴露的是整个 Chatflow 应用能力，而不是绕过 Chatflow 单独执行。
```

### 5.2 后续实验：外部 MCP Server 接入

优先实验方向：

```text
做一个最小 MCP Server
暴露一个工具：get_job_profile
输入 job_type
返回岗位画像
```

为什么继续用 `get_job_profile`：

- [x] 已经有普通 OpenAPI Tool 的对照样本
- [x] mock 数据结构已经确定
- [x] 可以直接比较普通 Tool 和 MCP Tool 的差异
- [x] 不需要重新设计业务场景

最小能力：

```text
Tool：get_job_profile
Input：job_type
Output：job_type / market_summary / required_skills / interview_focus
```

可选能力：

```text
Resource：job_profile_docs 或岗位说明资源
Prompt：job_prepare_prompt 或求职准备提示模板
```

本阶段先只做 Tool，Resource / Prompt 作为后续增强。

- [ ] 确定外部 MCP Server 实现方式
- [ ] 确定外部 MCP Server 运行地址
- [ ] 确定 Dify 如何连接外部 MCP Server
- [ ] 暴露 `get_job_profile` 工具
- [ ] 在 Dify 中完成连接
- [ ] 在 Dify 中看到 MCP Tool
- [ ] 让 Agent 调用 MCP Tool

## 6. 与普通 API Tool 对照实验

目标：同一个业务问题，分别用普通 API Tool 和 MCP Tool 跑一遍。

对照 Case：

```text
查询一下后端开发岗位画像，然后告诉我应该重点准备什么。
```

普通 API Tool 已验证：

```text
event：agent_thought
tool：get_job_profile
tool_input：{"job_type":"后端开发"}
observation：岗位画像 JSON
```

MCP Tool 需要观察：

- [ ] streaming 事件是否仍然是 `agent_thought`
- [ ] tool 名称是否不同
- [ ] tool_input 格式是否不同
- [ ] observation 格式是否不同
- [ ] 日志追踪中节点名称是否不同
- [ ] Dify 是否能展示 MCP Tool 的输入输出
- [ ] 最终回答是否能稳定使用 MCP Tool 结果

记录对照表：

| 对比项 | 普通 API Tool | MCP Tool |
| --- | --- | --- |
| 配置方式 | OpenAPI schema | 待验证 |
| 连接方式 | HTTP URL | 待验证 |
| 鉴权方式 | 待验证 | 待验证 |
| Dify 中展示 | Tool | 待验证 |
| streaming 事件 | `agent_thought` | 待验证 |
| trace 展示 | LLM -> Tool -> LLM | 待验证 |
| 适合场景 | 单个 HTTP 能力 | 待验证 |

## 7. API 与日志验证

目标：沿用 Agent + Tool 的观察方式，验证 MCP 调用过程。

- [ ] 用预览窗口测试 MCP Tool 调用
- [ ] 用 API streaming 测试 MCP Tool 调用
- [ ] 记录请求路径
- [ ] 记录请求体
- [ ] 记录关键 event
- [ ] 记录 tool / tool_input / observation
- [ ] 记录 message_end / usage
- [x] 查看日志与标注
- [x] 查看预览 / 日志详情的追踪 tab
- [ ] 对比普通 API Tool 的 trace

当前候选 MCP Client：

```text
Codex CLI
```

添加命令：

```bash
/Applications/Codex.app/Contents/Resources/codex mcp add dify-chatflow-rag-v2 \
  --url http://localhost:8080/mcp/server/JQy3oRVyReOPUyyk/mcp
```

注意：该命令会写入 `~/.codex/config.toml`，可能需要新开 Codex 会话才能加载。

预计仍然使用：

```text
POST /v1/chat-messages
response_mode = streaming
```

需要验证：

```text
MCP Tool 是否仍然属于 Agent Chat App 的工具调用体系。
```

建议产出：

- [ ] `dify-rag-lab/docs/06-mcp/api.md`

## 8. 错误与边界实验

目标：观察 MCP 失败场景和普通 Tool 是否一致。

- [ ] MCP Server 未启动时，Dify 页面如何提示
- [ ] MCP Server 未启动时，Agent 如何回复
- [ ] MCP Tool 参数缺失时，Agent 是否追问
- [ ] MCP Tool 返回空结果时，Agent 是否编造
- [ ] MCP Tool 返回错误时，Agent 是否能兜底
- [ ] 普通问题是否会过度调用 MCP Tool
- [ ] Prompt 能否约束 MCP Tool 调用边界

建议 Case：

```text
帮我查一下这个岗位要准备什么。
查询一下后端开发岗位画像，然后告诉我应该重点准备什么。
查询一下不存在岗位画像，然后告诉我应该重点准备什么。
今天北京天气怎么样？
```

## 9. 和 Super Agent Console 对照

目标：把 MCP 放回自研 Agent 项目的工程概念里。

- [ ] 对照 MCP Server 与自研 Tool Provider
- [ ] 对照 MCP Tool 与 Tool Schema
- [ ] 对照 MCP Client 与 Tool Router / Tool Executor
- [ ] 对照 MCP Resource 与未来 RAG / 文件资源模块
- [ ] 对照 MCP Prompt 与 Prompt Template
- [ ] 对照 MCP 调用事件与 AgentEvent
- [ ] 总结 MCP 能减少自研项目中哪些接入成本
- [ ] 总结 MCP 不能替代哪些业务控制逻辑

初步理解：

```text
MCP 更像工具和上下文能力的标准接入协议。
它可以降低外部工具接入成本。
但工具选择策略、权限控制、失败兜底、业务编排和可观察性，仍然需要 Agent 平台或自研系统来负责。
```

## 10. 阶段验收清单

- [x] 能用自己的话解释 MCP 是什么
- [ ] 能说清 MCP 和普通 API Tool 的区别
- [x] 能说清 MCP Server / MCP Client 的关系
- [x] 能在 Dify 中找到 MCP 相关入口
- [x] 能完成一个最小 MCP 连接或明确记录当前阻塞点
- [ ] 能让 Agent 使用 MCP Tool，或明确说明当前版本 / 环境为什么不能
- [x] 能通过 API 或日志看到 MCP 调用过程
- [ ] 能总结 MCP 对 Dify 和 Super Agent Console 的意义

## 11. 当前阶段预期产出

- [x] `dify-rag-lab/docs/06-mcp/plan.md`
- [ ] `dify-rag-lab/docs/06-mcp/api.md`
- [x] `dify-rag-lab/docs/06-mcp/lab.md`
- [x] 如配置项复杂，再补 `dify-rag-lab/docs/06-mcp/config-notes.md`

## 12. 下一步操作

建议下一步先做：

```text
进入 Dify 页面，找到 MCP 相关入口，截图或记录页面配置项。
```

暂时不急着写 MCP Server。

先确认 Dify 当前 MCP 能力到底是：

```text
作为 MCP Client 连接外部 MCP Server
还是作为 MCP Server 对外暴露自身应用 / 工具
还是两类能力都有
```

这个判断清楚以后，再决定最小实验怎么做。
