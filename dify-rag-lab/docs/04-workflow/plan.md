# Workflow 学习计划

> 目标：用 Dify Workflow 跑通一个一次性任务编排流程，理解输入变量、节点输出、变量引用、End 输出、API 调用和 streaming 节点事件，并和 Chatflow / 自研 Super Agent Console 做对照。
>
> 使用方式：每完成一步，就把对应复选框从 `[ ]` 改成 `[x]`。

## 1. 学习目标

- [x] 理解 Workflow 和 Chatflow 的核心区别
- [x] 理解 Workflow 的输入变量和输出变量
- [x] 理解 LLM 节点之间如何传递结果
- [x] 理解 End 节点如何返回最终输出
- [x] 验证 Workflow API 的 blocking 和 streaming
- [ ] 记录 Workflow 与自研 Skill Workflow / Agent Run 的概念对照

## 2. 准备工作

已有基础：

- [x] 本地 Dify 已启动：`http://localhost:8080`
- [x] 已接入豆包聊天模型：`doubao-seed-2-0-lite-260428`
- [x] 已完成 Chat Assistant 阶段
- [x] 已完成 Knowledge / RAG 阶段
- [x] 已完成 Chatflow V1 / V2 基础验证

本阶段暂不接知识库，先验证纯 Workflow 编排。

建议应用：

```text
应用名称：求职准备 Workflow
应用类型：Workflow
模型：doubao-seed-2-0-lite-260428
测试主题：根据岗位和准备时间生成面试准备计划
```

## 3. 创建 Workflow 应用

目标：创建一个最小可运行的 Workflow 应用。

- [x] 在 Dify 控制台创建 Workflow 应用
- [x] 应用命名为 `求职准备 Workflow`
- [x] 进入 Workflow 编排画布
- [x] 观察默认 Start / End 节点
- [x] 记录 Workflow 默认入口节点和结束节点

当前节点骨架：

```text
开始（用户输入）
-> LLM
-> LLM 2
-> 输出
```

记录项：

```text
应用名称：求职准备 Workflow
应用类型：Workflow
模型供应商：langgenius/volcengine_maas/volcengine_maas
模型名称：doubao-seed-2-0-lite-260428
```

## 4. 配置 Start 输入变量

目标：理解 Workflow 不是天然聊天入口，而是通过输入变量驱动一次性任务。

建议输入变量：

```text
job_type: 岗位方向，例如“前端开发”
days: 准备时间，例如 3
weak_points: 薄弱点，例如“算法、项目表达”
```

待完成：

- [x] 添加 `job_type` 输入变量
- [x] 添加 `days` 输入变量
- [x] 添加 `weak_points` 输入变量
- [x] 设置变量类型和是否必填
- [x] 在调试运行中输入一组测试值

当前配置：

```text
job_type：岗位类型，文本，必填
days：天数，数字，必填
weak_points：薄弱项目，文本，非必填
```

测试输入：

```text
job_type = 前端开发
days = 3
weak_points = 算法、项目表达
```

## 5. 添加 LLM 节点 1：提取准备重点

目标：让第一个 LLM 节点只负责分析输入，输出结构化的准备重点。

节点命名：

```text
提取准备重点
```

建议 Prompt：

```text
你是一个求职准备分析助手。
请根据用户输入的岗位方向、准备时间和薄弱点，提取本次面试准备的核心重点。

岗位方向：{{job_type}}
准备时间：{{days}}
薄弱点：{{weak_points}}

请用中文输出，包含：
1. 备考优先级
2. 最需要补齐的能力
3. 不建议投入太多时间的内容
```

待完成：

- [x] 添加 LLM 节点 1
- [x] 选择豆包模型
- [x] 在 Prompt 中引用 Start 输入变量
- [x] 调试节点输出
- [x] 记录节点输出字段名

当前记录：

```text
节点名称：提取准备重点
模型：doubao-seed-2-0-lite-260428
当前状态：节点可以运行并输出准备重点分析。
```

调试记录：

```text
单独运行 LLM 节点时，手动输入变量可能和从 Start 全链路运行时表现不一致。
从用户输入节点开始运行，并输入 job_type、days 后，流转到 LLM 节点时可以正确识别：
我是前端开发，有三天的准备时间。
```

节点输出字段：

```text
text
```

## 6. 添加 LLM 节点 2：生成准备计划

目标：让第二个 LLM 节点引用第一个 LLM 节点输出，生成最终可执行计划。

节点命名：

```text
生成准备计划
```

建议 Prompt：

```text
你是一个求职准备计划助手。
请根据上一步提取的准备重点，生成一份可执行的面试准备计划。

上一步准备重点：
{{提取准备重点.text}}

输出要求：
- 中文回答
- 按天拆分
- 每天任务要具体可执行
- 不要泛泛而谈
```

待完成：

- [x] 添加 LLM 节点 2
- [x] 选择豆包模型
- [x] 引用 LLM 节点 1 的输出
- [x] 调试节点输出
- [x] 对比直接单节点生成和两节点生成的区别

当前记录：

```text
测试输入：
job_type = 前端开发
days = 3
weak_points = 算法

LLM 1：提取准备重点
结果：正确接收到 job_type、days、weak_points，并围绕“前端开发 + 3 天 + 算法薄弱”输出准备重点。

LLM 2：生成准备计划
结果：正确接收到 LLM 1 的 text 输出，并生成了以算法专项为重点的 3 天前端面试准备计划。
```

观察：

```text
LLM 2 引用的是 LLM 1 的 text 字段，因此会把 LLM 1 输出中的 <think> 内容一起带入下游 Prompt。
当前不影响流程跑通，但会增加 token 消耗和上下文噪声。
后续如果要优化，可以考虑：
1. 让 LLM 1 使用结构化输出，只把可用字段传给 LLM 2。
2. 在 LLM 2 Prompt 中明确要求忽略上一步内容里的 <think> 片段。
3. 增加代码 / 模板节点清洗 LLM 1 的 text。
```

## 7. 配置 End 节点输出

目标：理解 Workflow 最终返回值来自 End 节点，而不是自动返回所有节点结果。

待完成：

- [x] 将 LLM 节点 2 的输出连接到 End 节点
- [x] 配置 End 节点输出字段，例如 `answer`
- [x] 确认最终运行结果只返回 End 配置的输出
- [x] 记录 End 输出结构

建议输出：

```text
answer = 生成准备计划.text
```

当前记录：

```text
输出节点已配置为输出 LLM 2 的 text。
完整运行后，最终结果可以展示 LLM 2 生成的 3 天面试准备计划。
```

观察：

```text
LLM 2 的 text 中包含多个 <think> 片段。
Dify 页面展示时会把这些 <think> 片段渲染为可折叠的“已深度思考”块。
由于同一个 text 中包含多个 <think>，折叠块右侧时间显示均为 0.0s，疑似是前端兼容展示逻辑的计时限制。
该现象不影响 Workflow 的 End 输出和页面结果展示。
```

## 8. 控制台调试运行

目标：在页面中跑通完整 Workflow。

- [x] 输入 `job_type = 前端开发`
- [x] 输入 `days = 3`
- [x] 输入 `weak_points = 算法、项目表达`
- [x] 运行 Workflow
- [x] 查看每个节点的输入
- [x] 查看每个节点的输出
- [x] 查看总耗时和 token 用量
- [x] 确认 End 节点输出符合预期

## 9. 发布与 API Key

目标：让 Workflow 可以通过 API 调用。

- [x] 发布 Workflow 应用
- [x] 生成 API Key
- [x] 记录 API Base URL
- [x] 记录 API Key 占位符

建议占位符：

```text
DIFY_WORKFLOW_API_KEY
```

## 10. Blocking API 验证

目标：验证 Workflow 同步调用。

- [x] 调用 Workflow blocking API
- [x] 传入 Start 输入变量
- [x] 观察返回字段
- [x] 记录 `workflow_run_id`
- [x] 记录 `data.outputs`
- [x] 记录 usage / token / latency

待确认接口：

```text
POST /v1/workflows/run
```

当前记录：

```text
接口：POST http://localhost:8080/v1/workflows/run
鉴权：Authorization: Bearer DIFY_WORKFLOW_API_KEY
response_mode：blocking
workflow_run_id：269f5938-3eb3-43e8-845e-51cbaf7336c2
status：succeeded
输出位置：data.outputs.answer
elapsed_time：78.028961
total_tokens：4136
total_steps：4
```

注意：

```text
Workflow API 返回核心结果在 data.outputs，不是 Chatflow 的 answer 顶层字段。
Workflow API 不需要 conversation_id 语义，当前请求里即使传了 conversation_id 也不作为多轮会话使用。
```

## 11. Streaming API 验证

目标：验证 Workflow 流式事件和 Chatflow 事件的区别。

- [x] 调用 Workflow streaming API
- [x] 记录 `workflow_started`
- [x] 记录 `node_started`
- [x] 记录 `node_finished`
- [x] 记录 `workflow_finished`
- [x] 观察是否有 `message` 事件
- [x] 对比 Chatflow streaming 事件

当前记录：

```text
接口：POST http://localhost:8080/v1/workflows/run
response_mode：streaming
workflow_run_id：cd4eaf4c-b0f5-45d4-977d-59ce38f228b1
task_id：642a2a87-b96d-4cfd-a2a0-b27b18f84fe3
```

事件序列：

```text
workflow_started
node_started / node_finished：start 用户输入
node_started / node_finished：llm 提取准备重点
node_started：llm 生成准备计划
text_chunk：生成准备计划.text 的增量输出
node_finished：llm 生成准备计划
node_started / node_finished：end 输出
workflow_finished
```

观察：

```text
Workflow streaming 也会有增量文本事件，但事件名是 text_chunk，不是 Chatflow 的 message。
最终结果仍在 workflow_finished.data.outputs.answer 中。
节点执行详情主要通过 node_started / node_finished 观察。
```

重点观察：

```text
Workflow streaming 是否更强调节点执行过程？
Workflow 是否没有 conversation_id？
Workflow 返回的是 outputs 还是 answer？
```

## 12. 日志与运行记录

目标：观察 Workflow 的运行记录和节点 trace。

- [x] 在日志 / 运行记录中查看 Workflow 调用
- [x] 查看节点输入输出
- [x] 查看 token 用量
- [x] 查看耗时
- [ ] 记录失败时错误位置是否清晰

当前观察：

```text
Workflow 日志点开单条记录后，可以看到“结果 / 详情 / 追踪”三个 tab。
详情里可以看到本次运行的开始输入和最终输出。
追踪里可以看到每一个节点的运行情况，包括节点输入、节点输出、耗时和 token 用量。

对比 Chatflow：
Chatflow 的日志更偏对话结果记录，只能看到一条记录的最终结果、引用内容和用量信息；
Workflow 的日志更适合看执行过程和变量传递。
```

## 13. 和 Chatflow 对照

目标：明确 Workflow 的定位。

- [x] 对照入口：Workflow 输入变量 vs Chatflow 用户 query
- [x] 对照状态：Workflow 一次性任务 vs Chatflow 多轮会话
- [x] 对照输出：Workflow End outputs vs Chatflow Answer
- [x] 对照 API：`/v1/workflows/run` vs `/v1/chat-messages`
- [x] 对照 streaming：节点事件是否一致
- [x] 对照适用场景

初步判断：

```text
Workflow：适合一次性任务、批处理、结构化处理、后台自动化流程。
Chatflow：适合多轮聊天、用户追问、对话式 RAG、带会话状态的交互。

日志侧：
Workflow 日志用于看执行过程，Chatflow 日志用于看对话结果。
```

## 14. 和 Super Agent Console 对照

目标：把 Dify Workflow 翻译成自研项目里的工程概念。

- [ ] 对照 Workflow 与 Skill Workflow
- [ ] 对照 Start 输入与 Agent Run input
- [ ] 对照 LLM 节点与 Skill step
- [ ] 对照节点输出与 AgentEvent payload
- [ ] 对照 End 输出与 final_answer
- [ ] 总结哪些能力适合平台编排
- [ ] 总结哪些能力适合代码化 Runtime

## 15. 阶段产出

- [x] 完成 `dify-rag-lab/docs/04-workflow/api.md`
- [x] 保存 Workflow blocking curl 示例
- [x] 保存 Workflow streaming curl 示例
- [x] 保存节点输入输出样例
- [x] 更新 `dify-rag-lab/docs/00-overview/learning-plan.md`

## 16. 阶段完成标准

- [x] 至少创建 1 个 Workflow 应用
- [x] 至少包含 Start、两个 LLM、End 节点
- [x] 能通过页面调试运行完整 Workflow
- [x] 能说清上游节点输出如何传给下游节点
- [x] API blocking 调用成功
- [x] API streaming 调用成功
- [x] 能说清 Workflow 与 Chatflow 的区别
- [ ] 能说清 Workflow 与自研 Skill Workflow 的对应关系
