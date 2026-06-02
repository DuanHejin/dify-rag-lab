# Dify MCP 实战 12：把 Chatflow 暴露为 MCP Server，并用 Codex 调用

前面已经完成了 Dify 里几个核心模块的实验：

```text
Chat Assistant
Knowledge / RAG
Chatflow
Workflow
Agent + Tool
```

其中 Agent + Tool 阶段已经验证过：

```text
自定义 OpenAPI Tool
Function calling
agent_thought
tool_input
observation
工具调用 Trace
```

接下来进入 MCP。

这次没有直接写外部 MCP Server。

而是先做一个更小的实验：

```text
把已经跑通的 Dify Chatflow RAG V2 暴露成 MCP Server
然后用 Codex 作为 MCP Client 调用
最后观察 Dify 日志与 Trace
```

## 1. Dify 中看到的两个 MCP 入口

当前在 Dify 里看到了两类 MCP 入口。

第一类是：

```text
添加 MCP 服务 (HTTP)
```

这个入口需要配置：

```text
服务端点 URL
名称和图标
服务器标识符
认证
请求头
配置
```

它对应的是：

```text
Dify 作为 MCP Client
连接外部 MCP Server
```

第二类是在某个 Chatflow / Workflow 应用配置里：

```text
MCP 服务
```

开启时需要填写描述：

```text
解释此工具的功能以及 LLM 应如何使用它
```

它对应的是：

```text
Dify 把当前应用暴露成 MCP Server
外部 MCP Client 可以调用这个应用
```

本次实验选择第二类。

原因是 Chatflow RAG V2 已经跑通，不需要先实现外部 MCP Server。

## 2. 实验对象：Chatflow RAG V2

实验应用：

```text
应用名称：求职助手 Chatflow RAG V2
应用类型：Chatflow
模型：doubao-seed-2-0-lite-260428
知识库：dify学习知识库
Rerank：Jina reranker-v3
```

内部节点：

```text
用户输入
↓
参数提取
↓
是否符合提问（IF/ELSE）
↓
知识检索
↓
LLM
↓
最终回复
```

这个 Chatflow 已经支持：

```text
根据用户问题判断意图
信息不足时走补充信息分支
无关问题走暂不支持分支
命中 Dify / RAG 学习问题时检索知识库
LLM 基于知识库结果回答
```

## 3. 开启应用级 MCP 服务

在应用配置里开启：

```text
MCP 服务
```

填写描述：

```text
这是一个 Dify / RAG 学习助手工具。它可以根据用户问题检索 dify学习知识库，并用中文回答与 Dify、RAG、Chatflow、Workflow、Agent Tool 学习记录相关的问题。当用户询问 Dify 学习过程、配置项、API 调用、知识库召回、镜像升级、Agent Tool 等内容时，应调用此工具。不要用它回答天气、闲聊或与 Dify 学习无关的问题。
```

启用后得到服务端点：

```text
http://localhost/mcp/server/JQy3oRVyReOPUyyk/mcp
```

本地 Dify 是 Docker Compose 部署。

Nginx 对宿主机暴露的是 8080 端口。

因此宿主机实际访问地址是：

```text
http://localhost:8080/mcp/server/JQy3oRVyReOPUyyk/mcp
```

## 4. endpoint 可达性验证

先用 curl 访问：

```bash
curl -i --max-time 10 http://localhost:8080/mcp/server/JQy3oRVyReOPUyyk/mcp
```

返回：

```text
HTTP/1.1 405 METHOD NOT ALLOWED
Server: nginx/1.31.1
X-Version: 1.14.2
X-Env: PRODUCTION

{"code":"method_not_allowed","message":"The method is not allowed for the requested URL.","status":405}
```

这个结果说明：

```text
endpoint 存在
普通 GET 方法不被支持
需要 MCP Client 按 streamable HTTP 协议调用
```

所以这里不是服务不可达。

## 5. Codex 添加 Dify MCP Server

使用 Codex CLI 添加：

```bash
/Applications/Codex.app/Contents/Resources/codex mcp add dify-chatflow-rag-v2 \
  --url http://localhost:8080/mcp/server/JQy3oRVyReOPUyyk/mcp
```

配置结果：

```text
name = dify-chatflow-rag-v2
transport = streamable_http
url = http://localhost:8080/mcp/server/JQy3oRVyReOPUyyk/mcp
```

注意点：

```text
添加 MCP Server 会写入 Codex 本地配置
当前会话不一定热加载
需要确认 MCP 服务在当前会话已启用
```

## 6. 权限模式问题

第一次调用时，Codex 卡在权限审批。

后来发现原因不是 Dify endpoint。

而是 Codex 会话使用了：

```text
自动审查
```

切换为：

```text
默认权限
```

后，Codex 会在 MCP 调用前弹出确认。

点击允许后可以正常调用。

结论：

```text
自动审查模式：MCP 调用无法正常放行
默认权限模式：弹出确认，允许后正常调用
```

这也是 Agent 工程里很重要的一点：

```text
工具调用不只是协议问题
还涉及权限和审批边界
```

## 7. 调用测试

在 Codex 中发起：

```text
使用 dify-chatflow-rag-v2 查询：Dify 最小镜像升级流程是什么？
```

调用成功后，返回了 Chatflow RAG V2 的回答。

回答中引用了知识库文档：

```text
dify-thread-context.md
knowledge-rag.md
dify-learning-plan.md
```

这说明 MCP 调用确实进入了 Dify 应用，而不是返回固定 mock 内容。

## 8. Dify 日志与 Trace

在 Dify 的日志与标注中，可以看到这次调用记录。

记录标题：

```text
Dify 最小镜像升级流程是什么？
```

Trace 中的节点链路：

```text
用户输入
参数提取
是否符合提问
知识检索
LLM
最终返回
```

这个现象非常关键。

它说明：

```text
外部 MCP Client 调用 Dify 应用级 MCP Server
并不会绕过原来的 Chatflow
而是进入原 Chatflow 的完整执行链路
```

调用链可以表示为：

```text
Codex
↓
MCP Client
↓
Dify MCP Server
↓
Chatflow RAG V2
↓
参数提取 / IFELSE / 知识检索 / LLM
↓
Answer
```

## 9. MCP 和 Dify API 的区别

普通 Dify API 调用需要调用方知道：

```text
POST /v1/chat-messages
Authorization: Bearer app-xxx
inputs
query
response_mode
conversation_id
user
```

MCP 调用更像：

```text
外部 AI Client 发现一个可调用能力
根据描述判断什么时候使用
通过 MCP 协议发起调用
拿到结果后继续自己的任务
```

所以二者不是替代关系。

更准确的区别是：

```text
Dify API：面向程序的应用接口
MCP：面向 AI Client 的标准化能力入口
```

在这个实验里，MCP 最终仍然调用了 Dify 应用。

所以内部执行成本、知识库检索、LLM 消耗、日志 Trace 都还在。

## 10. MCP Tool / Resource / Prompt 的理解

这次没有继续实现外部 MCP Server。

但可以先明确三个概念：

```text
Tool：可执行动作
Resource：可读取资源
Prompt：可复用提示词模板
```

示例：

```text
Tool：
- 查询岗位画像
- 查询订单
- 创建工单
- 调用内部接口

Resource：
- 项目文档
- 配置文件
- 知识资料
- 数据库表

Prompt：
- JD 分析模板
- 周报生成模板
- 代码审查模板
```

一句话：

```text
Tool 做事
Resource 给资料
Prompt 给模板
```

这些概念的价值在于拆分边界。

不是所有能力都混在一个 LLM prompt 里。

## 11. 为什么暂时不继续做外部 MCP Server

后续可以继续做：

```text
写一个外部 MCP Server
暴露 get_job_profile Tool
Dify 作为 MCP Client 接入
Agent 调用外部 MCP Tool
对比普通 OpenAPI Tool 和 MCP Tool
```

但当前阶段先暂停。

原因是最关键的问题已经验证：

```text
Dify 可以作为 MCP Server 暴露已有应用
Codex 可以作为 MCP Client 调用
调用后仍进入原 Chatflow 链路
Dify 日志与 Trace 能记录整个过程
```

继续深入外部 MCP Server，会进入协议实现细节。

那是下一阶段可以做的事。

## 12. 工程结论

这次实验让我对 MCP 的理解变得更具体。

MCP 不是一套新的业务编排系统。

它也不是替代 Chatflow / Workflow / API Tool 的东西。

它更像一个标准化能力入口。

可以理解为：

```text
MCP 负责让外部 AI Client 调用能力
Chatflow / Workflow 负责内部怎么执行
Tool / Resource / Prompt 负责能力边界拆分
日志 / Trace 负责过程可观察
```

从软件工程角度看，它解决的还是老问题：

```text
抽象
封装
复用
边界
权限
可观察性
```

AI 应用没有让这些问题消失。

相反，因为模型开始调用工具、读取资源、执行流程，这些问题变得更重要。

这就是我目前对 MCP 的阶段性理解：

```text
MCP 是 AI 应用时代的标准化能力暴露协议。
它不是魔法，而是工程化。
```
