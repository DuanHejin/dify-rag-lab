# Agent + Tool 学习计划

> 目标：用 Dify Agent 跑通一次最小工具调用，理解 Agent 应用、Tool 定义、参数生成、工具执行、最终回答、API 事件和日志追踪，并和自研 Super Agent Console 的 Tool Schema / Tool Router / Tool Handler / Agent Run 做对照。
>
> 使用方式：每完成一步，就把对应复选框从 `[ ]` 改成 `[x]`。

## 1. 学习目标

- [x] 理解 Dify Agent 和 Chat Assistant 的区别
- [x] 理解 Agent 为什么需要 Tool
- [x] 理解 Tool 的名称、描述、参数 schema 对模型选择工具的影响
- [x] 理解 Agent 如何生成 Tool 参数
- [x] 理解 Tool 返回结果如何进入最终回答
- [x] 验证 Agent blocking API 限制
- [x] 验证 Agent streaming API
- [x] 记录 tool call 相关事件
- [x] 对照 Super Agent Console 的 Tool Router / Tool Handler / AgentEvent

## 2. 阶段定位

已完成基础：

- [x] Chat Assistant：普通聊天、多轮、API
- [x] Knowledge / RAG：知识库、切片、召回、Rerank、RAG API
- [x] Chatflow：对话式流程、知识检索、参数提取、IF/ELSE
- [x] Workflow：一次性任务、输入变量、节点传递、API、日志追踪

本阶段要验证的是：

```text
用户问题
↓
Agent 判断是否需要工具
↓
模型生成工具参数
↓
Tool 执行
↓
Tool 结果回到 Agent
↓
Agent 生成最终回答
```

和前面几个阶段的区别：

```text
Chat Assistant：模型直接回答
Chatflow：人工编排对话流程
Workflow：人工编排一次性任务流程
Agent + Tool：模型在运行时判断是否调用工具
```

## 3. 建议应用信息

建议先做最小实验，不接真实复杂业务。

```text
应用名称：求职助手 Agent Tool
应用类型：Agent
模型：doubao-seed-2-0-lite-260428
测试主题：根据用户问题，必要时调用岗位信息工具，再生成求职建议
API Key 占位符：DIFY_AGENT_API_KEY
```

## 4. Tool 方案选择

优先方案：自定义一个最小 HTTP Tool。

工具用途：

```text
根据岗位类型返回一段 mock 岗位信息。
```

示例工具行为：

```text
输入：job_type = 前端开发
输出：
{
  "job_type": "前端开发",
  "market_summary": "前端岗位更重视工程化、AI 应用接入、性能优化和项目表达。",
  "required_skills": ["JavaScript", "Vue/React", "工程化", "AI 应用交互", "性能优化"],
  "interview_focus": ["项目表达", "手写题", "浏览器原理", "工程化经验"]
}
```

为什么先用 mock：

- [x] 避免一开始被真实业务接口、鉴权、网络问题干扰
- [x] 重点观察 Agent 是否会选择 Tool
- [x] 重点观察参数是否生成正确
- [x] 重点观察 Tool 返回如何进入最终回答

可选实现方式：

```text
方式 A：本地临时 HTTP 服务，Dify 容器通过 host.docker.internal 访问。
方式 B：如果 Dify 页面支持内置 / 自定义 API Tool，可直接在 Dify 工具配置中注册 OpenAPI schema。
方式 C：如果本地网络访问有问题，再换成公网 mock 接口或先用 Dify 内置工具。
```

## 5. 创建 Agent 应用

目标：先创建一个最小 Agent，不急着接 Tool。

- [x] 创建 Agent 应用
- [x] 应用命名为 `求职助手 Agent Tool`
- [x] 选择豆包模型
- [x] 配置基础 Prompt
- [x] 在控制台测试普通问题
- [x] 确认不需要工具时，Agent 可以直接回答

建议基础 Prompt：

```text
你是一个求职准备 Agent。

你可以根据用户问题给出中文求职建议。
当用户需要查询岗位信息、岗位能力要求、岗位面试重点时，优先调用可用工具获取信息，再基于工具结果回答。
如果用户只是咨询通用备考建议，可以直接回答，不必调用工具。

回答要求：
- 中文输出
- 结构清晰
- 建议具体可执行
- 不要编造工具没有返回的信息
```

测试问题：

```text
我准备面试前端开发，只有 3 天时间，怎么准备？
```

预期：

```text
Agent 可以直接回答，不一定调用工具。
```

实测结果：

```text
用户问题：我准备面试前端开发，只有 3 天时间，怎么准备？
结果：Agent 直接回答了准备建议，没有调用工具，并且回答开头包含【求职助手-Agent-V1】。
结论：Agent 在无工具或不需要工具的场景下，可以作为普通求职助手直接工作。
```

## 6. 准备 mock Tool

目标：准备一个可被 Dify 调用的工具接口。

- [x] 确定 Tool 名称
- [x] 确定 Tool 描述
- [x] 确定 Tool 输入参数
- [x] 确定 Tool 输出字段
- [x] 准备 mock HTTP 接口或 Dify 自定义工具配置
- [x] 在 Dify 之外先验证 Tool 接口可调用

建议 Tool 设计：

```text
Tool 名称：get_job_profile
中文名称：查询岗位画像
用途：根据岗位类型返回岗位能力要求和面试重点。
```

输入参数：

```json
{
  "job_type": "前端开发"
}
```

输出字段：

```json
{
  "job_type": "前端开发",
  "market_summary": "...",
  "required_skills": ["..."],
  "interview_focus": ["..."]
}
```

Tool 描述建议：

```text
当用户询问某个岗位的能力要求、岗位画像、面试重点、准备方向时，使用该工具查询岗位信息。
```

当前 mock 服务：

```text
脚本：dify-rag-lab/scripts/mock-job-profile-server.mjs
本机地址：http://localhost:8787
Dify 容器访问地址：http://host.docker.internal:8787
接口：GET /job-profile?job_type=前端开发
```

实测结果：

```text
本机 curl 调用成功。
Dify 添加工具界面点击测试也能拿到结果。
```

## 7. 注册 Tool 到 Dify

目标：让 Agent 能看到并使用这个工具。

- [x] 在 Dify 中进入工具 / Tool 配置区域
- [x] 新增自定义 API Tool 或选择合适工具类型
- [x] 填写 Tool 名称
- [x] 填写 Tool 描述
- [x] 配置参数 schema
- [x] 配置请求地址
- [x] 配置请求方式
- [x] 测试 Tool 调用
- [x] 保存 Tool

重点观察：

```text
Tool 描述是不是足够清晰？
参数名是不是模型容易理解？
Dify 页面能不能单独测试 Tool？
容器访问本地 mock 服务是否需要 host.docker.internal？
```

## 8. Agent 绑定 Tool

目标：让 Agent 应用具备工具调用能力。

- [x] 在 Agent 应用中启用 Tool
- [x] 选择 `get_job_profile`
- [x] 调整 Agent Prompt，让模型知道什么时候调用工具
- [x] 发布 / 保存应用配置

建议补充 Prompt：

```text
当用户问题涉及“岗位要求”“岗位画像”“岗位面试重点”“这个岗位要准备什么能力”时，请调用 get_job_profile 工具。
工具返回后，请结合用户原问题和工具结果生成回答。
不要在没有工具返回的情况下编造岗位市场信息。
```

## 9. 控制台验证 Tool 调用

目标：在页面里观察 Agent 是否真的调用 Tool。

测试 Case 1：不需要工具

```text
我准备面试前端开发，只有 3 天时间，怎么准备？
```

预期：

```text
Agent 可以直接回答。
```

测试 Case 2：需要工具

```text
查询一下前端开发岗位画像，然后告诉我应该重点准备什么。
```

预期：

```text
Agent 调用 get_job_profile。
Tool 参数中 job_type = 前端开发。
最终回答中使用 Tool 返回的 required_skills / interview_focus。
```

测试 Case 3：参数不明确

```text
帮我查一下这个岗位要准备什么。
```

预期：

```text
如果缺少岗位类型，Agent 应该追问或说明需要补充岗位方向。
```

待记录：

- [x] Agent 是否调用了 Tool
- [x] Tool 参数是否正确
- [x] Tool 输出是否正确
- [x] 最终回答是否引用了 Tool 结果
- [x] 未调用 Tool 的情况是否合理
- [x] 参数不明确时是否会追问

已验证 Case：

```text
用户问题：
查询一下前端开发岗位画像，然后告诉我应该重点准备什么。

结果：
Agent 先说明将调用工具获取信息，然后基于工具返回的前端开发岗位画像生成回答。

回答内容使用了 mock Tool 返回的核心信息：
- market_summary：工程化能力、复杂业务交付能力、AI 应用接入能力、项目表达能力
- required_skills：JavaScript、Vue 或 React、工程化、性能优化、AI 应用交互
- interview_focus：项目表达、手写题、浏览器原理、工程化经验、AI 产品接入经验

结论：
Agent 能根据“查询岗位画像”意图调用 get_job_profile，并将 Tool 结果整合进最终回答。
```

边界测试记录：

```text
Case 1：
用户问题：我准备面试前端开发，只有 3 天时间，怎么准备？
结果：Agent 仍然调用了工具，并结合岗位画像生成 3 天准备方案。
观察：该问题虽然可以直接回答，但因为包含“前端开发”岗位和“准备”意图，当前 Prompt 下模型倾向于调用工具。
结论：Tool 调用不算错误，但“普通备考建议不必调用工具”的边界还不够稳定。

Case 2：
用户问题：帮我查一下这个岗位要准备什么。
结果：Agent 没有乱调用工具，而是要求用户补充具体岗位类型。
结论：参数不明确时追问符合预期。
```

## 10. API Key 与 Blocking API

目标：用 API 调用 Agent 应用。

- [x] 生成 Agent 应用 API Key
- [x] 记录 API Base URL
- [x] 验证 blocking 调用限制：Agent Chat App 不支持 blocking mode
- [x] 用 streaming 调用需要工具的问题
- [x] 观察响应字段
- [x] 记录 tool call 相关字段
- [x] 记录 usage / token / latency

预计接口：

```text
POST /v1/chat-messages
```

请求占位：

```bash
curl --location --request POST 'http://localhost:8080/v1/chat-messages' \
  --header 'Authorization: Bearer DIFY_AGENT_API_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "inputs": {},
    "query": "查询一下前端开发岗位画像，然后告诉我应该重点准备什么。",
    "response_mode": "blocking",
    "conversation_id": "",
    "user": "abc-123"
  }'
```

待观察：

```text
Agent 应用是否仍然使用 /v1/chat-messages？
blocking 响应里是否直接包含最终 answer？
metadata 或其他字段里是否能看到工具调用信息？
```

实测结果：

```text
Agent 应用仍然使用 POST /v1/chat-messages。
但 Agent Chat App 不支持 blocking mode。

blocking 请求返回：
{
  "code": "invalid_param",
  "message": "Agent Chat App does not support blocking mode",
  "status": 400
}
```

结论：

```text
当前 Dify Agent Chat App 只能使用 streaming 模式调用。
Agent 的工具调用过程需要通过 streaming 事件观察。
```

## 11. Streaming API 与 Tool 事件

目标：观察工具调用在 streaming 中如何体现。

- [x] 用 streaming 调用需要工具的问题
- [x] 记录 message / message_end
- [x] 记录 agent / tool 相关事件
- [x] 记录 Tool 调用开始事件
- [x] 记录 Tool 调用结束事件
- [x] 记录 Tool 输入参数
- [x] 记录 Tool 输出结果
- [x] 对比 Chatflow / Workflow streaming 事件

请求占位：

```bash
curl --location --request POST 'http://localhost:8080/v1/chat-messages' \
  --header 'Authorization: Bearer DIFY_AGENT_API_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "inputs": {},
    "query": "查询一下前端开发岗位画像，然后告诉我应该重点准备什么。",
    "response_mode": "streaming",
    "conversation_id": "",
    "user": "abc-123"
  }'
```

重点问题：

```text
工具调用事件名是什么？
Tool input / output 出现在什么事件里？
最终 answer 和工具结果是什么关系？
如果 Tool 报错，streaming 中如何体现？
```

实测记录：

```text
用户问题：
查询一下后端开发岗位画像，然后告诉我应该重点准备什么。

主要事件：
- agent_thought
- agent_message
- message_end

工具调用信息出现在 agent_thought 中：
tool = get_job_profile
tool_input = {"get_job_profile": {"job_type": "后端开发"}}

工具返回结果出现在 agent_thought.observation 中：
job_type = 后端开发
market_summary = 后端开发岗位当前更重视接口设计、数据库建模、缓存、稳定性和服务部署能力。
required_skills = 接口设计、数据库、缓存、消息队列、服务部署
interview_focus = 项目架构、数据库设计、高并发处理、故障排查、服务稳定性

最终回答通过 agent_message 增量输出，并在 message_end 返回 usage。
```

## 12. 日志与追踪

目标：从 Dify 日志里观察 Agent 决策和工具调用。

- [x] 查看 Agent 应用日志
- [x] 找到调用 Tool 的记录
- [x] 查看模型是否先做工具选择
- [x] 查看 Tool 输入
- [x] 查看 Tool 输出
- [x] 查看最终回答
- [x] 查看 token、耗时、费用
- [x] 记录日志中是否能清晰区分模型调用和工具调用

重点对照：

```text
Chatflow 日志：偏对话结果
Workflow 日志：偏节点执行过程
Agent 日志：重点看模型决策 + 工具调用 + 最终回答
```

当前实际观察：

```text
Dify 日志与标注列表中，Agent 记录仍然主要展示最终内容。
页面内容里能看到模型写出的“我将调用相关工具”“岗位信息已获取”等文字，因此可以间接猜测发生了工具调用。

但在预览 / 日志详情的小入口里，进入“追踪”tab 后，可以看到 Agent 的执行过程：
- LLM
- get_job_profile
- 最终处理 LLM

get_job_profile 追踪中能看到 INPUT：
{
  "job_type": "测试开发"
}

也能看到 OUTPUT。

真正能明确看到工具调用过程的是 streaming API：
- agent_thought.tool
- agent_thought.tool_input
- agent_thought.observation
```

修正结论：

```text
Agent 日志与标注列表：偏最终对话内容。
Agent 预览 / 日志详情的追踪 tab：可以看到工具调用节点的 input / output。
Agent streaming API：更适合从接口层观察工具调用过程。
如果要像 Super Agent Console 一样看 timeline，需要关注 streaming 事件或自研侧显式记录 AgentEvent。
```

## 13. 错误与边界实验

目标：验证 Agent + Tool 的失败场景。

- [x] Tool 接口不可用时，Agent 如何回复
- [x] Tool 参数缺失时，Agent 是否追问
- [ ] Tool 返回空结果时，Agent 是否编造（未做：当前 mock 对未知岗位返回兜底结果，不是空结果）
- [x] Tool 返回异常字段时，Agent 是否能兜底
- [x] 用户问题不需要工具时，Agent 是否避免过度调用

建议错误 Case：

```text
1. mock 服务停止
2. job_type 为空
3. job_type = 不存在的岗位
4. Tool 返回空数组
5. 用户只是问通用建议
```

已验证 Case：

```text
前置操作：停掉本机 mock 服务。

用户问题：
查询一下产品经理岗位画像，然后告诉我应该重点准备什么。

结果：
Agent 在 <think> 中表示将调用工具查询产品经理岗位画像。
随后出现“调用工具出现问题，我将按要求整理产品经理求职准备建议。”
最终仍然基于模型通用知识生成了一份产品经理岗位准备建议。

观察：
Agent 能感知工具调用出现问题，但最终回答没有明确告诉用户“工具当前不可用”。
它选择退回到模型通用知识继续回答。

结论：
如果业务要求严格基于工具结果回答，需要进一步收紧 Prompt：
当工具调用失败时，必须明确说明工具不可用，不要继续编造岗位画像。
```

已验证 Case：

```text
用户问题：
查询一下测试开发岗位画像，然后告诉我应该重点准备什么。

结果：
Agent 调用 get_job_profile，参数为：
{
  "job_type": "测试开发"
}

mock 服务中没有预置“测试开发”，因此返回兜底岗位画像：
market_summary = 测试开发岗位暂无预置画像，请结合岗位 JD、项目经历和目标公司要求做针对性准备。
required_skills = 岗位基础能力、项目经验、问题拆解、沟通表达
interview_focus = 岗位理解、项目复盘、核心技能、真实经验

观察：
这不是工具没有查到后报错，而是 mock 服务按兜底逻辑返回了 HTTP 200 和默认画像。
因此 Agent 会把它当成一次成功工具调用，并基于兜底结果生成回答。

额外现象：
Dify 追踪 tab 中 get_job_profile 的 OUTPUT 出现两段 JSON 拼接：
一段紧凑 JSON + 一段带空格的 JSON。
由于本机 mock 服务 curl 只返回一份 JSON，初步判断重复拼接发生在 Dify 自定义工具包装 / 输出展示层。
后续可通过补充 OpenAPI responses schema 或修改工具返回结构继续验证。
```

## 14. 和 Super Agent Console 对照

目标：把 Dify Agent + Tool 映射到自研项目。

- [x] 对照 Dify Tool 与 Tool Schema
- [x] 对照 Tool 描述与 Tool Router 的选择依据
- [x] 对照 Tool 参数 schema 与参数校验
- [x] 对照 Tool 执行与 Tool Handler
- [x] 对照 Agent 工具选择与 tool planning
- [x] 对照 Tool 返回与 AgentEvent
- [x] 对照最终回答与 final_answer
- [x] 总结 Dify Agent 哪些能力是平台封装
- [x] 总结自研项目哪些能力需要代码控制

初步对照：

| Dify | Super Agent Console |
| --- | --- |
| Agent 应用 | Agent Run |
| Tool 名称 / 描述 | Tool Schema |
| Tool 参数 schema | Tool 参数校验 |
| 模型选择工具 | Tool Router / tool planning |
| Tool 执行 | Tool Handler |
| Tool 输入 / 输出 | AgentEvent payload |
| 最终回答 | final_answer |

阶段对照结论：

```text
Dify Agent + Tool：
- 通过工具名称、描述和 OpenAPI schema 暴露工具能力。
- 模型在运行时判断是否调用工具。
- 工具调用细节主要出现在 streaming API 的 agent_thought 中。
- 页面预览 / 日志详情的小入口中也可以通过追踪 tab 看到 LLM → Tool → LLM。
- 平台封装了工具选择、HTTP 调用、结果回填和最终回答生成。

Super Agent Console：
- Tool Schema、Tool Router、Tool Handler 是代码层显式对象。
- Timeline / AgentEvent 把 tool_call_start、tool_call_result、final_answer 作为一等事件展示。
- 可观测性更显式，更适合解释 Agent Runtime 内部机制。

核心差异：
Chatflow / Workflow 是人工提前编排流程。
Agent + Tool 是模型运行时选择工具。
Super Agent Console 则把模型决策、工具调用和结果回填显式记录到 timeline。
```

## 15. 阶段产出

- [x] 创建 `dify-rag-lab/docs/05-agent-tool/plan.md`
- [x] 创建 `dify-rag-lab/docs/05-agent-tool/api.md`
- [x] 保存 Agent 应用信息
- [x] 保存 Tool schema
- [x] 保存 Tool mock 接口信息
- [x] 保存 blocking curl 示例
- [x] 保存 streaming curl 示例
- [x] 保存 tool call 事件记录
- [x] 保存日志观察结论

## 16. 阶段完成标准

- [x] 至少创建 1 个 Agent 应用
- [x] 至少注册 1 个 Tool
- [x] Agent 能在需要时调用 Tool
- [x] Agent 能在不需要时直接回答
- [x] 能看到 Tool 输入参数
- [x] 能看到 Tool 输出结果
- [x] blocking API 限制已验证：Agent Chat App 不支持 blocking mode
- [x] streaming API 调用成功
- [x] 能说清 Agent 和 Chat Assistant 的区别
- [x] 能说清 Agent + Tool 和 Chatflow / Workflow 的区别
- [x] 能说清 Dify Tool 与自研 Tool Router / Tool Handler 的对应关系

## 17. 阶段结论

```text
Agent + Tool 阶段已经跑通最小闭环。

页面侧：
- Agent 普通问题可直接回答。
- 明确查询岗位画像时会调用 get_job_profile。
- 参数不明确时会追问岗位方向。
- mock 服务停止时，Agent 能感知工具失败，但默认会退回模型通用知识继续回答。
- 未预置岗位会返回 mock 服务兜底画像，Agent 会按成功工具结果继续回答。
- 预览 / 日志详情的小入口中，追踪 tab 可以看到 LLM → Tool → LLM。

API 侧：
- Agent 应用仍使用 /v1/chat-messages。
- Agent Chat App 不支持 blocking mode。
- streaming 中通过 agent_thought 查看 tool、tool_input、observation。
- 最终回答通过 agent_message 流式输出。
- message_end 返回 usage，retriever_resources 为空是正常现象。

工程理解：
- Dify Agent + Tool 更接近“模型运行时选择工具”。
- Chatflow / Workflow 更接近“人工提前编排流程”。
- 自研 Super Agent Console 的 Timeline / AgentEvent 能更显式地展示 Tool Router / Tool Handler / tool_call_result。
```
