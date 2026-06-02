# MCP 到底解决什么问题？我用 Dify Chatflow 做了一次最小实验

学完 Dify 的 Agent + Tool 以后，我开始看 MCP。

一开始我对 MCP 的感觉是：

它好像很重要。

但又有点抽象。

因为在 Dify 里，我已经接触过很多类似概念：

```text
API Tool
Function calling
Agent
Chatflow
Workflow
Knowledge / RAG
```

如果再加一个 MCP，很容易变成概念堆叠。

所以我这次没有一上来研究协议细节。

我只做了一个最小实验：

```text
把一个已经跑通的 Dify Chatflow 暴露成 MCP 服务
再用 Codex 调用它
```

这个实验的目的，是回答一个更实际的问题：

```text
MCP 在 AI 应用工程里，到底解决什么问题？
```

## 1. Dify 里我看到两个 MCP 方向

我在 Dify 里先看到了一个入口：

```text
添加 MCP 服务 (HTTP)
```

这个页面需要配置：

```text
服务端点 URL
名称
服务器标识符
认证
请求头
配置
```

这个入口更像是：

```text
Dify 作为 MCP Client
去连接外部 MCP Server
```

也就是说，外部系统先提供 MCP 服务，Dify 再把它接进来。

后来我又在已经创建好的 Chatflow / Workflow 应用配置里，看到了另一个入口：

```text
MCP 服务
```

这个入口默认停用。

开启时需要填写一段描述：

```text
解释此工具的功能以及 LLM 应如何使用它
```

这个入口更像是：

```text
Dify 把当前应用暴露成 MCP Server
供外部 MCP Client 调用
```

所以 Dify 里的 MCP 至少有两个方向：

```text
Dify 连接别人
Dify 被别人连接
```

这两个方向如果不分清，很容易理解错。

## 2. 我为什么先做应用级 MCP Server

如果要测试“Dify 连接外部 MCP Server”，我需要先写一个外部 MCP Server。

这会引入很多新问题：

```text
MCP Server 怎么实现
Tool 怎么声明
Resource 怎么暴露
Prompt 怎么注册
鉴权怎么做
Dify 怎么连接
```

这些当然重要。

但它们不是我当前最想验证的。

我当时已经有一个可用的 Chatflow RAG V2。

这个 Chatflow 里有：

```text
参数提取
IF/ELSE 分支
知识检索
LLM 回答
日志 Trace
```

所以我选择先验证更小的一步：

```text
Dify 能不能把一个已有 Chatflow 暴露成 MCP 服务？
外部 Client 调用以后，内部是不是仍然走原来的 Chatflow？
```

这比直接写外部 MCP Server 更适合当前阶段。

## 3. 开启 MCP 服务以后发生了什么

我在“求职助手 Chatflow RAG V2”的应用配置里开启 MCP 服务。

填写了一段描述：

```text
这是一个 Dify / RAG 学习助手工具。
它可以根据用户问题检索 dify学习知识库，
并用中文回答与 Dify、RAG、Chatflow、Workflow、Agent Tool 学习记录相关的问题。
```

启用后，Dify 给了一个服务端点：

```text
http://localhost/mcp/server/JQy3oRVyReOPUyyk/mcp
```

因为我本地 Dify 是 Docker Compose 部署，宿主机访问 Nginx 的端口是 8080。

所以实际地址是：

```text
http://localhost:8080/mcp/server/JQy3oRVyReOPUyyk/mcp
```

直接 curl 这个地址：

```bash
curl -i --max-time 10 http://localhost:8080/mcp/server/JQy3oRVyReOPUyyk/mcp
```

返回：

```text
HTTP/1.1 405 METHOD NOT ALLOWED
```

这不是坏结果。

它说明服务端点存在。

只是普通 GET 不是 MCP 调用方式。

后续要用支持 MCP streamable HTTP 的 Client。

## 4. Codex 可以作为 MCP Client 调用它

我把这个 MCP 服务加到 Codex 中：

```bash
/Applications/Codex.app/Contents/Resources/codex mcp add dify-chatflow-rag-v2 \
  --url http://localhost:8080/mcp/server/JQy3oRVyReOPUyyk/mcp
```

然后用 Codex 调用：

```text
使用 dify-chatflow-rag-v2 查询：Dify 最小镜像升级流程是什么？
```

这里遇到一个小问题。

如果 Codex 会话使用“自动审查”模式，MCP 调用会卡在权限审批。

切到“默认权限”以后，它会弹出调用确认。

我点击允许后，调用就成功了。

这说明 MCP 不只是技术协议问题。

在真实系统里，它还涉及：

```text
权限审批
工具调用边界
用户确认
可观察性
```

这些都是 Agent 系统必须处理的问题。

## 5. 最关键的证据来自 Dify Trace

调用成功后，我去 Dify 的“日志与标注”查看。

那里确实出现了一条记录：

```text
Dify 最小镜像升级流程是什么？
```

点开 Trace，可以看到完整节点：

```text
用户输入
参数提取
是否符合提问
知识检索
LLM
最终返回
```

也能看到回答引用了知识库文档：

```text
dify-thread-context.md
knowledge-rag.md
dify-learning-plan.md
```

这个结果很重要。

它证明：

```text
Codex 通过 MCP 调用 Dify
并不是绕过 Chatflow
而是触发了原 Chatflow 的完整执行链路
```

所以这里的 MCP 不是内部编排系统。

它更像是外部入口协议。

内部怎么执行，仍然由 Chatflow 决定。

可以理解成：

```text
MCP：外部怎么调用
Chatflow：内部怎么编排
Knowledge：资料从哪里来
LLM：最后怎么生成
Trace：过程怎么观察
```

## 6. MCP 和普通 API 有什么区别

普通调用 Dify 应用，一般是走 API：

```text
POST /v1/chat-messages
```

调用方需要知道：

```text
API Key
inputs
query
response_mode
conversation_id
user
```

这是一种面向程序的调用方式。

而 MCP 的目标是让外部 AI Client 能把这个能力识别成一个“工具”或“服务”。

它更关注：

```text
这个能力能做什么
什么时候应该调用
需要什么输入
返回什么结果
```

所以 MCP 不是替代 HTTP API。

更准确地说，它是在 AI 应用层给外部能力加了一层标准化描述和调用协议。

可以理解成：

```text
普通 API：程序知道怎么调
MCP：AI Client 知道这个能力是什么，以及什么时候调
```

## 7. MCP Tool、Resource、Prompt 怎么理解

通过这次实验，我也顺手把 MCP 的几个概念梳理了一下。

`Tool` 是可执行动作。

例如：

```text
查询岗位画像
创建工单
查询订单
调用内部系统
```

`Resource` 是可读取资源。

例如：

```text
项目文档
知识资料
数据库表
配置文件
```

`Prompt` 是可复用提示词模板。

例如：

```text
分析 JD 的模板
生成周报的模板
代码审查的模板
```

一句话概括：

```text
Tool：做动作
Resource：读资料
Prompt：套模板
```

这几个东西本质上还是在拆分能力边界。

不是所有东西都混成一个“大模型回答”。

可执行动作、上下文资源、任务模板，应该各自有自己的边界。

这就是 MCP 让我觉得有价值的地方。

## 8. 为什么我暂时不继续做外部 MCP Server

按照完整学习路线，下一步可以写一个外部 MCP Server。

比如把之前做过的 `get_job_profile` mock 服务包装成 MCP Tool。

再让 Dify 去连接它。

但我暂时决定不继续做。

因为当前实验已经回答了我最关心的问题：

```text
Dify 可以把已有应用暴露成 MCP 服务
Codex 可以作为 MCP Client 调用
外部调用仍然进入 Dify 原有 Chatflow 执行链路
日志与 Trace 仍然可观察
```

这已经足够建立第一层认知。

继续写外部 MCP Server，会进入协议实现细节。

那是下一阶段可以做的事。

但不是当前最重要的事。

## 9. MCP 的本质还是软件工程

这次实验最让我有感触的地方是：

MCP 听起来是一个 AI 时代的新协议。

但它解决的问题并不陌生。

以前做普通软件系统，也一直在解决类似问题：

```text
能力如何封装
模块如何复用
接口如何描述
调用方如何发现
权限如何控制
失败如何兜底
过程如何追踪
```

AI 应用没有让这些问题消失。

反而因为大模型可以调用工具、读取资料、执行流程，这些问题变得更重要。

所以我现在更倾向于这样理解 MCP：

```text
MCP 是 AI 应用时代的一种标准化能力暴露协议。
它让工具、资源和提示词更容易被不同 AI Client 复用。
```

它不是为了替代业务系统。

也不是为了替代 Chatflow / Workflow。

更不是为了让所有逻辑都交给大模型。

它真正有价值的地方，是让 AI 系统里的外部能力有更清晰的边界。

从这个角度看，MCP 并不是一个孤立的新概念。

它是 AI 应用逐渐走向工程化的一个信号。

最后还是那几个老词：

```text
抽象
封装
复用
边界
可观察性
```

技术栈在变。

但软件工程的底层问题，并没有变。
