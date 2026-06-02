# MCP 实验记录

> 目标：记录当前已经完成的最小 MCP 实验，验证 Dify 应用级 MCP 服务如何被外部 MCP Client 调用，以及调用后在 Dify 日志和 Trace 中如何体现。

## 1. 实验目标

本次实验验证的是 Dify 的应用级 MCP Server 能力：

```text
Dify Chatflow RAG V2
↓
启用 MCP 服务
↓
暴露成一个 MCP Server endpoint
↓
Codex 作为 MCP Client 调用
↓
Dify 内部执行原 Chatflow 编排链路
```

这次不是在 Dify 中连接外部 MCP Server，而是反过来：

```text
Dify 作为 MCP Server
Codex 作为 MCP Client
```

## 2. 实验应用

应用信息：

```text
应用名称：求职助手 Chatflow RAG V2
应用类型：Chatflow
知识库：dify学习知识库
模型：doubao-seed-2-0-lite-260428
Rerank：Jina reranker-v3
```

Chatflow 内部节点：

```text
用户输入
参数提取
是否符合提问（IF/ELSE）
知识检索
LLM
最终回复
```

这个应用之前已经验证过：

- 可以根据用户问题判断是否属于支持范围。
- 可以调用知识库检索 Dify / RAG 学习记录。
- 可以在日志与标注中看到节点级 Trace。

## 3. 启用 MCP 服务

在应用配置栏中找到：

```text
MCP 服务
状态：已停用
```

开启时需要填写描述：

```text
这是一个 Dify / RAG 学习助手工具。它可以根据用户问题检索 dify学习知识库，并用中文回答与 Dify、RAG、Chatflow、Workflow、Agent Tool 学习记录相关的问题。当用户询问 Dify 学习过程、配置项、API 调用、知识库召回、镜像升级、Agent Tool 等内容时，应调用此工具。不要用它回答天气、闲聊或与 Dify 学习无关的问题。
```

启用后页面展示的服务端点类似：

```text
http://localhost/mcp/server/JQy3oRVyReOPUyyk/mcp
```

因为本地 Dify 通过 Docker Nginx 暴露在宿主机 8080 端口，所以宿主机实际访问地址应为：

```text
http://localhost:8080/mcp/server/JQy3oRVyReOPUyyk/mcp
```

## 4. 端点可达性验证

使用普通 GET 请求访问：

```bash
curl -i --max-time 10 http://localhost:8080/mcp/server/JQy3oRVyReOPUyyk/mcp
```

返回：

```text
HTTP/1.1 405 METHOD NOT ALLOWED
{"code":"method_not_allowed","message":"The method is not allowed for the requested URL.","status":405}
```

结论：

- endpoint 是存在的。
- 普通 GET 方法不符合 MCP 调用协议。
- 需要使用支持 MCP streamable HTTP 的 MCP Client 调用。

## 5. Codex 作为 MCP Client

Codex 中添加 MCP Server：

```bash
/Applications/Codex.app/Contents/Resources/codex mcp add dify-chatflow-rag-v2 \
  --url http://localhost:8080/mcp/server/JQy3oRVyReOPUyyk/mcp
```

配置结果：

```text
name：dify-chatflow-rag-v2
transport：streamable_http
url：http://localhost:8080/mcp/server/JQy3oRVyReOPUyyk/mcp
```

注意：

- 添加 MCP Server 会写入 Codex 的本地配置。
- 当前会话不一定会热加载，需要新开会话或确认工具列表中已启用。
- Codex 权限模式要使用“默认权限”。

## 6. 权限模式问题

实际测试发现：

```text
自动审查模式：MCP 调用卡在权限审批处，无法正常允许。
默认权限模式：Codex 会弹出 MCP 调用确认，用户点击允许后可以正常调用。
```

因此如果 MCP endpoint 可达，但 Codex 调用一直卡住，需要先检查 Codex 当前权限模式。

这次问题不是：

```text
Dify MCP Server 不可达
endpoint URL 写错
Chatflow MCP 服务未启用
```

而是：

```text
Codex 自动审查模式无法放行该 MCP 调用。
```

## 7. 调用 Case

在 Codex 中使用 MCP 调用：

```text
使用 dify-chatflow-rag-v2 查询：Dify 最小镜像升级流程是什么？
```

调用成功后，Codex 能拿到 Chatflow RAG V2 的回答。

回答内容引用了知识库中的相关文档，包括：

```text
dify-thread-context.md
knowledge-rag.md
dify-learning-plan.md
```

## 8. Dify 日志与 Trace

在 Dify 的日志与标注中，可以看到这次来自 Codex 的 MCP 调用记录。

记录标题：

```text
Dify 最小镜像升级流程是什么？
```

Trace 中可以看到完整节点链路：

```text
用户输入
参数提取
是否符合提问
知识检索
LLM
最终返回
```

这说明：

```text
外部 MCP Client 调用 Dify 应用级 MCP Server 时，
Dify 内部仍然执行原 Chatflow 的完整编排链路。
```

## 9. 当前结论

应用级 MCP Server 的本质不是新建一套独立执行逻辑，而是把已有 Dify 应用包装成一个标准 MCP 服务。

可以理解为：

```text
MCP 是外部标准入口
Chatflow 是内部业务编排
知识库 / LLM / IFELSE 仍然由原 Chatflow 负责
```

也就是说：

```text
Codex -> MCP -> Dify Chatflow -> Knowledge Retrieval / LLM -> Answer
```

这个实验说明 MCP 在这里解决的是“外部系统如何标准化调用 Dify 应用能力”的问题。

## 10. 和普通 API 的区别

普通 Dify API 调用：

```text
外部系统直接调用 /v1/chat-messages
需要知道应用 API Key、请求体格式、conversation_id、response_mode 等细节
```

应用级 MCP 调用：

```text
外部 MCP Client 通过统一 MCP 协议发现和调用该能力
调用方更像是在使用一个工具
不需要自己理解 Dify 的 Chatflow API 细节
```

但内部执行结果类似：

```text
最终仍然会进入 Dify 应用运行链路
仍然会产生日志和 Trace
仍然会消耗模型和知识库检索资源
```

## 11. 当前未完成内容

本次实验暂未覆盖：

- Dify 作为 MCP Client 连接外部 MCP Server。
- 外部 MCP Server 暴露 Tool / Resource / Prompt。
- Agent 应用调用外部 MCP Tool。
- MCP Tool 与普通 OpenAPI Tool 的完整 streaming event 对照。
- MCP 调用失败、参数缺失、返回空结果等边界情况。

这些可以作为后续实验继续补充。
