# Dify RAG 学习实战 01：做完自己的 Agent 项目后，我为什么开始学习 Dify？

前面一段时间，我把自己的 SuperAgentConsole 项目从 0 推到了一个阶段性可用状态。

这条链路大概包括：

```txt
Nuxt3 项目
Docker 镜像
GHCR
GitHub Actions
K3S
ConfigMap / Secret
HTTPS
CLS 日志
豆包模型接入
Agent Run
Tool Router
Skill Workflow
AgentEvent
Run Detail 执行回放
```

从自研 Agent 产品的角度看，这个阶段已经不只是本地 demo。

域名能访问。

登录能跑。

数据库能写。

日志能查。

Agent 能进入真实模型调用。

前端也能看到一次 Run 的执行过程。

但项目做到这里之后，我没有马上继续往里面堆功能。

因为我开始意识到一个问题：

```txt
如果一直只看自己的实现，很容易陷入自己的抽象里。
```

我知道自己的 Tool Router 为什么这样设计。

我知道 Skill Workflow 为什么要拆成几个阶段。

我知道 AgentEvent 为什么要落库。

我也知道 Run Detail 页面为什么要把每一步执行过程展示出来。

但这些设计到底是不是成熟 AI 应用平台里的常见做法？

有没有更通用的产品形态？

成熟平台会怎么处理：

```txt
应用类型
模型供应商
知识库
工作流
Agent
API
日志
监测
```

这些问题，继续闷头写自己的项目，很难回答。

所以我决定开始学习 Dify。

这不是为了替代自己的项目，而是为了找一个成熟平台做参照。

## 1. 为什么在这个阶段学习 Dify

以前看 Dify，更多是从功能介绍角度理解：

```txt
可以做聊天助手
可以做 Workflow
可以接知识库
可以做 Agent
可以开放 API
```

但做完 SuperAgentConsole 第一阶段后，再看 Dify，关注点会发生变化。

我更关心的是：

```txt
Dify 怎么抽象应用类型？
Dify 怎么管理模型供应商？
Dify 怎么组织知识库和 RAG？
Chat Assistant 和 Chatflow 有什么区别？
Workflow 和我自己的 Skill Workflow 有什么差异？
API 返回结构如何设计？
日志、标注、监测能看到什么？
```

也就是说，我不是从零开始看 Dify。

而是在自己做过一遍 Agent 项目之后，用 Dify 来校准自己的理解。

SuperAgentConsole 是自研实践。

Dify 是成熟平台参照。

这两个视角放在一起，才能更清楚地理解 AI 应用平台该怎么设计。

## 2. 先把 Dify 在本地跑起来

学习一个平台，第一步还是先跑起来。

我把 Dify clone 到本地：

```bash
git clone --depth 1 https://github.com/langgenius/dify.git
```

本地目录大概是：

```txt
~/personalProjects/dify-rag-lab/dify
```

Docker Compose 目录是：

```txt
~/personalProjects/dify-rag-lab/dify/docker
```

启动后访问：

```txt
http://localhost:8080
```

然后完成管理员账号初始化。

这一步本身不复杂。

但 Dify 跑起来之后，可以很直观看到：

```txt
Dify 不是一个单体前端项目
Dify 也不是一个单独后端服务
Dify 是一组服务组成的平台
```

背后至少涉及：

```txt
web
api
worker
db
redis
nginx
sandbox
vector database
```

这也是为什么 Dify 适合用 Docker Compose 启动。

它不是启动一个 dev server。

而是启动一套 AI 应用平台。

## 3. Docker Compose 不是附属知识

以前我会把 Docker Compose 当成部署工具。

但这次跑 Dify 后，它的角色更清楚了。

Docker 负责运行单个容器。

Docker Compose 负责编排一组容器。

Dify 这种平台型应用天然是多服务协同：

```txt
web 提供前端控制台
api 提供后端接口
worker 处理异步任务
db 存储应用配置和业务数据
redis 做缓存和队列
vector database 支撑知识库检索
nginx 统一入口
sandbox 处理隔离执行
```

所以执行：

```bash
docker-compose up -d
```

启动的不是一个“项目”。

而是一套系统。

这点对自研 Agent 项目也有参考意义。

一个 AI 平台真正跑起来后，不会只剩业务代码。

基础设施本身就是系统的一部分。

## 4. 源码和镜像不是一回事

本地部署 Dify 时，第一个需要分清的概念是：

```txt
源码 != 当前运行代码
```

我已经把 Dify 源码 clone 到本地了。

但默认 Docker Compose 启动时，真正运行的是 `docker-compose.yaml` 中指定的镜像。

例如：

```yaml
image: langgenius/dify-api:1.14.1
image: langgenius/dify-web:1.14.1
```

也就是说，容器里跑的是官方已经构建好的镜像。

本地 `api/`、`web/` 目录里的源码不会自动参与运行。

如果修改了本地源码，但没有重新 build 自己的镜像，运行中的 Dify 不会受到影响。

这里可以分成两种模式：

```txt
学习 / 部署官方 Dify：
使用 Docker Compose + 官方镜像

二开 Dify：
修改源码 + 构建自定义镜像 + 部署自定义镜像
```

这两种模式不要混在一起。

之前做 SuperAgentConsole 时，我已经搭过自己的镜像发布链路：

```txt
GitHub Actions
↓
构建 Docker 镜像
↓
推送 GHCR
↓
服务器拉取镜像
↓
K3S 更新服务
```

所以再看 Dify 时，这个关系会更清楚：

```txt
源码：开发材料
镜像：运行实体
volumes：系统状态
```

## 5. 升级 Dify 时再次验证了这个判断

后面测试知识库 RAG 时，我遇到了一个页面渲染问题。

知识库实际有召回结果。

但页面展示时报错。

继续查后发现，官方新版本已经修复了相关问题。

所以需要把 Dify 从 `1.14.1` 升级到 `1.14.2`。

这里一开始容易想到：

```txt
是不是要拉官方源码 tag？
是不是要切到 1.14.2 分支？
```

但如果只是升级正在运行的本地 Dify，最小动作其实是改镜像版本。

把 `docker-compose.yaml` 里的核心镜像从：

```yaml
langgenius/dify-api:1.14.1
langgenius/dify-web:1.14.1
```

改成：

```yaml
langgenius/dify-api:1.14.2
langgenius/dify-web:1.14.2
```

然后执行：

```bash
docker-compose down
docker-compose pull
docker-compose up -d
```

如果本机支持新版 Compose 插件，也可能是：

```bash
docker compose down
docker compose pull
docker compose up -d
```

但我的环境中使用 `docker compose` 会报：

```txt
docker: unknown command: docker compose
```

说明当前可用的是旧版独立命令 `docker-compose`。

所以最终使用：

```bash
docker-compose down
docker-compose pull
docker-compose up -d
```

## 6. 升级不是 web 变了就结束

升级后，需要确认实际运行的镜像。

可以执行：

```bash
docker-compose images
```

我第一次检查时发现，并不是所有核心服务都变成了 `1.14.2`。

当时大概是：

```txt
web              1.14.2
worker           1.14.2
api              1.14.1
api_websocket    1.14.1
worker_beat      1.14.1
```

这说明只改了一部分镜像版本。

Dify 的多个服务都会使用 `langgenius/dify-api` 镜像。

如果只改了 worker，没有改 api、api_websocket、worker_beat，就会出现混合版本。

这类问题很容易被忽略。

因为页面可能已经能打开。

但后台部分服务还是旧版本。

最后我把所有核心服务统一成：

```txt
langgenius/dify-api:1.14.2
langgenius/dify-web:1.14.2
```

再重新执行：

```bash
docker-compose pull api api_websocket worker worker_beat web
docker-compose up -d --force-recreate api api_websocket worker worker_beat web
```

然后再次检查镜像版本。

这一步之后，Dify 才算真正完成升级。

## 7. volumes 不能乱删

升级前，需要备份配置和数据。

我当时备份了：

```bash
cp docker-compose.yaml docker-compose.yaml.bak
cp .env .env.bak
tar -cvf volumes-backup.tgz volumes
```

这里最关键的是：

```txt
volumes
```

因为本地 Dify 的数据库、上传文件、向量库等数据都在这里。

容器可以删了重建。

镜像可以重新拉。

但 volumes 不能随便删。

对学习环境来说，删了可能只是重新配置。

但对真实私有部署来说，删错 volumes 就是数据事故。

这和 K3S / MySQL / PVC 的思路类似：

```txt
服务可以替换
状态要保护
```

所以升级前至少要做三件事：

```txt
备份 docker-compose.yaml
备份 .env
备份 volumes
```

## 8. 接入模型后，平台抽象开始出现

Dify 跑起来后，我接入了豆包模型。

这一步让我看到 Dify 的第一层平台抽象：

```txt
模型供应商管理
```

自己写 demo 时，通常直接在代码或环境变量里配置：

```txt
base_url
api_key
model
```

但在 Dify 里，这些被统一管理为模型供应商和模型能力。

后续创建 Chat Assistant、知识库、Workflow、Chatflow，都可以复用这些模型配置。

后面继续做 RAG 时，还会接触到：

```txt
LLM：生成回答
Embedding：向量化和语义召回
Rerank：候选结果重排
```

一个 AI 应用不是一个模型完成所有事情。

Dify 把这些能力放到统一模型供应商体系里。

这也是成熟平台值得学习的地方。

它不是消灭复杂性。

而是把复杂性放在更合适的位置。

## 9. 这一阶段得到的几个结论

这一篇看起来只是本地部署 Dify。

但真正沉淀下来的不是安装步骤，而是几个工程判断。

### 9.1 AI 应用平台是多服务系统

Dify 不是一个简单 Web 应用。

它包含：

```txt
web
api
worker
db
redis
nginx
sandbox
vector database
```

这说明 AI 应用平台的复杂度不只在模型调用。

也在运行时基础设施。

### 9.2 源码、镜像、数据卷要分清

最重要的关系是：

```txt
源码：用于阅读、修改、构建
镜像：实际运行的代码
volumes：运行状态和数据
```

学习官方 Dify 时，主要跑官方镜像。

二开 Dify 时，才需要改源码并构建自己的镜像。

### 9.3 升级要看所有核心服务

不要只看 web 容器。

要检查：

```txt
api
api_websocket
worker
worker_beat
web
```

是否都已经使用目标版本镜像。

否则可能出现混合版本。

### 9.4 成熟平台的价值在于抽象

Dify 不只是功能多。

它更有价值的是抽象：

```txt
应用类型
模型供应商
知识库
工作流
API
日志与监测
```

这些抽象可以反过来帮助我检查自己的 SuperAgentConsole。

## 10. 下一步：从 Chat Assistant 开始

Dify 跑起来后，下一步是 Chat Assistant。

这是最接近普通用户感知的 AI 应用形态：

```txt
用户输入问题
模型返回回答
支持多轮对话
可以开放 API
```

但这次我不会只看“能不能聊”。

我要重点看：

```txt
提示词在哪里生效
变量怎么传入
调试预览和发布更新是什么关系
blocking API 怎么返回
streaming API 怎么返回
conversation_id 如何支持多轮对话
日志、标注和监测能看到什么
```

这些内容也刚好可以和 SuperAgentConsole 里的：

```txt
Conversation
Message
SSE
AgentEvent
Run Detail
```

做对照。

所以下一篇会继续记录：

```txt
Dify Chat Assistant 从页面调试到 API 调用
```

这次学习 Dify，不是另起炉灶。

而是在自研 Agent 项目完成第一阶段后，给自己找一个成熟平台参照物。

先看别人怎么抽象。

再回头看自己该怎么进化。
