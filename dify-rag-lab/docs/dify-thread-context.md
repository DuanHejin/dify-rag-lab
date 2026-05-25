# Dify / RAG 学习线程上下文

> 用途：这个文档用于在新的 Codex 线程中快速恢复上下文。新线程可以先阅读本文，再继续在 `/Users/duanhejin/personalProjects/dify-rag-lab` 项目中推进 Dify / RAG 学习与实验。

## 1. 背景

当前已有一个自研项目：`Super Agent Console`。

这个项目的目标是复刻轻量版公司 Agent 架构，已经实现或正在实现的核心能力包括：

- Nuxt3 / Vue3 前端页面
- Nitro Server API
- 双接口 Agent Run 链路
- `conversationId / messageId / runId / traceId`
- SSE 流式输出
- AgentEvent 协议
- Tool Schema
- Tool Router
- Skill Definition
- Tool / Skill 编排
- 豆包 Seed 2.0 Lite 模型接入
- Tool Call / Tool Result 回填
- Run Detail 页面
- Prisma + MySQL 落库
- Docker / K3S / GitHub Actions / GHCR 部署
- CLS 日志采集
- Access Code、Admin Code、限频、LLM Kill Switch 等公网防护能力

现在希望学习 Dify 和 RAG，不是单纯学一个低代码平台，而是要和自研 Super Agent Console 互相对照，理解：

- Dify 的 App、Workflow、Chatflow、Agent、Tool、Knowledge 分别对应自研项目里的什么概念
- Dify 如何快速搭建 AI 应用
- Dify 的可视化工作流和自研 Tool / Skill Workflow 的区别
- Dify 的知识库 / RAG 链路如何工作
- Dify 的 API、streaming event、conversation_id 如何使用
- 哪些能力适合用 Dify，哪些能力适合保留在自研项目中

## 2. 当前 Dify 项目位置

学习项目目录：

```text
/Users/duanhejin/personalProjects/dify-rag-lab
```

Dify 源码已拉取到该目录下，目录结构大致是：

```text
/Users/duanhejin/personalProjects/dify-rag-lab/dify
```

Docker Compose 目录：

```text
/Users/duanhejin/personalProjects/dify-rag-lab/dify/docker
```

## 3. 当前环境状态

已经完成：

- 已创建独立学习目录：`dify-rag-lab`
- 已拉取 Dify 项目源码
- 本地已安装并可用 Docker / Colima
- 已安装 Docker Compose
- 已通过 Docker Compose 启动 Dify
- 本地 Web 控制台可访问：`http://localhost:8080`
- 已完成 Dify 管理员账号初始化
- 已在 Dify 设置页接入豆包模型

补充说明：

- 电脑重启后，如果 Dify 无法访问，常见原因是 Colima / Docker daemon 没启动。
- 曾出现过报错：

```text
unable to get image 'busybox:latest': failed to connect to the docker API at unix:///Users/duanhejin/.colima/default/docker.sock
```

原因是 Docker daemon 没运行。

解决方式：

```bash
colima start
cd /Users/duanhejin/personalProjects/dify-rag-lab/dify/docker
docker compose up -d
```

如果当前环境中命令是新版 Docker Compose，也可以使用：

```bash
docker compose up -d
```

## 4. 已经讨论过的关键问题

### 4.1 是否应该在当前 Super Agent Console 会话里继续研究 Dify？

结论：

可以继续在同一个对话里讨论，因为上下文里已经有 Super Agent Console 的架构，方便做概念对照。

但文件不要混在 `super-agent-console` 仓库里，避免污染主项目。

建议使用独立目录：

```text
/Users/duanhejin/personalProjects/dify-rag-lab
```

如果新开 Codex 线程，应该以 `dify-rag-lab` 作为工作目录。

### 4.2 当前 Codex 为什么不能直接写入 `dify-rag-lab`？

原因：

当前 Codex 会话的工作区是：

```text
/Users/duanhejin/personalProjects/super-agent-console
```

沙箱只允许写当前工作区和临时目录，不允许直接写同级目录：

```text
/Users/duanhejin/personalProjects/dify-rag-lab
```

所以当前线程中如果生成 Dify 文档，需要先生成到：

```text
/private/tmp
```

再由用户手动复制到 `dify-rag-lab` 项目中。

### 4.3 Docker 和 Docker Compose 的区别

简单理解：

- Docker：负责运行单个容器
- Docker Compose：负责一次性编排和启动一组相关容器

Dify 不是一个单容器应用，它通常包含：

- web
- api
- worker
- db
- redis
- nginx
- sandbox
- vector database 等

所以 Dify 适合用 Docker Compose 启动。

### 4.4 Dify 最小镜像升级流程

当前本地 Dify 运行方式是 Docker Compose 拉取并启动官方镜像，例如：

```yaml
image: langgenius/dify-api:1.14.1
image: langgenius/dify-web:1.14.1
```

这表示实际运行的代码来自 Docker 镜像，而不是本地 `api/`、`web/` 目录里的源码。

因此：

- 只想升级正在运行的 Dify：优先改 Docker 镜像版本。
- 想阅读官方最新源码或做二开：再拉取官方源码 tag / branch。
- 改了本地源码但没有重新 build 自己的镜像：不会影响当前 Docker Compose 正在运行的 Dify。
- 真正二开部署：需要改源码、build 自己的镜像，再让 Compose 或服务器使用自己的镜像。

最小升级流程：

```bash
cd /Users/duanhejin/personalProjects/dify-rag-lab/dify/docker

# 1. 升级前备份配置和本地数据
cp docker-compose.yaml docker-compose.yaml.bak
cp .env .env.bak
tar -cvf volumes-backup.tgz volumes

# 2. 修改 docker-compose.yaml 中 Dify 核心镜像版本
# 例如把 langgenius/dify-api:1.14.1 改成 langgenius/dify-api:1.14.2
# 例如把 langgenius/dify-web:1.14.1 改成 langgenius/dify-web:1.14.2

# 3. 拉取新镜像并重启
docker compose down
docker compose pull
docker compose up -d
```

升级后优先验证：

- Web 控制台能正常打开。
- 原有管理员账号和应用配置仍然存在。
- 模型供应商配置仍然存在。
- 知识库文档仍然可用。
- RAG 召回测试页面能正常显示结果。
- API 调用 `/v1/chat-messages` 仍然可用。

注意：

- `docker compose pull` 只会拉取 `docker-compose.yaml` 中写明的新镜像版本。
- `volumes` 里保存了本地数据库、上传文件、向量库等数据，升级前建议备份。
- 不要轻易删除 `volumes`，否则可能丢失本地 Dify 数据。
- 如果 `origin` / `upstream` 都已经改成自己的 GitHub 仓库，直接 `git fetch --tags` 拉不到 Dify 官方 tag。需要源码对齐官方版本时，可以额外添加只读 remote，例如 `official=https://github.com/langgenius/dify.git`。

源码升级和镜像升级的区别：

| 操作 | 作用 |
| --- | --- |
| 修改 `docker-compose.yaml` 镜像版本并 `docker compose pull/up` | 升级实际运行的 Dify |
| `git fetch official --tags && git checkout 1.14.2` | 让本地源码切到官方 1.14.2 |
| 修改本地源码但不 build 镜像 | 不影响当前运行的 Dify |
| 修改源码并 build 自己的镜像 | 用于二开部署 |

### 4.5 之前 K3S 上的项目能不能用 Docker Compose 部署？

可以，但适用场景不同。

Docker Compose 更适合：

- 单机部署
- 本地开发环境
- 小型 demo
- 快速启动多个服务

K3S / Kubernetes 更适合：

- Pod / Service / Ingress
- 配置分离
- 滚动更新
- 更接近生产环境
- 后续扩展多副本、证书、日志、监控等能力

如果把 Super Agent Console 改造成 Docker Compose 部署，大概会包含：

- Nuxt 应用容器
- MySQL 容器
- Redis 容器，后续可选
- Nginx / Caddy / Traefik，后续可选

但当前 Super Agent Console 已经走 K3S，不需要回退到 Docker Compose。

## 5. 用户当前最核心的学习目标

用户希望完成一个 Dify demo 流程，学习 Dify 这个低代码可视化平台如何快速搭建 AI 应用。

目标不是只点页面，而是要完整验证：

1. 启动 Dify，并确认 Web 控制台可访问
2. 配置可用模型供应商，目前已接入豆包模型
3. 创建 5 类应用：
   - 文本生成应用
   - Chat Assistant
   - Agent 应用
   - Workflow
   - Chatflow
4. 创建一个知识库，导入 1-2 篇 Markdown 文档
5. 让 Chatflow 或 Chat Assistant 使用知识库回答问题
6. Agent 应用中注册一个简单 HTTP Tool 或 mock Tool，用于验证工具调用
7. 为每个应用生成 API Key
8. 给出 curl 调用命令
9. curl 分别验证：
   - blocking 返回
   - streaming 返回
   - conversation_id 多轮对话
   - workflow 节点执行结果
   - agent tool 调用结果
   - 知识库检索回答
10. 整理每种应用的：
   - API 路径
   - 请求体
   - 响应关键字段
   - streaming event 类型
11. 最后生成一份 Dify 与 Super Agent Console 的对照表：
   - Dify App / Workflow / Tool / Knowledge / Event
   - 对应自研项目里的 Agent Run / Tool Router / Skill Workflow / AgentEvent / Run Detail

## 6. 建议学习路线

建议不要一上来就研究 RAG 或 Agent，先按由浅到深的顺序来。

### 阶段 1：Chat Assistant

先创建一个最简单的聊天助手。

重点观察：

- Dify 如何维护 conversation
- blocking 和 streaming 的区别
- API 请求体怎么写
- streaming event 返回什么
- conversation_id 如何支持多轮对话

和自研项目对照：

- Dify Chat Assistant 类似 `Conversation + Message + AgentRun + SSE` 的平台封装版

### 阶段 2：Text Generator

创建一次性文本生成应用。

重点观察：

- 和 Chat Assistant 的区别
- 输入变量怎么传
- Prompt 怎么配置
- 是否有 conversation 概念

和自研项目对照：

- 更像一次简单的 AgentRun 或普通 LLM 调用

### 阶段 3：Knowledge / RAG

创建知识库，导入 Markdown 文档。

重点观察：

- 文档如何被切片
- 向量索引如何配置
- 检索参数在哪里设置
- 命中的文档片段如何影响回答
- 回答不好时应该怎么排查

和自研项目对照：

- Dify Knowledge 对应未来自研项目中的 `KnowledgeBase / Document / Chunk / Embedding / Retriever / Context Builder`

### 阶段 4：Workflow

创建一个低代码工作流。

建议 demo：

```text
输入 JD
↓
LLM 节点：提取岗位要求
↓
LLM 节点：生成准备计划
↓
End 输出
```

重点观察：

- 节点之间如何传递变量
- workflow_run_id 是什么
- 节点执行结果如何在 streaming 中体现

和自研项目对照：

- Dify Workflow 对应自研项目里的 Tool / Skill Workflow

### 阶段 5：Chatflow

创建带对话能力的流程。

建议 demo：

```text
用户问题
↓
知识库检索
↓
LLM 生成回答
↓
Answer 节点输出
```

重点观察：

- Chatflow 和 Workflow 的区别
- Chatflow 和 Chat Assistant 的区别
- Chatflow 中如何结合 RAG
- conversation_id 如何工作

和自研项目对照：

- Chatflow 更接近：Conversation + AgentRun + SkillWorkflow + Retrieval

### 阶段 6：Agent + Tool

创建 Agent 应用并注册简单工具。

建议 Tool：

- HTTP Tool
- mock Tool
- 调用一个简单接口，例如返回当前时间、随机数、天气 mock、岗位标签 mock

重点观察：

- Tool 的名称和描述如何影响模型调用
- Tool 参数 schema 怎么写
- 模型什么时候决定调用工具
- Tool result 如何回填给模型
- streaming 中是否能看到 tool call 相关事件

和自研项目对照：

- Dify Tool 对应自研项目里的 Tool Schema + Tool Router + Tool Handler

## 7. 个人工作区与后续文档规则

个人学习、实验和二开产物统一放在 Dify 仓库根目录下的个人工作区：

```text
/Users/duanhejin/personalProjects/dify-rag-lab/dify/dify-rag-lab
```

目录规则：

```text
dify-rag-lab/
├── README.md          # 个人工作区规则
├── docs/              # 学习文档、API 记录、概念对照表
├── experiments/       # Dify DSL、测试用例、实验配置
├── scripts/           # curl、初始化、辅助验证脚本
├── second-dev/        # 二开方案、补丁说明、源码阅读笔记
└── assets/            # 截图、流程图、导出文件
```

原则：

- 不把个人学习文档放进 Dify 官方 `docs/` 目录。
- 个人文档、实验材料、脚本和二开说明统一收口到 `dify-rag-lab/`。
- 真正二开源码时可以修改 `api/`、`web/`、`docker/` 等官方源码目录，但说明和验证记录仍放在个人工作区。

## 8. 后续要产出的文档

建议在 `dify/dify-rag-lab/docs/` 下维护这些文档：

```text
dify-rag-lab/docs/dify-learning-plan.md              # 总计划，完成一项勾一项
dify-rag-lab/docs/chat-assistant-api.md              # Chat Assistant API 验证记录
dify-rag-lab/docs/text-generator-api.md              # Text Generator API 验证记录
dify-rag-lab/docs/knowledge-rag.md                   # 知识库 / RAG 验证记录
dify-rag-lab/docs/workflow-api.md                    # Workflow API 验证记录
dify-rag-lab/docs/chatflow-api.md                    # Chatflow API 验证记录
dify-rag-lab/docs/agent-tool-api.md                  # Agent Tool 调用验证记录
dify-rag-lab/docs/dify-api-curl-cases.md             # curl 用例汇总
dify-rag-lab/docs/dify-vs-super-agent-console.md     # Dify 与自研项目对照表
```

## 9. 新 Codex 线程建议入口

新线程可以这样开始：

```text
请先阅读 dify-rag-lab/README.md、dify-rag-lab/docs/dify-thread-context.md 和 dify-rag-lab/docs/dify-learning-plan.md。
我已经在本地通过 Docker Compose 启动了 Dify，并且在设置页接入了豆包模型。
接下来请按计划从 Chat Assistant 开始，带我完成页面配置、API Key 生成、blocking/streaming curl 验证，并把完成项勾到 dify-rag-lab/docs/dify-learning-plan.md 中。
```

## 10. 当前下一步

下一步建议直接做：

```text
阶段 1：Chat Assistant
```

具体动作：

1. 在 Dify 控制台创建 Chat Assistant
2. 配置豆包模型
3. 写一个简单 System Prompt
4. 页面测试单轮和多轮对话
5. 生成 API Key
6. curl 验证 blocking
7. curl 验证 streaming
8. curl 验证 conversation_id 多轮
9. 整理 `dify-rag-lab/docs/chat-assistant-api.md`
10. 在 `dify-rag-lab/docs/dify-learning-plan.md` 中勾选已完成项
