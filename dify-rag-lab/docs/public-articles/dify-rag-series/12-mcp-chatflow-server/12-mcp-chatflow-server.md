# 我把 Dify Chatflow 暴露成 MCP 服务，才发现它不是另一套魔法

学完 Agent + Tool 以后，我继续看 MCP。

一开始我对 MCP 的理解其实有点模糊。

它经常和 Agent、Tool、Function Calling 一起出现。

看起来像是又一个新概念。

但我前面已经做过不少东西了。

Chat Assistant 跑过了。

知识库 RAG 跑过了。

Chatflow 里做过参数提取、IF/ELSE、知识检索。

Workflow 里做过一次性任务编排。

Agent 里也接过一个自定义 OpenAPI Tool。

所以我这次不想一上来就陷进协议细节。

我更想弄清楚一个问题：

```text
MCP 到底在工程里解决什么问题？
```

## 我先看到的是两个不同入口

在 Dify 里，我一开始看到的是“添加 MCP 服务 (HTTP)”。

这个页面需要填：

```text
服务端点 URL
名称和图标
服务器标识符
认证
请求头
配置
```

我第一反应是：

这应该是让 Dify 去连接一个外部 MCP Server。

也就是说：

```text
Dify 作为 MCP Client
外部服务作为 MCP Server
```

后来我又在已经做好的 Chatflow / Workflow 应用配置里，看到另一个入口。

这个入口叫：

```text
MCP 服务
```

默认是停用的。

点开以后，它让我填写一段描述：

```text
解释此工具的功能以及 LLM 应如何使用它
```

这时我才意识到，Dify 里至少有两种 MCP 方向。

一种是：

```text
Dify 连接外部 MCP Server
```

另一种是：

```text
Dify 把已有应用暴露成 MCP Server
```

这两个方向很容易混在一起。

但它们完全不是一回事。

## 我先选择最小实验

如果要做第一种，我需要先写一个外部 MCP Server。

但这会把问题变复杂。

我当时已经有一个跑通的 Chatflow RAG V2。

它里面有完整的流程：

```text
用户输入
↓
参数提取
↓
IF/ELSE
↓
知识检索
↓
LLM
↓
最终回复
```

它还能查我自己的 Dify 学习知识库。

所以我决定先做更小的一步：

```text
把这个 Chatflow 暴露成 MCP 服务
再用 Codex 调用它
```

这一步的目标不是证明我会写 MCP Server。

而是验证：

```text
Dify 已有应用能不能通过 MCP 被外部系统复用。
```

## 启用以后，Dify 给了一个服务端点

我在 Chatflow RAG V2 的应用配置里开启 MCP 服务。

填写的描述大概是：

```text
这是一个 Dify / RAG 学习助手工具。
它可以根据用户问题检索 dify学习知识库，
并用中文回答与 Dify、RAG、Chatflow、Workflow、Agent Tool 学习记录相关的问题。
当用户询问 Dify 学习过程、配置项、API 调用、知识库召回、镜像升级、Agent Tool 等内容时，应调用此工具。
不要用它回答天气、闲聊或与 Dify 学习无关的问题。
```

启用后，页面给了一个地址：

```text
http://localhost/mcp/server/JQy3oRVyReOPUyyk/mcp
```

但我的 Dify 是 Docker Compose 跑起来的。

Nginx 容器对宿主机暴露的是 8080。

所以真实访问地址应该是：

```text
http://localhost:8080/mcp/server/JQy3oRVyReOPUyyk/mcp
```

我先用 curl 试了一下：

```bash
curl -i --max-time 10 http://localhost:8080/mcp/server/JQy3oRVyReOPUyyk/mcp
```

返回是：

```text
HTTP/1.1 405 METHOD NOT ALLOWED
{"code":"method_not_allowed","message":"The method is not allowed for the requested URL.","status":405}
```

这不是服务不可用。

它说明 endpoint 是存在的。

只是普通 GET 请求不是 MCP 调用方式。

后面需要用真正支持 MCP streamable HTTP 的 Client 来调。

## 我用 Codex 做 MCP Client

接下来我把这个服务加到 Codex 里。

命令是：

```bash
/Applications/Codex.app/Contents/Resources/codex mcp add dify-chatflow-rag-v2 \
  --url http://localhost:8080/mcp/server/JQy3oRVyReOPUyyk/mcp
```

配置完成后，Codex 里能看到这个 MCP 服务：

```text
dify-chatflow-rag-v2
transport：streamable_http
url：http://localhost:8080/mcp/server/JQy3oRVyReOPUyyk/mcp
```

但第一次测试并不顺利。

我在另一个对话里让 Codex 调它：

```text
使用 dify-chatflow-rag-v2 查询：Dify 最小镜像升级流程是什么？
```

结果卡在权限审批那里。

一开始我还以为是 MCP endpoint 有问题。

后来发现不是。

原因是那个对话的权限模式选成了：

```text
自动审查
```

自动审查模式下，它没有正常弹出让我允许 MCP 调用的提示。

我切回：

```text
默认权限
```

再次调用时，Codex 弹出了确认。

我点允许。

这次就正常拿到了 Dify Chatflow 的返回结果。

这个小问题其实也挺真实。

MCP 不只是协议问题。

它还会涉及权限、审批、工具调用边界。

在 Agent 系统里，这些都是很实际的工程问题。

## 真正让我确定的是 Trace

调用成功以后，我去 Dify 的“日志与标注”里看。

那里出现了一条记录。

标题是：

```text
Dify 最小镜像升级流程是什么？
```

点开以后，Trace 里能看到完整节点：

```text
用户输入
参数提取
是否符合提问
知识检索
LLM
最终返回
```

右侧还能看到回答引用了知识库文档：

```text
dify-thread-context.md
knowledge-rag.md
dify-learning-plan.md
```

这一步很重要。

因为它说明了一件事：

```text
Codex 调 MCP
不是绕过 Chatflow
而是触发了原来的 Chatflow 编排
```

也就是说，这条链路是：

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
最终回答
```

MCP 在这里不是替代 Chatflow。

它只是把 Chatflow 暴露给外部系统调用。

## 这让我重新理解 MCP

做到这里，我对 MCP 的理解变得更具体了。

它不是另一套魔法。

也不是说有了 MCP，就不需要 Chatflow、Workflow、Tool、API 了。

它更像一个标准入口。

以前我要调用 Dify 应用，可能要知道：

```text
/v1/chat-messages
API Key
response_mode
conversation_id
inputs
user
```

而 MCP 的方向是：

```text
把这个应用能力描述成一个外部 AI Client 可以理解和调用的服务
```

调用方不一定要知道 Dify 内部 API 的细节。

它只需要知道：

```text
这个工具能做什么
什么时候该用
需要什么输入
会返回什么结果
```

这就很像我之前做 Tool Schema 时的感受。

不是让模型凭感觉访问一个接口。

而是把能力结构化地暴露出来。

只不过 OpenAPI Tool 更像 Dify 里的一个工具配置。

MCP 更像不同 AI 系统之间可以复用的一套协议。

## Tool、Resource、Prompt 也更容易理解了

这次我没有深入做外部 MCP Server。

但我顺着这个实验，把几个概念捋了一下。

MCP Tool 是可执行动作。

比如：

```text
查询岗位画像
创建工单
查询订单
调用内部系统
```

MCP Resource 是可读取资源。

比如：

```text
项目文档
配置说明
数据库表
文件内容
知识资料
```

MCP Prompt 是可复用提示词模板。

比如：

```text
按固定模板分析 JD
按固定模板生成周报
按固定模板做代码审查
```

简单说就是：

```text
Tool：让模型做一件事
Resource：给模型看一份资料
Prompt：给模型一套任务模板
```

它们不是为了把 AI 应用变复杂。

恰恰相反，它们是在把 AI 应用里的外部能力拆开。

可执行的归可执行。

可读取的归可读取。

可复用的提示词归提示词。

这还是软件工程里的老问题：

```text
抽象
封装
复用
边界
```

只是现在换成了 Agent 和大模型的语境。

## 我暂时不继续做外部 MCP Server

原本计划里，我还想继续做一个外部 MCP Server。

比如把之前的 `get_job_profile` mock 服务包装成 MCP Tool。

再让 Dify 去连接它。

但做完这一步以后，我觉得可以先暂停。

因为当前阶段最关键的问题已经回答了：

```text
Dify 可以把已有 Chatflow 暴露成 MCP 服务
Codex 可以作为 MCP Client 调用它
调用后 Dify 仍然保留完整日志和 Trace
MCP 是外部协议入口，不是内部编排替代品
```

继续往外部 MCP Server 深挖，当然有价值。

但那会进入协议实现细节。

而我现在更需要的是先建立整体理解。

对我来说，这个阶段已经够了。

## MCP 最打动我的地方

这次实验以后，我反而没觉得 MCP 多神秘。

它让我想起以前做普通业务系统时的一些东西。

比如中台团队封装一个 NPM 包。

别的项目可以直接安装使用。

比如后端团队提供一个统一接口。

多个业务系统都可以调用。

比如我自己的 SuperAgentConsole 里，Tool Router 不关心每个工具内部怎么实现。

它只关心：

```text
有哪些工具
什么时候调用
参数是什么
结果怎么回填
执行过程怎么记录
```

MCP 在 AI 应用里做的事情，本质上也很接近。

它让能力可以被标准化描述。

也让不同 AI Client 更容易复用这些能力。

这不是推翻软件工程。

而是 AI 应用开始重新回到软件工程。

业务复杂度不会因为有大模型就消失。

系统边界也不会因为有 Agent 就不重要。

相反，越是接入模型、工具、知识库、外部服务，越需要把边界拆清楚。

哪个能力是工具。

哪个能力是资源。

哪个能力是提示词。

哪个部分负责路由。

哪个部分负责执行。

哪个部分负责日志和追踪。

这些问题，最后还是工程问题。

这一步没有让我写出一个新的功能。

但它让我更清楚地看到：

AI 应用不是脱离软件工程的新世界。

它只是把软件工程里的抽象、复用和边界，放到了新的调用场景里。

从这个角度看，MCP 不是终点。

它只是 AI 应用工程化开始变清晰的一块拼图。
