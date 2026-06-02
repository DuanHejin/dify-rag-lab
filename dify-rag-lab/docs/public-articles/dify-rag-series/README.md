# Dify / RAG 学习系列

> 系列定位：承接“重新部署自己”系列中 SuperAgentConsole 从 0 到 1 的实践，在自研 Agent 项目完成第一阶段后，反过来学习成熟 AI 应用平台 Dify，用它校准自己对 Chat Assistant、Workflow、Chatflow、Agent、Knowledge / RAG、API 和部署形态的理解。

## 系列文章规划

目录结构：每篇文章单独一个目录，目录内包含公众号、知乎、掘金三个版本，以及三张配图。配图统一命名为 `{文章编号和主题}-image-01.png` 到 `{文章编号和主题}-image-03.png`。

生成规则：文章内容由 Codex 生成；配图统一走 GPT 生成，保持和前文一致的图片风格，不使用 Codex 图片生成。

配图交接流程：在 `dify-rag-lab/docs/public-articles` 目录下执行以下命令，生成包含全系列文章资料的压缩包，然后把 `rag-docs.zip` 提供给 GPT 作为配图生成上下文。

```bash
zip -r rag-docs.zip dify-rag-series
```

### 1. 做完自己的 Agent 项目后，我为什么开始学习 Dify？

核心内容：

- SuperAgentConsole 第一阶段完成后的新问题
- 为什么需要找一个成熟平台做参照
- 本地 clone Dify 与 Docker Compose 启动
- 管理员账号初始化
- 接入豆包模型
- 源码和 Docker 镜像的区别
- 最小镜像升级流程
- `docker-compose` 与 `docker compose` 的差异
- `volumes` 为什么不能乱删

文件：

- `01-dify-local-deploy/01-dify-local-deploy.md`
- `01-dify-local-deploy/01-dify-local-deploy-zhihu.md`
- `01-dify-local-deploy/01-dify-local-deploy-juejin.md`
- `01-dify-local-deploy/01-dify-local-deploy-image-01.png`
- `01-dify-local-deploy/01-dify-local-deploy-image-02.png`
- `01-dify-local-deploy/01-dify-local-deploy-image-03.png`

### 2. Dify Chat Assistant 入门：从页面调试到 API 调用

核心内容：

- 创建“简单的求职聊天助手”
- 配置提示词与变量
- 调试与预览
- 单轮与多轮对话
- blocking / streaming API
- `conversation_id`
- 发布更新机制
- 日志、标注、监测
- 温度参数实验

文件：

- `02-chat-assistant/02-chat-assistant.md`
- `02-chat-assistant/02-chat-assistant-zhihu.md`
- `02-chat-assistant/02-chat-assistant-juejin.md`
- `02-chat-assistant/02-chat-assistant-image-01.png`
- `02-chat-assistant/02-chat-assistant-image-02.png`
- `02-chat-assistant/02-chat-assistant-image-03.png`

### 3. Dify 知识库 RAG 实战：从 Markdown 导入到第一次召回

核心内容：

- 为什么用自己的学习文档做知识库
- Embedding 模型接入
- 知识库创建
- 文档导入
- 文本分段与清洗
- 向量检索、全文检索、混合检索
- `retriever_resources`

文件：

- `03-knowledge-rag-first-retrieval/03-knowledge-rag-first-retrieval.md`
- `03-knowledge-rag-first-retrieval/03-knowledge-rag-first-retrieval-zhihu.md`
- `03-knowledge-rag-first-retrieval/03-knowledge-rag-first-retrieval-juejin.md`
- `03-knowledge-rag-first-retrieval/03-knowledge-rag-first-retrieval-image-01.png`
- `03-knowledge-rag-first-retrieval/03-knowledge-rag-first-retrieval-image-02.png`
- `03-knowledge-rag-first-retrieval/03-knowledge-rag-first-retrieval-image-03.png`

### 4. Dify RAG 踩坑实录：为什么我的知识库明明可用，却搜不出来

核心内容：

- Dify 1.14.1 hit-testing 页面渲染失败
- Network 里有 records，但页面报错
- `document.name = null` 导致前端 split 崩溃
- 升级到 1.14.2
- Weaviate / document_segments / index_node_id 排查
- `summary_index_setting.enable = null`
- Jina API Key 添加失败与 Docker 代理

文件：

- `04-rag-troubleshooting/04-rag-troubleshooting.md`
- `04-rag-troubleshooting/04-rag-troubleshooting-zhihu.md`
- `04-rag-troubleshooting/04-rag-troubleshooting-juejin.md`
- `04-rag-troubleshooting/04-rag-troubleshooting-image-01.png`
- `04-rag-troubleshooting/04-rag-troubleshooting-image-02.png`
- `04-rag-troubleshooting/04-rag-troubleshooting-image-03.png`

### 5. RAG 效果优化：分段、Top K、Rerank 到底怎么调

核心内容：

- 为什么 `\n\n` 分段导致 chunk 太碎
- 最大长度 1024 如何把语义单元硬切开
- 为什么命中标题但没有完整答案
- 按标题层级切分后的效果提升
- Top K、Score 阈值、混合检索权重
- Jina Rerank vs qwen3-rerank
- `reranking_enable=true` 才算真正启用
- 召回测试历史保留 `retrieval_model` 快照

文件：

- `05-rag-optimization/05-rag-optimization.md`
- `05-rag-optimization/05-rag-optimization-zhihu.md`
- `05-rag-optimization/05-rag-optimization-juejin.md`
- `05-rag-optimization/05-rag-optimization-image-01.png`
- `05-rag-optimization/05-rag-optimization-image-02.png`
- `05-rag-optimization/05-rag-optimization-image-03.png`

### 6. 把 RAG 接进应用：Chat Assistant + 知识库 + API 完整验证

核心内容：

- 把知识库绑定到聊天助手
- 修改提示词，让模型优先基于知识库回答
- 调试预览引用来源
- blocking API 中的 `retriever_resources`
- streaming API 中 `message_end` 才带 `retriever_resources`
- 无关问题 `retriever_resources=[]`
- 为什么下一步要学 Chatflow

文件：

- `06-rag-chat-assistant-api/06-rag-chat-assistant-api.md`
- `06-rag-chat-assistant-api/06-rag-chat-assistant-api-zhihu.md`
- `06-rag-chat-assistant-api/06-rag-chat-assistant-api-juejin.md`
- `06-rag-chat-assistant-api/06-rag-chat-assistant-api-image-01.png`
- `06-rag-chat-assistant-api/06-rag-chat-assistant-api-image-02.png`
- `06-rag-chat-assistant-api/06-rag-chat-assistant-api-image-03.png`

### 7. 我开始用 Chatflow 重做 RAG 应用，才理解“对话流程”是什么

核心内容：

- 为什么 Chat Assistant 后还要学习 Chatflow
- 最小 Chatflow：开始、LLM、回复
- LLM 节点中看到真实 prompts
- 接入知识检索节点
- LLM 上下文必须显式引用知识检索结果
- Chatflow API 仍然是 `/v1/chat-messages`
- `mode=advanced-chat`
- streaming 中的 `workflow_started`、`node_started`、`message`、`message_end`
- `conversation_id` 多轮对话

文件：

- `07-chatflow-rag-v1/07-chatflow-rag-v1.md`
- `07-chatflow-rag-v1/07-chatflow-rag-v1-zhihu.md`
- `07-chatflow-rag-v1/07-chatflow-rag-v1-juejin.md`
- `07-chatflow-rag-v1/07-chatflow-rag-v1-image-01.png`
- `07-chatflow-rag-v1/07-chatflow-rag-v1-image-02.png`
- `07-chatflow-rag-v1/07-chatflow-rag-v1-image-03.png`

### 8. 我给 Chatflow 加了 IF/ELSE，才发现 AI 应用不能什么都交给大模型

核心内容：

- 复制 Chatflow RAG V1 为 V2
- 参数提取节点
- `structured_output`
- `intent`、`job_type`、`days`、`weak_points`、`is_complete`
- `is_complete` 从字段完整判断变成意图与字段共同判断
- IF / ELIF / ELSE 分支
- 信息不足分支
- 无关问题兜底
- 用户补充信息后会重新从 Start 节点执行

文件：

- `08-chatflow-branching-v2/08-chatflow-branching-v2.md`
- `08-chatflow-branching-v2/08-chatflow-branching-v2-zhihu.md`
- `08-chatflow-branching-v2/08-chatflow-branching-v2-juejin.md`
- `08-chatflow-branching-v2/08-chatflow-branching-v2-image-01.png`
- `08-chatflow-branching-v2/08-chatflow-branching-v2-image-02.png`
- `08-chatflow-branching-v2/08-chatflow-branching-v2-image-03.png`

### 9. 学完 Chatflow 后，我用 Workflow 做了一个一次性任务编排

核心内容：

- Workflow 和 Chatflow 的入口差异
- Start 输入变量：`job_type`、`days`、`weak_points`
- LLM 1：提取准备重点
- LLM 2：生成准备计划
- 上游节点 `text` 传给下游节点
- End 节点决定最终输出
- 单节点调试和全链路调试的差异
- `<think>` 标签在页面中的折叠展示

文件：

- `09-workflow-basic/09-workflow-basic.md`
- `09-workflow-basic/09-workflow-basic-zhihu.md`
- `09-workflow-basic/09-workflow-basic-juejin.md`
- `09-workflow-basic/09-workflow-basic-image-01.png`
- `09-workflow-basic/09-workflow-basic-image-02.png`
- `09-workflow-basic/09-workflow-basic-image-03.png`

### 10. 调完 Workflow API 后，我才看清它和 Chatflow 的真正区别

核心内容：

- Workflow API：`POST /v1/workflows/run`
- blocking 请求与 `inputs`
- blocking 响应中的 `data.outputs.answer`
- streaming 事件：`workflow_started`、`node_started`、`text_chunk`、`workflow_finished`
- `text_chunk` 和 Chatflow `message` 的区别
- Workflow 日志的结果、详情、追踪
- Workflow 日志看执行过程，Chatflow 日志看对话结果
- 对自研 AgentEvent / Run Detail 的启发

文件：

- `10-workflow-api-logs/10-workflow-api-logs.md`
- `10-workflow-api-logs/10-workflow-api-logs-zhihu.md`
- `10-workflow-api-logs/10-workflow-api-logs-juejin.md`
- `10-workflow-api-logs/10-workflow-api-logs-image-01.png`
- `10-workflow-api-logs/10-workflow-api-logs-image-02.png`
- `10-workflow-api-logs/10-workflow-api-logs-image-03.png`

### 11. 我给 Dify Agent 接了一个 Tool，终于看到它是怎么“动手”的

核心内容：

- 创建“求职助手 Agent Tool”
- Agent mode：Function calling
- 自定义 OpenAPI Tool：`get_job_profile`
- 本机 mock 服务与 `host.docker.internal`
- Agent Chat App 不支持 blocking mode
- streaming 事件：`agent_thought`、`agent_message`、`message_end`
- `agent_thought.tool`、`tool_input`、`observation`
- 预览 / 日志详情追踪中的 LLM -> Tool -> LLM
- Tool 不可用、未知岗位 fallback、Prompt 约束边界
- Dify Tool 与 SuperAgentConsole Tool Router / Tool Handler / AgentEvent 对照

文件：

- `11-agent-tool/11-agent-tool.md`
- `11-agent-tool/11-agent-tool-zhihu.md`
- `11-agent-tool/11-agent-tool-juejin.md`
- `11-agent-tool/11-agent-tool-image-01.png`
- `11-agent-tool/11-agent-tool-image-02.png`
- `11-agent-tool/11-agent-tool-image-03.png`

### 12. 我把 Dify Chatflow 暴露成 MCP 服务，才发现它不是另一套魔法

核心内容：

- Dify 中看到的两个 MCP 入口：接入外部 MCP Server 与应用级 MCP Server
- 为什么先做应用级 MCP Server，而不是直接写外部 MCP Server
- 将“求职助手 Chatflow RAG V2”启用 MCP 服务
- MCP 服务端点与本地 8080 端口
- `curl` GET 返回 405 的含义
- Codex 作为 MCP Client 添加 `dify-chatflow-rag-v2`
- 自动审查模式导致权限审批卡住，默认权限模式下允许后调用成功
- Dify 日志与标注中能看到本次 MCP 调用
- Trace 中仍然执行用户输入、参数提取、IF/ELSE、知识检索、LLM、最终返回
- MCP 是外部标准入口，Chatflow 是内部业务编排
- MCP Tool / Resource / Prompt 的阶段性理解
- 暂停外部 MCP Server 实验，把 MCP 放回软件工程的抽象、封装、复用和边界里理解

文件：

- `12-mcp-chatflow-server/12-mcp-chatflow-server.md`
- `12-mcp-chatflow-server/12-mcp-chatflow-server-zhihu.md`
- `12-mcp-chatflow-server/12-mcp-chatflow-server-juejin.md`
- `12-mcp-chatflow-server/12-mcp-chatflow-server-image-01.png`
- `12-mcp-chatflow-server/12-mcp-chatflow-server-image-02.png`
- `12-mcp-chatflow-server/12-mcp-chatflow-server-image-03.png`

### 13. 学完 Dify 后，我准备换一个角度继续理解 Agent

核心内容：

- Dify 学习阶段收尾
- 从本地部署、Chat Assistant、RAG、Chatflow、Workflow、Agent Tool 到 MCP 的主线复盘
- Dify 作为成熟平台视角，SuperAgentConsole 作为自研 Runtime 视角
- 为什么 API 汇总和 Text Generator 暂时不再展开
- Dify 与 SuperAgentConsole 的概念对照
- 下一阶段转向 LangChain / LangGraph
- 用 Dify、SuperAgentConsole、LangGraph 做三方参照

文件：

- `13-dify-wrap-up/13-dify-wrap-up.md`
- `13-dify-wrap-up/13-dify-wrap-up-zhihu.md`
- `13-dify-wrap-up/13-dify-wrap-up-juejin.md`
- `13-dify-wrap-up/13-dify-wrap-up-image-01.png`
- `13-dify-wrap-up/13-dify-wrap-up-image-02.png`
- `13-dify-wrap-up/13-dify-wrap-up-image-03.png`
