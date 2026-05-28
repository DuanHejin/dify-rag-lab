# 做完自己的 Agent 项目后，我为什么开始学习 Dify？

SuperAgentConsole 第一阶段跑通之后，我没有马上继续往里面加功能。

不是因为没东西可做。

恰恰相反，后面可以做的东西很多：

```txt
更复杂的 Tool
更完整的 Skill Workflow
更细的 AgentEvent
更好的 Run Detail
更多模型供应商
更稳定的线上部署
更完善的权限和日志
```

但项目做到这个阶段，我开始意识到一个问题：

如果一直只看自己的实现，很容易陷入自己的抽象里。

我知道自己的 Tool Router 为什么这么设计。

我知道 Skill Workflow 为什么要拆成几个步骤。

我知道 AgentEvent 为什么要一条条落库。

我也知道 Run Detail 页面为什么要把每一步执行过程展示出来。

但这些设计到底是不是成熟 AI 应用平台里常见的做法？

有没有更通用的产品形态？

有没有更标准的叫法？

一个真正被很多人使用的平台，会怎么组织应用、知识库、工作流、Agent、API、日志和监测？

这些问题，继续闷头写自己的项目，很难回答。

所以我决定找一个成熟平台做参照。

这个平台就是 Dify。

## 为什么在这个阶段学习 Dify

我学习 Dify，不是为了把自己的 SuperAgentConsole 推倒重来。

也不是觉得低代码平台可以替代自研项目。

我的目的更像是对照学习。

SuperAgentConsole 是我自己从 0 搭出来的一套系统。

它让我真正经历了一遍：

```txt
前端页面
登录
数据库
Docker 镜像
GitHub Actions
K3S
HTTPS
CLS 日志
真实模型调用
Agent Run
Tool Router
Skill Workflow
执行回放
```

这些东西跑通以后，我对 AI / Agent 产品的理解比一开始具体了很多。

但也正因为自己做过一遍，再看 Dify 时，关注点就不一样了。

以前看 Dify，可能只是觉得：

```txt
它是一个 AI 应用开发平台
可以配置聊天助手
可以做工作流
可以接知识库
可以做 Agent
```

这些都是功能介绍。

但现在我更关心：

```txt
它怎么抽象应用类型？
它怎么管理模型供应商？
它怎么组织知识库和 RAG？
它的 Chat Assistant 和 Chatflow 有什么区别？
它的 Workflow 和我自己的 Skill Workflow 有什么相似和不同？
它的 API 返回结构怎么设计？
它如何展示日志、标注和监测？
```

也就是说，我不是从零开始看 Dify。

而是在自己做完一个 Agent 项目之后，反过来用 Dify 校准自己的理解。

## 先把 Dify 在本地跑起来

学习一个平台，最好的方式不是先看一堆概念。

而是先把它跑起来。

我把 Dify clone 到本地：

```bash
git clone --depth 1 https://github.com/langgenius/dify.git
```

本地目录大概是：

```txt
/Users/duanhejin/personalProjects/dify-rag-lab/dify
```

Docker Compose 目录是：

```txt
/Users/duanhejin/personalProjects/dify-rag-lab/dify/docker
```

启动后，浏览器访问：

```txt
http://localhost:8080
```

然后完成管理员账号初始化。

这一步本身不复杂。

但它很快让我意识到：

Dify 不是一个简单的前端项目，也不是一个单独的后端服务。

它是一组服务。

启动以后，背后至少会涉及：

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

这和传统前端项目很不一样。

你不是启动一个 dev server，然后打开页面。

你是在启动一套 AI 应用平台。

这套平台需要数据库存应用配置。

需要 Redis。

需要 worker 处理异步任务。

需要向量库支撑知识库检索。

需要 nginx 做入口。

需要 sandbox 处理隔离执行。

从这个角度看，Dify 适合用 Docker Compose 启动，不是偶然的。

它本来就是多服务协同。

## Docker Compose 不是附属知识

以前我会把 Docker Compose 当成部署工具。

需要的时候查一下命令。

不需要的时候放在一边。

但这次本地跑 Dify，我对它的理解更具体了。

Docker 是运行单个容器。

Docker Compose 是编排一组容器。

Dify 这种平台型应用，天然就不是一个容器能说清楚的。

它至少包含：

```txt
应用入口
后端 API
异步 worker
数据库
缓存
向量库
反向代理
文件存储
模型供应商配置
```

所以当我执行：

```bash
docker-compose up -d
```

它背后启动的不是一个“项目”。

而是一套系统。

这件事对我有一个提醒：

如果以后继续做自己的 Agent 平台，不能只盯着业务代码。

真正的平台能力，一定会落到这些基础设施上。

## 源码和镜像不是一回事

本地部署 Dify 时，我遇到的第一个重要认知点，是源码和镜像的关系。

我已经把 Dify 源码 clone 到本地了。

于是很容易产生一个误解：

现在运行的 Dify，是不是就在跑本地这些 `api/`、`web/` 目录里的源码？

答案是否定的。

默认 Docker Compose 启动时，真正运行的是 `docker-compose.yaml` 里指定的镜像。

比如：

```yaml
image: langgenius/dify-api:1.14.1
image: langgenius/dify-web:1.14.1
```

也就是说，容器里跑的是官方已经打包好的镜像。

本地源码只是放在那里。

你修改本地源码，只要没有重新 build 成自己的镜像，运行中的 Dify 就不会受影响。

这点很重要。

它对应两种完全不同的使用方式：

```txt
学习或部署官方 Dify：
重点是 Docker Compose 和官方镜像

二开 Dify：
修改源码，构建自己的镜像，再让部署环境使用自己的镜像
```

这两件事不能混在一起。

之前做 SuperAgentConsole 时，我已经搭过自己的镜像链路：

```txt
GitHub Actions
↓
构建 Docker 镜像
↓
推送到 GHCR
↓
服务器拉取镜像
↓
K3S 更新服务
```

所以再看 Dify 时，我更能理解：

源码是开发材料。

镜像才是运行实体。

数据卷则是系统状态。

这三个东西必须分清。

## 升级 Dify 时，我再次踩到这个认知点

后面我在测试知识库 RAG 时，遇到了一个页面渲染问题。

知识库其实有召回结果。

但页面展示时报错。

继续查以后发现，官方新版本已经修复了相关问题。

于是我需要把 Dify 从 1.14.1 升级到 1.14.2。

一开始我也想过：

是不是要拉官方源码 tag？

是不是要把本地代码切到 1.14.2？

但很快我又回到前面的判断：

我现在运行的是镜像。

如果只是为了升级正在运行的 Dify，最小动作不是切源码，而是改镜像版本。

也就是把 `docker-compose.yaml` 里的核心镜像从：

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

这里还有一个小坑。

有些环境用的是新版 Compose 插件，命令是：

```bash
docker compose up -d
```

但我的本机环境里，可用的是旧版独立命令：

```bash
docker-compose
```

所以执行 `docker compose` 时会报：

```txt
docker: unknown command: docker compose
```

解决方式很简单：

换成：

```bash
docker-compose up -d
```

这个问题本身不复杂。

但它很真实。

很多技术学习不是卡在“大原理”上，而是卡在这些环境差异上。

## 升级不是 web 变了就结束

升级后，我用：

```bash
docker-compose images
```

检查实际运行的镜像。

结果发现一开始并不是所有核心服务都升级到了 1.14.2。

有些服务已经是 1.14.2。

但 api、api_websocket、worker_beat 里还残留 1.14.1。

这说明我只改了一部分镜像版本。

Dify 的多个服务都可能使用同一个 `langgenius/dify-api` 镜像。

如果只改其中一处，就会出现混合版本。

这件事给我的提醒是：

平台型应用升级时，不能只看页面能不能打开。

也不能只看 web 容器是不是新版本。

要看实际运行的所有核心服务。

否则就可能出现：

```txt
前端已经是新版本
后端部分服务还是旧版本
worker 还是旧版本
定时任务还是旧版本
```

系统表面能跑。

但某些功能仍然会表现得很奇怪。

最后我把所有核心服务统一到 1.14.2，再重新拉取和重建容器，问题才算真正解决。

## volumes 不能乱删

升级前，我做了备份：

```bash
cp docker-compose.yaml docker-compose.yaml.bak
cp .env .env.bak
tar -cvf volumes-backup.tgz volumes
```

这里最重要的是 `volumes`。

因为本地 Dify 的数据库、上传文件、向量库等数据，都和它有关。

容器可以删了再建。

镜像可以重新拉。

但 `volumes` 不能随便删。

这和我之前做 SuperAgentConsole 时对 PVC、MySQL 数据迁移的理解是一样的。

应用服务本身是可替换的。

真正不能轻易丢的，是数据状态。

如果只是学习环境，删了也就是重新配置。

但如果是企业私有部署，删错数据卷就是事故。

所以我在学习文档里专门记了一条：

不要轻易删除 `volumes`。

它不是临时缓存。

它是本地 Dify 的状态仓库。

## 接入模型后，平台感才出来

Dify 跑起来后，我接入了豆包模型。

这一步让我看到 Dify 的第一层平台抽象：

模型供应商管理。

自己写 demo 时，我们常常直接在代码里配：

```txt
base_url
api_key
model
```

但在 Dify 里，它被抽象成模型供应商和模型能力。

后面创建 Chat Assistant、知识库、Workflow、Chatflow 时，都可以复用这些模型配置。

再往后做 RAG 时，我又接触到 Embedding 模型和 Rerank 模型。

这时候就更明显了：

一个 AI 应用不是一个模型完成所有事情。

它可能需要：

```txt
LLM：负责生成回答
Embedding：负责向量化和语义召回
Rerank：负责候选结果重排
```

这些能力如果都散落在代码里，很容易混乱。

Dify 把它们放到统一的模型供应商体系里。

这也是成熟平台值得学习的地方。

它不是把复杂性消灭了。

而是把复杂性放到了合适的位置。

## 这一篇真正记录的是什么

如果只看操作，这一篇很简单。

```txt
clone Dify
Docker Compose 启动
初始化管理员账号
接入豆包模型
升级镜像
备份 volumes
```

但对我来说，它不是一篇 Dify 安装教程。

它更像是 SuperAgentConsole 第一阶段完成后的一个参照实验。

通过 Dify，我重新确认了几个问题。

第一，AI 应用平台一定是多服务协同。

页面只是入口。

背后还有 api、worker、数据库、缓存、向量库和任务系统。

第二，源码、镜像、数据卷必须分清。

学习官方平台时跑镜像。

二开时改源码并构建自己的镜像。

数据卷是状态，不能当垃圾文件处理。

第三，成熟平台的价值不只是功能多。

它更重要的价值，是提供了一套抽象。

比如：

```txt
模型供应商
应用类型
知识库
工作流
API
日志与监测
```

这些抽象会反过来帮助我检查自己的项目。

第四，学习 Dify 不是从 SuperAgentConsole 逃开。

恰恰相反。

这是为了更好地理解 SuperAgentConsole 下一步该怎么走。

自研项目让我知道一个系统怎么从 0 到 1 长出来。

Dify 让我看到一个成熟平台如何组织类似能力。

这两件事放在一起，才更完整。

## 下一步看 Chat Assistant

Dify 跑起来以后，下一步最自然的是 Chat Assistant。

因为它最接近普通用户对 AI 应用的第一印象：

```txt
打开页面
输入问题
得到回答
```

但这次我不想只停留在“能不能聊”。

我更想看清楚：

```txt
提示词在哪里生效？
变量怎么传？
调试预览和发布更新是什么关系？
blocking API 和 streaming API 有什么区别？
conversation_id 如何支撑多轮对话？
日志、标注、监测能看到什么？
```

这些问题刚好也能和我自己的 SuperAgentConsole 对照起来。

所以下一篇，我会用 Dify 创建一个简单的求职聊天助手。

从页面配置，到 API 调用，再到流式响应和多轮会话。

不是为了做一个复杂助手。

而是为了用最小例子，把 Dify 的聊天应用链路跑通。

SuperAgentConsole 是我自己从 0 搭的一套系统。

Dify 是我用来校准认知的一面镜子。

接下来，我会一边跑 Dify，一边回头看自己的项目：

哪些地方可以借鉴？

哪些地方应该坚持自研？

哪些能力是下一阶段必须补上的？
