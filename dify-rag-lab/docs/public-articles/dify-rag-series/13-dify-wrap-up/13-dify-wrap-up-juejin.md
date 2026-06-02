# Dify 学习实战 13：收尾复盘，以及为什么下一步转向 LangChain / LangGraph

这一篇是 Dify 学习系列的收尾。

前面已经从本地部署一路跑到了 MCP：

```text
Docker Compose 部署
模型接入
Chat Assistant
Knowledge / RAG
Chatflow
Workflow
Agent + Tool
MCP
Logs / Trace
SuperAgentConsole 对照
```

这条线到这里基本可以收尾。

本文主要做两件事：

```text
1. 复盘 Dify 主线学到了什么
2. 说明下一阶段为什么转向 LangChain / LangGraph
```

## 1. 学习 Dify 的目的

学习 Dify 不是为了换平台。

而是为了给自研项目找一个成熟参照。

我前面已经做过一个 SuperAgentConsole。

里面有：

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

但从零自研容易陷在自己的实现视角里。

所以需要看成熟平台怎么组织同类能力。

Dify 提供的是平台视角：

```text
应用创建
模型接入
Prompt 编排
知识库
Workflow / Chatflow
Tool
API
日志与 Trace
MCP
```

SuperAgentConsole 提供的是 Runtime 视角：

```text
一次 Run 怎么启动
Tool 怎么选
Tool 怎么执行
事件怎么落库
执行过程怎么展示
```

这两个视角互补。

## 2. 部署阶段：源码和镜像不是一回事

Dify 本地通过 Docker Compose 启动。

一开始最重要的认知是：

```text
clone 源码不等于运行源码
Docker Compose 跑的是镜像
```

如果当前 `docker-compose.yaml` 中写的是：

```yaml
image: langgenius/dify-api:1.14.2
image: langgenius/dify-web:1.14.2
```

那么实际运行代码来自镜像。

不是本地 `api/`、`web/` 目录。

所以：

```text
升级运行环境：改镜像版本并 pull
源码学习：checkout 对应 tag
二开部署：改源码后 build 自己的镜像
```

本地数据要注意 `volumes`：

```text
数据库
上传文件
向量库
本地持久化数据
```

不要随便删除。

## 3. Chat Assistant：最小聊天应用闭环

Chat Assistant 阶段验证了：

```text
Prompt
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

核心 API：

```text
POST /v1/chat-messages
```

关键点：

```text
修改提示词后需要发布更新
否则 API 不一定使用最新编排版本
```

这一阶段对应 SuperAgentConsole 中的：

```text
Conversation
Message
SSE response
Run log
```

## 4. RAG：知识库不是上传文档就结束

RAG 阶段验证了完整链路：

```text
Markdown 文档
↓
文本清洗
↓
文本分段
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
LLM 回答
```

核心配置包括：

```text
分段规则
Top K
Score 阈值
向量检索
全文检索
混合检索
Rerank 模型
```

踩过的典型问题：

```text
\n\n 分段导致 chunk 太碎
命中标题但没有完整答案
Jina API Key 添加失败
Dify 容器没有走宿主机代理
版本问题导致 hit-testing 页面异常
```

结论：

```text
RAG 效果不好，不一定是模型问题。
可能是分段、召回、Rerank、阈值、文档结构或向量入库问题。
```

## 5. Chatflow：对话式流程编排

Chatflow 阶段从最小流程开始：

```text
Start
↓
LLM
↓
Answer
```

后续加入：

```text
知识检索
参数提取
structured_output
IF / ELIF / ELSE
补充信息分支
暂不支持分支
```

一个关键点是：

```text
LLM 节点不会自动使用知识检索结果。
需要把知识检索 result 放进 LLM 上下文。
```

Chatflow RAG V2 的核心逻辑：

```text
if intent = job_prepare && is_complete = true:
  进入知识检索 / LLM
elif intent = job_prepare:
  回复补充信息
else:
  回复暂不支持
```

工程结论：

```text
AI 应用不能什么都交给大模型。
确定性分支仍然需要明确节点控制。
```

## 6. Workflow：一次性任务编排

Workflow 阶段做了一个面试准备计划生成流程：

```text
Start 输入 job_type / days / weak_points
↓
LLM 1：提取准备重点
↓
LLM 2：生成准备计划
↓
End 输出
```

Workflow API：

```text
POST /v1/workflows/run
```

blocking 响应核心字段：

```text
data.outputs.answer
```

streaming 中常见事件：

```text
workflow_started
node_started
text_chunk
node_finished
workflow_finished
```

Workflow 更适合：

```text
一次输入
多节点处理
一次输出
```

对应 SuperAgentConsole：

```text
Skill Workflow
```

## 7. Agent + Tool：工具调用链路

Agent 阶段创建了一个自定义 OpenAPI Tool：

```text
get_job_profile
```

输入：

```json
{
  "job_type": "后端开发"
}
```

输出：

```json
{
  "job_type": "后端开发",
  "market_summary": "...",
  "required_skills": [],
  "interview_focus": []
}
```

Dify 自定义 Tool 需要 OpenAPI Schema。

这对应自研项目中的：

```text
Tool Schema
```

Agent streaming 里能看到：

```text
agent_thought
tool
tool_input
observation
agent_message
message_end
```

对应 SuperAgentConsole：

```text
Tool Router
Tool Handler
Tool Result
AgentEvent
```

Agent Chat App 还验证了一个限制：

```text
Agent Chat App does not support blocking mode
```

也就是 Agent 应用需要用 streaming。

## 8. MCP：应用能力的标准化入口

MCP 阶段做的是应用级 MCP Server 实验。

实验链路：

```text
Chatflow RAG V2
↓
启用 MCP 服务
↓
Codex 作为 MCP Client 调用
↓
Dify 执行原 Chatflow
```

本地 endpoint：

```text
http://localhost:8080/mcp/server/JQy3oRVyReOPUyyk/mcp
```

普通 GET 返回：

```text
HTTP/1.1 405 METHOD NOT ALLOWED
```

说明 endpoint 存在，但 GET 不是 MCP 调用方式。

Codex 调用时还遇到权限模式问题：

```text
自动审查模式：卡在权限审批
默认权限模式：弹出确认，允许后调用成功
```

Dify 日志 Trace 中能看到：

```text
用户输入
参数提取
IF/ELSE
知识检索
LLM
最终返回
```

结论：

```text
MCP 没有替代 Chatflow。
MCP 是外部标准入口。
Chatflow 仍然是内部业务编排。
```

## 9. Dify 与 SuperAgentConsole 对照

最后整理了一份概念对照：

```text
Dify App
↔ Agent 应用配置 / Agent Run 上层定义

Chat Assistant
↔ Conversation / Message / SSE

Knowledge
↔ RAG 模块

Workflow
↔ Skill Workflow

Chatflow
↔ Conversation + Workflow + RAG

Tool
↔ Tool Schema / Tool Router / Tool Handler

Agent
↔ Agent Runtime / Tool Planning

Streaming Event
↔ AgentEvent

Logs / Trace
↔ Run Detail

MCP
↔ Tool Provider / 标准化能力入口
```

这个对照说明：

```text
Dify 适合看成熟平台如何产品化。
SuperAgentConsole 适合看 Agent Runtime 如何从代码层实现。
```

## 10. 为什么 API 汇总不单独做

原计划里有 API 汇总。

后来决定不单独整理。

原因是：

```text
Dify 页面已经提供各类应用 API 文档
当前主要 API 都已经在各阶段记录过
继续单独汇总收益不高
```

同理，Text Generator 也不单独学习。

它更像其他应用里的基础生成能力。

当前阶段不需要为了完整而完整。

## 11. 下一阶段：LangChain / LangGraph

Dify 学习收尾后，下一阶段计划研究：

```text
LangChain / LangGraph
```

当前理解：

```text
LangChain：模型、消息、Prompt、工具、RAG 等基础组件
LangGraph：有状态、多步骤、可分支的 Agent / Workflow 编排
LangSmith：Trace、调试、评估、观测
```

学习重点会放在 LangGraph。

因为真正需要继续深入的是：

```text
StateGraph
节点
边
条件分支
Agent Tool Loop
Streaming
Trace
```

这些正好可以和 Dify、SuperAgentConsole 做三方对照：

```text
Dify：低代码平台实现
SuperAgentConsole：自研 Runtime 实现
LangChain / LangGraph：代码框架实现
```

## 12. 最终总结

Dify 学习阶段最大的收获，不是记住某个页面怎么点。

而是把 AI 应用拆成了一组清晰模块：

```text
模型
Prompt
变量
会话
知识库
RAG
Workflow
Chatflow
Tool
Agent
MCP
API
Trace
部署
```

这些能力组合起来，才是一个完整 AI 应用平台。

现在 Dify 这条线可以收尾。

下一步不是继续堆功能。

而是换到代码框架视角，继续研究：

```text
如果不用 Dify 页面配置，
这些能力在 LangChain / LangGraph 里应该怎么组织？
```

这会是下一阶段的重点。
