# MCP 配置项说明

> 记录 Dify 中 MCP 相关入口的配置项含义，以及当前阶段对 Dify MCP 能力形态的理解。

## 1. 当前发现：Dify 至少有两个 MCP 入口

当前已经看到两个不同位置的 MCP 入口：

```text
入口 A：工具 / MCP 集成里的“添加 MCP 服务 (HTTP)”
入口 B：某个 Chatflow / Workflow 应用配置栏里的“MCP 服务”
```

这两个入口不是一回事。

初步判断：

```text
入口 A：Dify 作为 MCP Client，连接外部 MCP Server。
入口 B：Dify 把某个已创建的应用暴露成 MCP Server，供外部 MCP Client 调用。
```

也就是说，Dify 当前不是单向 MCP 能力，而是至少展示了两类形态：

```text
接入外部 MCP 服务
把自身应用作为 MCP 服务对外暴露
```

## 2. 入口 A：添加 MCP 服务 (HTTP)

当前找到的页面标题：

```text
添加 MCP 服务 (HTTP)
```

从页面字段看，Dify 当前这个入口更像：

```text
Dify 作为 MCP Client
连接一个外部 HTTP MCP Server
```

也就是说：

```text
不是在这里把 Dify 自己发布成 MCP Server
而是在这里配置一个外部 MCP 服务端点，让 Dify 去连接它
```

因此如果要做最小实验，需要先准备一个可访问的 MCP Server。

## 3. 入口 A：服务端点 URL

页面字段：

```text
服务端点 URL
```

含义：

```text
外部 MCP Server 的 HTTP 地址。
```

它不是普通业务 API 地址，也不是 OpenAPI Tool 的某个 REST 接口地址。

它应该是符合 MCP HTTP 传输协议的服务端点。

对本地 Docker 部署的 Dify 来说，如果 MCP Server 跑在宿主机上，通常不能写：

```text
http://localhost:xxxx
```

因为 Dify 后端运行在容器里，容器里的 `localhost` 指向容器自身。

更可能需要写：

```text
http://host.docker.internal:xxxx/...
```

具体路径要根据 MCP Server 的实现确定。

## 4. 入口 A：名称和图标

页面字段：

```text
名称和图标
```

含义：

```text
给这个 MCP 服务在 Dify 工作空间里的展示名称和图标。
```

这个名称主要用于页面展示，方便在工具列表或服务列表中识别。

建议命名：

```text
求职 MCP 服务
```

或：

```text
Job Profile MCP
```

## 5. 入口 A：服务器标识符

页面字段：

```text
服务器标识符
```

页面说明：

```text
工作空间内服务器的唯一标识。
支持小写字母、数字、下划线和连字符，最多 24 个字符。
```

含义：

```text
Dify 内部用来唯一识别这个 MCP Server 的 ID。
```

它更像系统内部 identifier，不是展示名称。

建议使用稳定、短小、语义明确的命名：

```text
job-profile-mcp
```

或：

```text
job_profile_mcp
```

注意：

```text
不要使用中文。
不要超过 24 个字符。
不要随意修改，否则后续引用关系可能需要重新配置。
```

## 6. 入口 A：认证

当前页面有三个 tab：

```text
认证
请求头
配置
```

当前截图停留在“认证”tab。

可见配置项：

```text
使用动态客户端注册
客户端 ID
客户端密钥
```

### 5.1 使用动态客户端注册

字段：

```text
使用动态客户端注册
```

初步理解：

```text
用于支持 OAuth 动态客户端注册一类的认证流程。
```

如果外部 MCP Server 支持动态注册，Dify 可以尝试自动完成客户端注册。

如果只是本地最小 MCP Server，并且不需要鉴权，后续实验可以优先关闭认证或保持最小配置。

如果 MCP Server 需要 OAuth / Client Credentials，则需要根据服务端要求填写。

### 5.2 客户端 ID / 客户端密钥

字段：

```text
客户端 ID
客户端密钥
```

含义：

```text
连接 MCP Server 时使用的客户端凭证。
```

如果 MCP Server 不需要认证，可以不填。

如果 MCP Server 要求固定客户端凭证，则填写服务端分配的 client_id / client_secret。

## 7. 入口 A：请求头

页面 tab：

```text
请求头
```

截图中未展开，但可以推测它用于配置请求 MCP Server 时附加的 HTTP Header。

常见用途：

```text
Authorization: Bearer xxx
X-API-Key: xxx
自定义租户标识
自定义环境标识
```

如果最小 MCP Server 不做鉴权，这一项可以先不配置。

## 8. 入口 A：配置

页面 tab：

```text
配置
```

截图中未展开，具体字段待后续观察。

需要后续记录：

- [ ] 是否有连接超时配置
- [ ] 是否有工具同步配置
- [ ] 是否有资源 / Prompt 开关
- [ ] 是否有 transport / session 相关配置
- [ ] 是否能测试连接

## 9. 入口 B：应用配置里的 MCP 服务

当前在已经创建好的 Chatflow / Workflow 应用配置栏里，也看到了：

```text
MCP 服务
状态：已停用
服务端点 URL：**********
```

应用示例：

```text
求职助手 Chatflow RAG V2
应用类型：CHATFLOW
```

开启时弹窗标题：

```text
添加描述以启用 MCP 服务
```

弹窗字段：

```text
描述 *
```

占位提示：

```text
解释此工具的功能以及 LLM 应如何使用它
```

按钮：

```text
启用 MCP 服务
```

从这些字段看，这个入口更像：

```text
把当前 Dify 应用暴露成一个 MCP Server Tool
```

也就是说，外部 MCP Client 可以通过该“服务端点 URL”调用这个 Chatflow / Workflow。

这里让用户填写“描述”，是因为当这个应用被暴露成 MCP 工具时，需要告诉外部 LLM：

```text
这个工具能做什么
什么时候应该调用它
调用时需要注意什么
```

这和普通 Tool 的描述很像，只不过工具背后不是一个简单 HTTP API，而是一个完整的 Dify 应用。

## 10. 入口 B 需要重点验证的问题

- [x] 开启后服务端点 URL 是否明文展示
- [ ] 服务端点 URL 是否可重新生成
- [x] 外部 MCP Client 如何调用这个服务端点
- [ ] 这个 MCP Server 暴露的是 Tool，还是同时暴露 Resource / Prompt
- [ ] Chatflow 的输入参数如何映射成 MCP Tool 参数
- [ ] Workflow 的输入变量如何映射成 MCP Tool 参数
- [ ] 调用结果是否等同于调用原应用 API
- [ ] 是否需要应用先发布
- [ ] 是否复用后端服务 API 的鉴权
- [ ] 是否有访问次数、日志、Trace 记录

当前已开启的 Chatflow RAG V2 MCP 服务端点：

```text
页面展示：http://localhost/mcp/server/JQy3oRVyReOPUyyk/mcp
本机访问：http://localhost:8080/mcp/server/JQy3oRVyReOPUyyk/mcp
```

说明：

```text
页面里省略了端口，但当前本地 Dify 通过 docker nginx 暴露在 8080。
因此从宿主机上的 MCP Client 访问时，需要拼上 8080。
```

如果从其他 Docker 容器访问，需要根据网络位置判断，可能不是 `localhost:8080`。

本机连通性验证：

```bash
curl -i --max-time 10 http://localhost:8080/mcp/server/JQy3oRVyReOPUyyk/mcp
```

返回：

```json
{
  "code": "method_not_allowed",
  "message": "The method is not allowed for the requested URL.",
  "status": 405
}
```

响应头中可看到：

```text
HTTP/1.1 405 METHOD NOT ALLOWED
Server: nginx/1.31.1
X-Version: 1.14.2
X-Env: PRODUCTION
```

结论：

```text
URL 和端口是可达的。
405 不是服务不可用，而是普通 GET 方法不被 MCP endpoint 接受。
后续需要使用 MCP Client 或符合 MCP streamable HTTP 协议的 POST 请求调用。
```

源码中文文案里有相关提示：

```text
mcp.server.title：MCP 服务
mcp.server.modal.addTitle：添加描述以启用 MCP 服务
mcp.server.modal.description：描述
mcp.server.modal.descriptionPlaceholder：解释此工具的功能以及 LLM 应如何使用它
mcp.server.modal.parameters：参数
mcp.server.modal.parametersTip：为每个参数添加描述，以帮助 LLM 理解其目的和约束条件。
mcp.server.publishTip：应用未发布。请先发布应用。
mcp.server.url：服务端点 URL
```

这进一步说明：

```text
应用级 MCP 服务需要描述和参数说明。
应用需要先发布。
它很可能是把 Dify 应用作为 MCP Server 暴露给外部。
```

## 11. 当前阶段判断

基于截图，当前可以先确认：

- Dify 有“接入外部 MCP 服务”的入口，此时 Dify 更像 MCP Client。
- Dify 也有“应用级 MCP 服务”的入口，此时 Dify 更像 MCP Server。
- “添加 MCP 服务 (HTTP)”需要外部 MCP Server 的服务端点 URL。
- “应用配置里的 MCP 服务”看起来会把当前 Chatflow / Workflow 暴露为 MCP 服务端点。
- 如果测试入口 A，本地实验需要额外启动一个 MCP Server。
- 如果测试入口 B，可以优先使用已经做好的 Chatflow RAG V2 或 Workflow 应用，不一定需要自己先写 MCP Server。

暂时还不能确认：

- 入口 A 添加成功后，Tools / Resources / Prompts 如何展示。
- 入口 B 对外暴露后，外部 MCP Client 如何调用。
- 应用级 MCP Server 是否只暴露 Tool，还是也暴露 Resource / Prompt。
- Chatflow / Workflow 的输入变量如何映射到 MCP 参数。
- MCP Tool 调用在 API streaming 中是否仍然表现为 `agent_thought`。
- MCP 调用和普通 OpenAPI Tool 在 trace 中有什么差异。

## 12. 下一步

下一步优先测试入口 B，因为它不需要先写外部 MCP Server：

```text
开启 Chatflow RAG V2 的 MCP 服务
填写工具描述
观察生成的服务端点 URL
记录是否需要发布应用
尝试用 MCP Client 调用这个服务端点
```

可以先用 Codex 作为 MCP Client 做最小测试。

Codex CLI 支持添加 streamable HTTP MCP server：

```bash
/Applications/Codex.app/Contents/Resources/codex mcp add dify-chatflow-rag-v2 \
  --url http://localhost:8080/mcp/server/JQy3oRVyReOPUyyk/mcp
```

查看是否添加成功：

```bash
/Applications/Codex.app/Contents/Resources/codex mcp list
```

注意：

```text
添加 MCP Server 会写入 ~/.codex/config.toml。
当前 Codex 会话不一定会热加载新 MCP Server，通常需要新开一个 Codex 会话再测试。
如果 Codex 调用时卡在权限审批，需要先确认审批弹窗是否允许调用 dify-chatflow-rag-v2。
如果审批通过后仍然没有调用，问题更可能在 Codex 当前会话未加载该 MCP tool，而不是 Dify endpoint 不可达。
```

实际验证结论：

```text
Codex 已能作为 MCP Client 调用 dify-chatflow-rag-v2。
```

关键前提：

```text
Codex 会话需要使用“默认权限”模式。
```

如果在另一个会话中选择“自动审查”模式，MCP 调用会卡在权限审批处，无法正常放行。

切换为“默认权限”后，Codex 在执行 MCP 调用时会弹出权限提示。

用户点击允许后，Codex 可以正常调用 Dify 暴露出来的 MCP 服务，并拿到 Chatflow 返回结果。

日志与 Trace 观察：

```text
调用来源：Codex -> dify-chatflow-rag-v2 MCP
用户问题：Dify 最小镜像升级流程是什么？
Dify 日志与标注：可以看到本次调用记录
Trace 节点：用户输入 -> 参数提取 -> 是否符合提问(IF/ELSE) -> 知识检索 -> LLM -> 最终返回
引用文档：dify-thread-context.md、knowledge-rag.md、dify-learning-plan.md
```

关键结论：

```text
应用级 MCP Server 暴露的是整个 Chatflow 应用能力。
外部 MCP Client 调用该服务时，Dify 内部仍然执行原 Chatflow 的完整编排链路。
因此 MCP 更像是应用能力的标准协议入口，而不是替代 Chatflow / Workflow 节点执行逻辑。
```

因此这次问题的根因不是：

```text
Dify MCP Server 不可达
MCP endpoint URL 写错
Chatflow MCP 服务未启用
```

而是：

```text
Codex 当前会话权限模式为“自动审查”，导致 MCP 调用审批无法放行。
```

然后再测试入口 A：

```text
准备一个外部 MCP Server
在 Dify “添加 MCP 服务 (HTTP)”中接入
观察 Dify 如何把外部 MCP Tool 暴露给 Agent 使用
```
